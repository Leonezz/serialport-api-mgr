import { SerialportApi } from "@/types/serialport_api";
import buildNamedConfigStore, {
  NamedConfigStoreType,
} from "./buildNamedConfigStore";

export type NamedSerialportApi = NamedConfigStoreType<SerialportApi>;

const useNamedApiStore = buildNamedConfigStore<SerialportApi, {}, {}>(
  "serialport-api.json",
  {},
  {}
);
export default useNamedApiStore;
