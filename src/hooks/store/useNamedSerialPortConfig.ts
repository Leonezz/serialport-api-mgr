import { SerialportConfig } from "@/types/serialport/serialport_config";
import buildNamedConfigStore from "./buildNamedConfigStore";

const useNamedSerialortConfigStore = buildNamedConfigStore<
  Omit<SerialportConfig, "port_name">,
  {},
  {}
>("serialport-config.json", {}, {});
export default useNamedSerialortConfigStore;
