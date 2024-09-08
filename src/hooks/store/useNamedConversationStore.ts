import SerialportConversation from "@/types/conversation";
import buildNamedConfigStore, {
  NamedConfigStoreType,
} from "./buildNamedConfigStore";

export type NamedSerialportApi = NamedConfigStoreType<SerialportConversation>;

const useNamedApiStore = buildNamedConfigStore<SerialportConversation, {}, {}>(
  "serialport-conversation.json",
  {},
  {}
);
export default useNamedApiStore;
