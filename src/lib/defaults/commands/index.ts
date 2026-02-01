/**
 * Default Commands Index
 *
 * Re-exports all command definitions from individual protocol files.
 */

// Protocol command exports
export * from "./at";
export * from "./esp32";
export * from "./scpi";
export * from "./obd2";
export * from "./marlin";
export * from "./gps";
export * from "./modbus";
export * from "./escpos";

// Aggregate command arrays
import { AT_COMMANDS } from "./at";
import { ESP32_COMMANDS } from "./esp32";
import { SCPI_COMMANDS } from "./scpi";
import { OBD2_COMMANDS } from "./obd2";
import { MARLIN_COMMANDS } from "./marlin";
import { GPS_COMMANDS } from "./gps";
import { MODBUS_COMMANDS } from "./modbus";
import { ESCPOS_COMMANDS } from "./escpos";

import type { SavedCommand } from "../../../types";

export const DEFAULT_COMMANDS: SavedCommand[] = [
  ...ESP32_COMMANDS,
  ...AT_COMMANDS,
  ...SCPI_COMMANDS,
  ...OBD2_COMMANDS,
  ...MARLIN_COMMANDS,
  ...GPS_COMMANDS,
  ...MODBUS_COMMANDS,
  ...ESCPOS_COMMANDS,
];
