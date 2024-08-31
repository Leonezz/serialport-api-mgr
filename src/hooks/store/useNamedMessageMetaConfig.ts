import { MessageMetaConfig } from "@/types/message/message_meta";
import buildNamedConfigStore from "./buildNamedConfigStore";

const useNamedMessageMetaConfigStore = buildNamedConfigStore<
  MessageMetaConfig,
  {},
  {}
>("messagemeta-config.json", {}, {});
export default useNamedMessageMetaConfigStore;
