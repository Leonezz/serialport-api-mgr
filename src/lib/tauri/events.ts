/**
 * Strongly-typed Tauri event system
 * Provides type-safe event listening with compile-time validation
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { z } from "zod";

// ============================================================================
// Event Name Constants (matching Rust event_names module)
// ============================================================================

export const TauriEventNames = {
  PORT_OPENED: "port_opened",
  PORT_CLOSED: "port_closed",
  PORT_READ: "port_read",
  PORT_ERROR: "port_error",
  PORT_STATUS: "port_status",
} as const;

// ============================================================================
// Event Payload Schemas (Zod validation) - Using camelCase to match Rust serde
// ============================================================================

export const PortOpenedEventSchema = z.object({
  portName: z.string(),
  timestampMs: z.number(),
});

export const PortClosedEventSchema = z.object({
  portName: z.string(),
  reason: z.string(),
  timestampMs: z.number(),
});

export const PortReadEventSchema = z.object({
  portName: z.string(),
  timestampMs: z.number(),
  data: z.array(z.number()),
});

export const PortErrorEventSchema = z.object({
  portName: z.string().optional(),
  error: z.string(),
});

export const PortStatusEventSchema = z.object({
  portName: z.string(),
  cts: z.boolean(),
  dsr: z.boolean(),
  cd: z.boolean(),
  ring: z.boolean(),
});

// Type inference from schemas - types will be exported from central types.ts
type PortOpenedEvent = z.infer<typeof PortOpenedEventSchema>;
type PortClosedEvent = z.infer<typeof PortClosedEventSchema>;
type PortReadEvent = z.infer<typeof PortReadEventSchema>;
type PortErrorEvent = z.infer<typeof PortErrorEventSchema>;
type PortStatusEvent = z.infer<typeof PortStatusEventSchema>;

export type TauriEventName =
  (typeof TauriEventNames)[keyof typeof TauriEventNames];

// ============================================================================
// Event Payload Map (maps event names to payload types)
// ============================================================================

export interface TauriEventPayloadMap {
  [TauriEventNames.PORT_OPENED]: PortOpenedEvent;
  [TauriEventNames.PORT_CLOSED]: PortClosedEvent;
  [TauriEventNames.PORT_READ]: PortReadEvent;
  [TauriEventNames.PORT_ERROR]: PortErrorEvent;
  [TauriEventNames.PORT_STATUS]: PortStatusEvent;
}

// Schema map for runtime validation
const EVENT_SCHEMAS: Record<TauriEventName, z.ZodSchema> = {
  [TauriEventNames.PORT_OPENED]: PortOpenedEventSchema,
  [TauriEventNames.PORT_CLOSED]: PortClosedEventSchema,
  [TauriEventNames.PORT_READ]: PortReadEventSchema,
  [TauriEventNames.PORT_ERROR]: PortErrorEventSchema,
  [TauriEventNames.PORT_STATUS]: PortStatusEventSchema,
};

// ============================================================================
// Strongly-Typed Event Listener
// ============================================================================

/**
 * Type-safe wrapper around Tauri's listen function with runtime validation
 *
 * @param eventName - The event name (autocomplete supported)
 * @param handler - Event handler with typed payload
 * @returns Unlisten function
 *
 * @example
 * // Listen to port read events with full type safety
 * const unlisten = await listenToTauriEvent('port_read', (event) => {
 *   console.log(event.payload.portName); // ✅ Type-safe
 *   console.log(event.payload.data);      // ✅ Type-safe
 *   console.log(event.payload.invalid);   // ❌ Compile error
 * });
 *
 * @example
 * // Listen to port opened events
 * const unlisten = await listenToTauriEvent('port_opened', (event) => {
 *   console.log(`Port ${event.payload.portName} opened at ${event.payload.timestampMs}`);
 * });
 */
export async function listenToTauriEvent<T extends TauriEventName>(
  eventName: T,
  handler: (event: { payload: TauriEventPayloadMap[T] }) => void,
  options?: { validatePayload?: boolean },
): Promise<UnlistenFn> {
  const validatePayload = options?.validatePayload ?? true;

  return listen(eventName, (event: { payload: unknown }) => {
    if (validatePayload) {
      // Runtime validation with Zod
      const schema = EVENT_SCHEMAS[eventName];
      try {
        const validatedPayload = schema.parse(event.payload);
        handler({ payload: validatedPayload as TauriEventPayloadMap[T] });
      } catch (error) {
        console.error(
          `[Tauri Event] Validation failed for event "${eventName}"`,
          "\n[Raw Payload]:",
          JSON.stringify(event.payload, null, 2),
          "\n[Validation Error]:",
          error instanceof Error ? error.message : String(error),
          "\n[Full Error]:",
          error,
        );
        // Still call handler with unvalidated payload for debugging
        handler(event as { payload: TauriEventPayloadMap[T] });
      }
    } else {
      // Skip validation (use with caution)
      handler(event as { payload: TauriEventPayloadMap[T] });
    }
  });
}

/**
 * Listen to multiple events with a single handler
 *
 * @param eventNames - Array of event names
 * @param handler - Event handler that receives event name and payload
 * @returns Array of unlisten functions
 *
 * @example
 * const unlisteners = await listenToMultipleEvents(
 *   ['port_opened', 'port_closed'],
 *   (eventName, payload) => {
 *     if (eventName === 'port_opened') {
 *       console.log('Port opened:', payload.portName);
 *     } else {
 *       console.log('Port closed:', payload.portName, payload.reason);
 *     }
 *   }
 * );
 *
 * // Clean up all listeners
 * unlisteners.forEach(unlisten => unlisten());
 */
export async function listenToMultipleEvents<T extends TauriEventName>(
  eventNames: readonly T[],
  handler: <K extends T>(
    eventName: K,
    payload: TauriEventPayloadMap[K],
  ) => void,
): Promise<UnlistenFn[]> {
  const unlisteners = await Promise.all(
    eventNames.map((eventName) =>
      listenToTauriEvent(eventName, (event) => {
        handler(eventName, event.payload);
      }),
    ),
  );
  return unlisteners;
}

/**
 * Listen to an event once, then automatically unlisten
 *
 * @param eventName - The event name
 * @param handler - Event handler
 * @returns Promise that resolves when event is received
 *
 * @example
 * // Wait for port to open
 * const event = await listenOnce('port_opened');
 * console.log(`Port ${event.payload.portName} is now open`);
 */
export async function listenOnce<T extends TauriEventName>(
  eventName: T,
): Promise<{ payload: TauriEventPayloadMap[T] }> {
  return new Promise((resolve) => {
    listenToTauriEvent(eventName, (event) => {
      resolve(event);
    }).then((unlisten) => {
      // Auto-unlisten after first event
      unlisten();
    });
  });
}
