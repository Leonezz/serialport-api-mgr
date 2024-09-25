import { MessageMetaConfig } from "@/types/message/message_meta";
import {
  buildNamedConfigStore,
  NamedConfigStoreType,
} from "./buildNamedConfigStore";

export type NamedMessageMetaConfig = NamedConfigStoreType<MessageMetaConfig>;

const useNamedMessageMetaConfigStore = buildNamedConfigStore<
  MessageMetaConfig,
  {},
  {}
>("messagemeta-config.json", {}, {});

export { useNamedMessageMetaConfigStore };
