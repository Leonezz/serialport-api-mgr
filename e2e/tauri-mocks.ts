/**
 * Tauri API mocks for Playwright E2E tests
 *
 * Since we're testing the web frontend via Vite dev server (not the actual Tauri app),
 * we need to inject mocks for Tauri APIs that the frontend expects.
 *
 * These mocks simulate the Tauri backend behavior for testing purposes.
 */

import type { Page } from "@playwright/test";

// ============================================================================
// Mock Data Types
// ============================================================================

export interface MockSerialPort {
  port_name: string;
  port_type: string;
  vid?: number;
  pid?: number;
  serial_number?: string;
  manufacturer?: string;
  product?: string;
}

export interface MockPortReadEvent {
  portName: string;
  timestampMs: number;
  data: number[];
}

// ============================================================================
// Default Mock Data
// ============================================================================

export const DEFAULT_MOCK_PORTS: MockSerialPort[] = [
  {
    port_name: "/dev/ttyUSB0",
    port_type: "USB",
    vid: 0x0403,
    pid: 0x6001,
    manufacturer: "FTDI",
    product: "FT232R USB UART",
    serial_number: "A12345",
  },
  {
    port_name: "/dev/ttyUSB1",
    port_type: "USB",
    vid: 0x10c4,
    pid: 0xea60,
    manufacturer: "Silicon Labs",
    product: "CP2102 USB to UART Bridge",
  },
  {
    port_name: "COM3",
    port_type: "USB",
    vid: 0x2341,
    pid: 0x0043,
    manufacturer: "Arduino",
    product: "Arduino Uno",
  },
];

// ============================================================================
// Tauri Mock Injector
// ============================================================================

export interface TauriMockOptions {
  /** Mock serial ports to return from get_all_port_info */
  ports?: MockSerialPort[];
  /** Whether to simulate being in Tauri environment */
  isTauri?: boolean;
  /** Custom command handlers */
  commandHandlers?: Record<string, (args: unknown) => unknown>;
  /** Event emitter for simulating backend events */
  onEventEmit?: (eventName: string, payload: unknown) => void;
}

/**
 * Inject Tauri API mocks into a Playwright page
 *
 * This must be called before navigating to the page or after page reload.
 *
 * @example
 * ```ts
 * test('list serial ports', async ({ page }) => {
 *   await injectTauriMocks(page, {
 *     ports: [{ port_name: '/dev/ttyUSB0', port_type: 'USB' }]
 *   });
 *   await page.goto('/');
 *   // Test your UI...
 * });
 * ```
 */
export async function injectTauriMocks(
  page: Page,
  options: TauriMockOptions = {}
): Promise<void> {
  const {
    ports = DEFAULT_MOCK_PORTS,
    isTauri = false, // Default to browser mode for web-based E2E tests
    commandHandlers = {},
  } = options;

  // Inject mocks before page loads
  await page.addInitScript(
    ({ ports, isTauri, commandHandlers }) => {
      // Track opened ports
      const openedPorts = new Set<string>();
      // Track event listeners
      const eventListeners: Map<string, Array<(event: unknown) => void>> =
        new Map();

      // Mock __TAURI_INTERNALS__
      (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {
        metadata: {
          currentWindow: { label: "main" },
          currentWebview: { label: "main" },
          windows: [{ label: "main" }],
          webviews: [{ label: "main", windowLabel: "main" }],
        },
        invoke: async (cmd: string, args: unknown) => {
          console.log(`[Tauri Mock] invoke: ${cmd}`, args);

          // Check for custom handlers first
          if (commandHandlers[cmd]) {
            return commandHandlers[cmd](args);
          }

          // Default command implementations
          switch (cmd) {
            case "get_all_port_info":
              return ports;

            case "open_port": {
              const portArgs = args as { portName: string };
              if (openedPorts.has(portArgs.portName)) {
                throw new Error(`Port ${portArgs.portName} is already open`);
              }
              openedPorts.add(portArgs.portName);
              // Emit port_opened event
              setTimeout(() => {
                const listeners = eventListeners.get("port_opened") || [];
                listeners.forEach((cb) =>
                  cb({
                    payload: {
                      portName: portArgs.portName,
                      timestampMs: Date.now(),
                    },
                  })
                );
              }, 10);
              return undefined;
            }

            case "close_port": {
              const closeArgs = args as { portName: string };
              openedPorts.delete(closeArgs.portName);
              // Emit port_closed event
              setTimeout(() => {
                const listeners = eventListeners.get("port_closed") || [];
                listeners.forEach((cb) =>
                  cb({
                    payload: {
                      portName: closeArgs.portName,
                      reason: "user_requested",
                      timestampMs: Date.now(),
                    },
                  })
                );
              }, 10);
              return undefined;
            }

            case "write_port": {
              const writeArgs = args as {
                portName: string;
                data: number[];
                messageId: string;
              };
              if (!openedPorts.has(writeArgs.portName)) {
                throw new Error(`Port ${writeArgs.portName} is not open`);
              }
              console.log(
                `[Tauri Mock] write_port: ${writeArgs.portName}`,
                writeArgs.data
              );
              // Simulate echo response after a delay
              setTimeout(() => {
                const listeners = eventListeners.get("port_read") || [];
                listeners.forEach((cb) =>
                  cb({
                    payload: {
                      portName: writeArgs.portName,
                      timestampMs: Date.now(),
                      data: writeArgs.data, // Echo back the same data
                    },
                  })
                );
              }, 50);
              return undefined;
            }

            case "write_request_to_send":
            case "write_data_terminal_ready":
              return undefined;

            case "log":
            case "info":
            case "warn":
            case "error":
            case "debug":
              // Just log to console
              console.log(`[Tauri Mock] ${cmd}:`, args);
              return undefined;

            case "get_logs":
              return [];

            default:
              console.warn(`[Tauri Mock] Unknown command: ${cmd}`);
              return undefined;
          }
        },
        transformCallback: (callback: () => void) => {
          const id = Math.random().toString(36).substring(7);
          (window as unknown as Record<string, unknown>)[`_${id}`] = callback;
          return id;
        },
      };

      // Mock isTauri check
      Object.defineProperty(window, "__TAURI_INTERNALS__", {
        value: (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__,
        writable: false,
        configurable: true,
      });

      // If simulating Tauri environment
      if (isTauri) {
        Object.defineProperty(window, "__TAURI__", {
          value: {},
          writable: false,
          configurable: true,
        });
      }

      // Mock @tauri-apps/api/event listen function
      (
        window as unknown as { __TAURI_INTERNALS__: { listen: unknown } }
      ).__TAURI_INTERNALS__.listen = (
        eventName: string,
        callback: (event: unknown) => void
      ) => {
        if (!eventListeners.has(eventName)) {
          eventListeners.set(eventName, []);
        }
        eventListeners.get(eventName)!.push(callback);

        // Return unlisten function
        return Promise.resolve(() => {
          const listeners = eventListeners.get(eventName);
          if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }
        });
      };

      // Expose helper to emit events from test
      (window as unknown as { __TAURI_TEST_EMIT__: unknown }).__TAURI_TEST_EMIT__ = (
        eventName: string,
        payload: unknown
      ) => {
        const listeners = eventListeners.get(eventName) || [];
        listeners.forEach((cb) => cb({ payload }));
      };

      console.log("[Tauri Mock] Mocks injected successfully", {
        isTauri,
        portCount: ports.length,
      });
    },
    { ports, isTauri, commandHandlers }
  );
}

/**
 * Emit a mock Tauri event to the page
 *
 * @example
 * ```ts
 * // Simulate receiving data from serial port
 * await emitTauriEvent(page, 'port_read', {
 *   portName: '/dev/ttyUSB0',
 *   timestampMs: Date.now(),
 *   data: [72, 101, 108, 108, 111] // "Hello"
 * });
 * ```
 */
export async function emitTauriEvent(
  page: Page,
  eventName: string,
  payload: unknown
): Promise<void> {
  await page.evaluate(
    ({ eventName, payload }) => {
      const emit = (window as unknown as { __TAURI_TEST_EMIT__?: (name: string, data: unknown) => void }).__TAURI_TEST_EMIT__;
      if (emit) {
        emit(eventName, payload);
      } else {
        console.error("[Tauri Mock] __TAURI_TEST_EMIT__ not available");
      }
    },
    { eventName, payload }
  );
}

/**
 * Helper to convert string to byte array for mock serial data
 */
export function stringToBytes(str: string): number[] {
  return Array.from(new TextEncoder().encode(str));
}

/**
 * Helper to convert byte array to string
 */
export function bytesToString(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}
