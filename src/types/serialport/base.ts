export namespace SERIALPORT {
    export const ConfigOptions = {
      data_bits: ["Five", "Six", "Seven", "Eight"] as const,
      flow_control: ["None", "Software", "Hardware"] as const,
      parity: ["None", "Odd", "Even"] as const,
      stop_bits: ["One", "Two"] as const,
    };
    export type ConfigTypes<T extends keyof typeof ConfigOptions> =
      (typeof ConfigOptions)[T][number];
    export const CommonlyUsedBaudRates = [
      4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
    ] as const;
  }
  