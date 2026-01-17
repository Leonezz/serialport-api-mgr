import {
  SerialOptions,
  SerialPortInfo,
  SerialInputSignals,
  SerialOutputSignals,
} from "../types";
import { GenericPort } from "./connection";
import { TauriSerialAPI, TauriEventNames, listenToTauriEvent } from "./tauri";
import { UnlistenFn } from "@tauri-apps/api/event";
import "../../vite-env.d.ts";

export interface ISerialPort extends GenericPort {
  open(options: SerialOptions): Promise<void>;
  getInfo(): Partial<SerialPortInfo>;
  getSignals(): Promise<SerialInputSignals>;
  getRustPortInfo?(): SerialPortInfo | null; // Optional: only for Tauri ports
}

export interface ISerialProvider {
  isSupported(): boolean;
  getPorts(): Promise<ISerialPort[]>;
  requestPort(): Promise<ISerialPort | null>;
  addEventListener(type: string, listener: (e: Event) => void): void;
  removeEventListener(type: string, listener: (e: Event) => void): void;
}

// WebSerial Provider (Browser)
class WebSerialProvider implements ISerialProvider {
  isSupported() {
    return typeof navigator !== "undefined" && "serial" in navigator;
  }

  async getPorts() {
    if (!this.isSupported()) return [];
    try {
      const ports = await navigator.serial.getPorts();
      return ports as unknown as ISerialPort[];
    } catch (e) {
      // Handle cases where Feature Policy/Permissions Policy blocks 'serial'
      // This prevents the app from crashing if running in a restricted iframe
      console.warn("Web Serial API getPorts blocked or failed:", e);
      return [];
    }
  }

  async requestPort() {
    if (!this.isSupported()) return null;
    try {
      const port = await navigator.serial.requestPort();
      return port as unknown as ISerialPort;
    } catch (e) {
      // User cancelled or error
      console.debug("Request port cancelled or failed", e);
      return null;
    }
  }

  addEventListener(type: string, listener: (e: Event) => void) {
    if (this.isSupported()) navigator.serial.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: (e: Event) => void) {
    if (this.isSupported())
      navigator.serial.removeEventListener(type, listener);
  }
}

// Tauri Port Implementation - Bridges Tauri commands to stream-based interface
class TauriPort implements ISerialPort {
  portName: string;
  readable: ReadableStream<Uint8Array> | null = null;
  writable: WritableStream<Uint8Array> | null = null;
  private readController: ReadableStreamDefaultController<Uint8Array> | null =
    null;
  private unlistenRead: UnlistenFn | null = null;
  private signals: SerialInputSignals = {
    dataCarrierDetect: false,
    clearToSend: false,
    ringIndicator: false,
    dataSetReady: false,
  };
  private rustPortInfo: SerialPortInfo | null = null;

  constructor(portName: string, rustPortInfo?: SerialPortInfo) {
    this.portName = portName;
    this.rustPortInfo = rustPortInfo || null;
  }

  getRustPortInfo(): SerialPortInfo | null {
    return this.rustPortInfo;
  }

  async open(options: Required<SerialOptions>): Promise<void> {
    // Open port via Tauri command with automatic type conversion
    await TauriSerialAPI.openPort({
      portName: this.portName,
      baudRate: options.baudRate,
      dataBits: options.dataBits,
      flowControl: options.flowControl,
      parity: options.parity,
      stopBits: options.stopBits,
      dataTerminalReady: true,
      timeoutMs: 1000,
    });

    // Create readable stream that listens to Tauri events
    this.readable = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        this.readController = controller;
        // Listen for data from Tauri backend with type safety
        this.unlistenRead = await listenToTauriEvent(
          TauriEventNames.PORT_READ,
          (event) => {
            // Only process data for this port
            console.log(
              `TauriPort[${this.portName}] received ${TauriEventNames.PORT_READ} event:`,
              event,
            );
            if (event.payload.portName === this.portName) {
              const data = new Uint8Array(event.payload.data);
              controller.enqueue(data);
            }
          },
        );
      },
      cancel: async () => {
        if (this.unlistenRead) {
          this.unlistenRead();
          this.unlistenRead = null;
        }
      },
    });

    // Create writable stream that sends to Tauri backend
    this.writable = new WritableStream<Uint8Array>({
      write: async (chunk) => {
        await TauriSerialAPI.writePort(this.portName, chunk);
      },
    });
  }

  async close(): Promise<void> {
    // Close port via Tauri command
    await TauriSerialAPI.closePort(this.portName);
    // Clean up event listeners
    if (this.unlistenRead) {
      this.unlistenRead();
      this.unlistenRead = null;
    }

    // Close streams
    if (this.readController) {
      this.readController.close();
      this.readController = null;
    }

    this.readable = null;
    this.writable = null;
  }

  getInfo(): Partial<SerialPortInfo> {
    // Tauri doesn't provide USB info easily, return minimal info
    return {
      // Would need USB info from Tauri backend if needed
    };
  }

  async getSignals(): Promise<SerialInputSignals> {
    // Return cached signals (would need Tauri event listener for live updates)
    return this.signals;
  }

  async setSignals(signals: SerialOutputSignals): Promise<void> {
    await TauriSerialAPI.setSignals(this.portName, {
      rts: signals.requestToSend,
      dtr: signals.dataTerminalReady,
    });
  }
}

// Tauri Provider - Uses Tauri commands for serial operations
class TauriProvider implements ISerialProvider {
  private availablePorts: TauriPort[] = [];
  private eventListeners: Map<string, ((e: Event) => void)[]> = new Map();

  isSupported() {
    // Check if running in Tauri environment
    return (
      typeof __TAURI_ENV_TARGET_TRIPLE__ !== "undefined" &&
      !!__TAURI_ENV_TARGET_TRIPLE__
    );
  }

  async getPorts(): Promise<ISerialPort[]> {
    if (!this.isSupported()) return [];
    try {
      const portInfos = await TauriSerialAPI.getAllPortInfo();
      // Pass full RustPortInfo to TauriPort constructor
      this.availablePorts = portInfos.map(
        (info) => new TauriPort(info.port_name, info),
      );
      return this.availablePorts;
    } catch (e) {
      console.error("Failed to get ports from Tauri:", e);
      return [];
    }
  }

  async requestPort(): Promise<ISerialPort | null> {
    // In Tauri, we don't have a requestPort dialog like WebSerial
    // The UI will need to call getPorts() and let user choose
    // For now, return null (caller should use getPorts instead)
    console.warn(
      "TauriProvider: requestPort() not supported. Use getPorts() and select from list.",
    );
    return null;
  }

  addEventListener(type: string, listener: (e: Event) => void) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);

    // Set up Tauri event listeners for port connect/disconnect
    if (type === "connect" || type === "disconnect") {
      // Tauri emits 'port_opened' and 'port_closed' events
      // We can listen to these and translate to 'connect'/'disconnect'
      const tauriEvent =
        type === "connect"
          ? TauriEventNames.PORT_OPENED
          : TauriEventNames.PORT_CLOSED;
      listenToTauriEvent(tauriEvent, (event) => {
        // Create a compatible Event object
        const customEvent = new CustomEvent(type, { detail: event.payload });
        this.dispatchEvent(type, customEvent);
      });
    }
  }

  removeEventListener(type: string, listener: (e: Event) => void) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private dispatchEvent(type: string, event: Event) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }
}

// Auto-detect and create appropriate provider
function createSerialProvider(): ISerialProvider {
  // Priority: Tauri (if available) > WebSerial (browser)
  console.log(`Detecting serial provider...,
        TAURI_PLATFORM: ${__TAURI_ENV_TARGET_TRIPLE__},
        TAURI_PLATFORM_VERSION: ${__TAURI_ENV_PLATFORM_VERSION__},
        TAURI_DEBUG: ${__TAURI_ENV_DEBUG__},
        __TAURI__: ${typeof window !== "undefined" ? "__TAURI__" in window : "n/a"},
        __TAURI_INTERNALs__: ${typeof window !== "undefined" ? "__TAURI_INTERNALs__" in window : "n/a"},
        navigator.serial: ${typeof navigator !== "undefined" ? "serial" in navigator : "n/a"}`);
  if (
    typeof __TAURI_ENV_TARGET_TRIPLE__ !== "undefined" &&
    __TAURI_ENV_TARGET_TRIPLE__
  ) {
    console.log("Using Tauri Serial Provider");
    return new TauriProvider();
  } else if (typeof navigator !== "undefined" && "serial" in navigator) {
    console.log("Using WebSerial Provider");
    return new WebSerialProvider();
  } else {
    console.warn(
      "No serial provider available. Falling back to WebSerial (will fail)",
    );
    return new WebSerialProvider();
  }
}

// Singleton export - auto-detects environment
export const serialService = createSerialProvider();
