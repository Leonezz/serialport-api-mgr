import { SerialportApi } from "@/types/serialport_api";
import buildNamedConfigStore from "./buildNamedConfigStore";

const useNamedApiStore = buildNamedConfigStore<SerialportApi, {}, {}>({}, {});
export default useNamedApiStore;
