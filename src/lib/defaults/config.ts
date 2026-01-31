/**
 * Default Configuration Values
 *
 * Basic serial and network configuration defaults.
 */

import type { SerialConfig, NetworkConfig } from "../../types";

export const DEFAULT_CONFIG: SerialConfig = {
  baudRate: 115200,
  dataBits: "Eight",
  stopBits: "One",
  parity: "None",
  flowControl: "None",
  bufferSize: 1000,
  lineEnding: "CRLF",
  framing: {
    strategy: "NONE",
    delimiter: "",
    timeout: 50,
    prefixLengthSize: 1,
    byteOrder: "LE",
  },
};

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  host: "localhost",
  port: 8080,
};
