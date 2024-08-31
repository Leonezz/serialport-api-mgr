import { SerialportApi } from "@/types/serialport_api";
import buildNamedConfigStore from "./buildNamedConfigStore";

const useNamedApiStore = buildNamedConfigStore<SerialportApi, {}, {}>(
  "serialport-api.json",
  {},
  {}
);
export default useNamedApiStore;
