import { SerialportConfig } from "@/types/serialport/serialport_config";
import buildNamedConfigStore, {
  NamedConfigStoreType,
} from "./buildNamedConfigStore";

export type NamedSerialportConfig = NamedConfigStoreType<SerialportConfig>;

const useNamedSerialortConfigStore = buildNamedConfigStore<
  SerialportConfig,
  {},
  {}
>("serialport-config.json", {}, {});
export default useNamedSerialortConfigStore;
