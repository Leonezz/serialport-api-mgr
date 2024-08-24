import { SERIALPORT } from "./base";

export type SerialPortConfig = {
  port_name: string;
  baud_rate: number;
  data_bits: SERIALPORT.ConfigTypes<"data_bits">;
  flow_control: SERIALPORT.ConfigTypes<"flow_control">;
  parity: SERIALPORT.ConfigTypes<"parity">;
  stop_bits: SERIALPORT.ConfigTypes<"stop_bits">;
  read_timeout: number;
  write_timeout: number;
};
