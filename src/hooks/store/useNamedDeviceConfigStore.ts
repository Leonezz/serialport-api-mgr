import { SerialportDevice } from "@/types/device";
import {
  buildNamedConfigStore,
  NamedConfigStoreType,
} from "./buildNamedConfigStore";

export type NamedSerialportDeviceConfig =
  NamedConfigStoreType<SerialportDevice>;

const useNamedSerialportDeviceStore = buildNamedConfigStore<
  SerialportDevice,
  {},
  {}
>("serialport-device.json", {}, {});

export { useNamedSerialportDeviceStore };
