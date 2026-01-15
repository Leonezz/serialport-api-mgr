import { useRef, useEffect, useState } from "react";
import { GenericPort, NetworkPort } from "../lib/connection";
import { serialService, ISerialPort } from "../lib/serialService";
import { MockPort } from "../lib/mockPort";
import { SerialConfig, NetworkConfig } from "../../types";

export const useSerialConnection = (
  onDataReceived: (data: Uint8Array, sessionId: string) => void,
  onDisconnectCallback: (sessionId: string) => void,
) => {
  // Map SessionID -> Port Instance
  const portsRef = useRef<Map<string, GenericPort>>(new Map());
  // Map SessionID -> Reader (to cancel on disconnect)
  const readersRef = useRef<
    Map<string, ReadableStreamDefaultReader<Uint8Array>>
  >(new Map());
  // Map SessionID -> KeepReading Flag
  const keepReadingRef = useRef<Map<string, boolean>>(new Map());

  const [isSerialSupported, setIsSerialSupported] = useState(
    serialService.isSupported(),
  );

  useEffect(() => {
    setIsSerialSupported(serialService.isSupported());
  }, []);

  const disconnect = async (sessionId: string) => {
    keepReadingRef.current.set(sessionId, false);

    const reader = readersRef.current.get(sessionId);
    if (reader) {
      try {
        await reader.cancel();
      } catch (e) {
        console.warn("Reader cancel error", e);
      }
      readersRef.current.delete(sessionId);
    }

    const port = portsRef.current.get(sessionId);
    if (port) {
      try {
        await port.close();
      } catch (e) {
        console.warn("Port close error", e);
      }
      portsRef.current.delete(sessionId);
    }

    onDisconnectCallback(sessionId);
  };

  const readLoop = async (sessionId: string, port: GenericPort) => {
    if (!port.readable) return;

    try {
      const streamReader = port.readable.getReader();
      readersRef.current.set(sessionId, streamReader);
      keepReadingRef.current.set(sessionId, true);

      while (keepReadingRef.current.get(sessionId)) {
        const { value, done } = await streamReader.read();
        if (done) break;
        if (value) onDataReceived(value, sessionId);
      }
      streamReader.releaseLock();
    } catch (error) {
      console.error(`[${sessionId}] Read error:`, error);
    } finally {
      // If loop exited unexpectedly (error or done), ensure clean disconnect
      if (keepReadingRef.current.get(sessionId)) {
        disconnect(sessionId);
      }
    }
  };

  const connect = async (
    sessionId: string,
    config: SerialConfig,
    networkConfig: NetworkConfig,
    requestedPort?: ISerialPort | string,
  ) => {
    try {
      // Disconnect existing if any
      if (portsRef.current.has(sessionId)) {
        await disconnect(sessionId);
      }

      let newPort: GenericPort;

      if (
        typeof requestedPort === "string" &&
        requestedPort.startsWith("mock")
      ) {
        // Use the refactored MockPort class
        newPort = new MockPort(requestedPort);
      } else if (requestedPort && typeof requestedPort !== "string") {
        // Provided Serial Port
        const selectedPort = requestedPort;
        await selectedPort.open({
          baudRate: config.baudRate,
          dataBits: config.dataBits,
          stopBits: config.stopBits,
          parity: config.parity,
          flowControl: config.flowControl,
        });
        newPort = selectedPort;
      } else if (!requestedPort && serialService.isSupported()) {
        // Request Port (UI Prompt)
        const selectedPort = await serialService.requestPort();
        if (!selectedPort) throw new Error("No port selected");

        await selectedPort.open({
          baudRate: config.baudRate,
          dataBits: config.dataBits,
          stopBits: config.stopBits,
          parity: config.parity,
          flowControl: config.flowControl,
        });
        newPort = selectedPort;
      } else {
        // Network
        const url = `ws://${networkConfig.host}:${networkConfig.port}`;
        const netPort = new NetworkPort(url, () => {
          disconnect(sessionId);
        });
        await netPort.waitForOpen();
        newPort = netPort;
      }

      portsRef.current.set(sessionId, newPort);

      // Start Reading
      readLoop(sessionId, newPort);

      // Return the port name for state tracking
      if (newPort instanceof MockPort) {
        return (newPort as any).type || "mock";
      } else if (newPort instanceof NetworkPort) {
        return `ws://${networkConfig.host}:${networkConfig.port}`;
      } else {
        // It's a real serial port (WebSerial or Tauri)
        // Try to get info if available
        if ("getInfo" in newPort) {
          const info = (newPort as ISerialPort).getInfo();
          // If it's a TauriPort, it has a portName property directly (we saw this in serialService.ts)
          if ("portName" in newPort) {
            return (newPort as any).portName;
          }
        }
        return "serial_port";
      }
    } catch (err) {
      console.error(`[${sessionId}] Connect error:`, err);
      throw err;
    }
  };

  const write = async (sessionId: string, data: Uint8Array) => {
    const port = portsRef.current.get(sessionId);
    if (!port || !port.writable)
      throw new Error("Port not connected or not writable");

    const w = port.writable.getWriter();
    try {
      await w.write(data);
    } finally {
      w.releaseLock();
    }
  };

  const toggleSignal = async (sessionId: string, signal: "rts" | "dtr") => {
    const port = portsRef.current.get(sessionId);
    if (!port) return;

    // Try to verify if it's a serial port with signals
    // We check for 'getSignals' presence which ISerialPort has
    if (
      "getSignals" in port &&
      typeof (port as any).getSignals === "function"
    ) {
      try {
        const signals = await (port as ISerialPort).getSignals();
        if (signal === "rts")
          await port.setSignals?.({ requestToSend: !signals.requestToSend });
        if (signal === "dtr")
          await port.setSignals?.({
            dataTerminalReady: !signals.dataTerminalReady,
          });
      } catch (e) {
        console.error("Failed to toggle signal", e);
      }
    }
  };

  // Auto-disconnect listener
  useEffect(() => {
    const onSerialDisconnect = (event: Event) => {
      const serialEvent = event as any;

      portsRef.current.forEach((port, sessionId) => {
        if (serialEvent.port && port === serialEvent.port) {
          disconnect(sessionId);
        }
      });
    };

    if (serialService.isSupported()) {
      serialService.addEventListener("disconnect", onSerialDisconnect);
      return () =>
        serialService.removeEventListener("disconnect", onSerialDisconnect);
    }
  }, []);

  return {
    connect,
    disconnect,
    write,
    toggleSignal,
    isWebSerialSupported: isSerialSupported,
    isSessionConnected: (sessionId: string) => portsRef.current.has(sessionId),
  };
};
