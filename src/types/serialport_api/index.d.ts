import { NamedConfigStoreType } from "@/util/store_types";

export type SerialportApi = {
  serialport_config_id: string;
  conversation_schema_id: string;
};

export type NamedSerialportApi = NamedConfigStoreType<SerialportApi>;
