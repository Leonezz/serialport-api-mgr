/**
 * Bidirectional enum converters between TypeScript and Rust formats
 * Centralizes all enum conversion logic in one place
 */

import type {
  RustDataBits,
  RustFlowControl,
  RustParity,
  RustStopBits,
  TsDataBits,
  TsFlowControl,
  TsParity,
  TsStopBits,
} from "./types";

export class EnumConverter {
  // ========================================================================
  // DataBits Converters
  // ========================================================================

  /**
   * Convert TypeScript DataBits (5|6|7|8) to Rust format ('Five'|'Six'|'Seven'|'Eight')
   */
  static dataBitsToRust(value: TsDataBits): RustDataBits {
    const map: Record<TsDataBits, RustDataBits> = {
      5: "Five",
      6: "Six",
      7: "Seven",
      8: "Eight",
    };
    return map[value];
  }

  /**
   * Convert Rust DataBits ('Five'|'Six'|'Seven'|'Eight') to TypeScript format (5|6|7|8)
   */
  static dataBitsFromRust(value: RustDataBits): TsDataBits {
    const map: Record<RustDataBits, TsDataBits> = {
      Five: 5,
      Six: 6,
      Seven: 7,
      Eight: 8,
    };
    return map[value];
  }

  // ========================================================================
  // FlowControl Converters
  // ========================================================================

  /**
   * Convert TypeScript FlowControl ('none'|'hardware'|'software') to Rust format
   */
  static flowControlToRust(value: TsFlowControl): RustFlowControl {
    const map: Record<TsFlowControl, RustFlowControl> = {
      none: "None",
      hardware: "Hardware",
      software: "Software",
    };
    return map[value];
  }

  /**
   * Convert Rust FlowControl ('None'|'Hardware'|'Software') to TypeScript format
   */
  static flowControlFromRust(value: RustFlowControl): TsFlowControl {
    const map: Record<RustFlowControl, TsFlowControl> = {
      None: "none",
      Hardware: "hardware",
      Software: "software",
    };
    return map[value];
  }

  // ========================================================================
  // Parity Converters
  // ========================================================================

  /**
   * Convert TypeScript Parity ('none'|'even'|'odd') to Rust format
   */
  static parityToRust(value: TsParity): RustParity {
    const map: Record<TsParity, RustParity> = {
      none: "None",
      even: "Even",
      odd: "Odd",
    };
    return map[value];
  }

  /**
   * Convert Rust Parity ('None'|'Even'|'Odd') to TypeScript format
   */
  static parityFromRust(value: RustParity): TsParity {
    const map: Record<RustParity, TsParity> = {
      None: "none",
      Even: "even",
      Odd: "odd",
    };
    return map[value];
  }

  // ========================================================================
  // StopBits Converters
  // ========================================================================

  /**
   * Convert TypeScript StopBits (1|2) to Rust format ('One'|'Two')
   */
  static stopBitsToRust(value: TsStopBits): RustStopBits {
    const map: Record<TsStopBits, RustStopBits> = {
      1: "One",
      2: "Two",
    };
    return map[value];
  }

  /**
   * Convert Rust StopBits ('One'|'Two') to TypeScript format (1|2)
   */
  static stopBitsFromRust(value: RustStopBits): TsStopBits {
    const map: Record<RustStopBits, TsStopBits> = {
      One: 1,
      Two: 2,
    };
    return map[value];
  }
}
