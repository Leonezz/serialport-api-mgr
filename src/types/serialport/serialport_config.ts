// import { NamedConfigStoreType } from "@/util/store_types";
import { SERIALPORT } from "./base";

// export type NamedSerialportConfig = NamedConfigStoreType<SerialportConfig>;

export type SerialportConfig = {
  port_name: string;
  baud_rate: number;
  data_bits: SERIALPORT.ConfigTypes<"data_bits">;
  flow_control: SERIALPORT.ConfigTypes<"flow_control">;
  parity: SERIALPORT.ConfigTypes<"parity">;
  stop_bits: SERIALPORT.ConfigTypes<"stop_bits">;
  read_timeout: number;
  write_timeout: number;
};

export const DEFAULTSerialportConfig: SerialportConfig = {
  port_name: "",
  baud_rate: SERIALPORT.CommonlyUsedBaudRates[0],
  data_bits: SERIALPORT.ConfigOptions["data_bits"][0],
  flow_control: SERIALPORT.ConfigOptions["flow_control"][0],
  parity: SERIALPORT.ConfigOptions["parity"][0],
  stop_bits: SERIALPORT.ConfigOptions["stop_bits"][0],
  read_timeout: 0,
  write_timeout: 0,
};
