import { useSerialportStatus } from "@/hooks/store/usePortStatus";
import { useEffect, useState } from "react";
import SerialPortOpener from "../serialport/port_configer";
import MessageList from "../message/message_list";
import { NamedSerialportApi } from "@/hooks/store/useNamedConversationStore";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Progress,
} from "@nextui-org/react";
import { NamedMessageMetaConfig } from "@/hooks/store/useNamedMessageMetaConfig";
import { MessageMetaConfiger } from "../message/message_meta_configer";
import { NamedSerialportConfig } from "@/hooks/store/useNamedSerialPortConfig";
import { DEFAULTSerialportConversation } from "@/types/conversation/default";
import { useSessionDialogStore } from "@/hooks/store/useSessionDialogMessages";
import { useSendMessage } from "@/hooks/message/use_send_message";
import { useToast } from "../shadcn/use-toast";
import { Buffer } from "buffer";
import { usePrevious } from "ahooks";
import { MessageMetaPresetConfigSelector } from "../serialport/config/config_selector";

type ApiConfigSelectorProps = {
  selectRange: NamedSerialportApi[];
  selectedId: string;
  setSelectedId: (v: string) => void;
};
const ApiConfigSelector = ({
  selectRange,
  selectedId,
  setSelectedId,
}: ApiConfigSelectorProps) => {
  const selectedConfig = selectRange.filter((v) => v.id === selectedId).at(0);
  return (
    <Autocomplete
      isReadOnly={false}
      type="text"
      allowsCustomValue
      label={
        <p className="text-medium w-fit font-bold text-content1-foreground">
          Api Config
        </p>
      }
      isClearable={false}
      placeholder="Select a preset"
      size="sm"
      value={selectedConfig?.name}
      key={selectedId}
      defaultInputValue={selectedConfig?.name}
      onSelectionChange={(key) => {
        if (key === null) {
          return;
        }
        setSelectedId(key.toString());
      }}
      className={`text-xs font-mono w-fit min-w-fit`}
    >
      {selectRange.map((n) => (
        <AutocompleteItem key={n.id} textValue={n.name}>
          {n.name}
        </AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

type DeviceApiMonitorInputProps = {
  apiConfigs: NamedSerialportApi[];
  selectedApiId: string;
  setSelectedApiId: (v: string) => void;
  portOpened: boolean;
  dialogFinished: boolean;
  onStart: () => void;
  onReset: () => void;
  namedMessageMetaConfig: NamedMessageMetaConfig;
  message: string;
  onMessageChange: (value: string) => void;
};
const DeviceApiMonitorInput = ({
  apiConfigs,
  selectedApiId,
  setSelectedApiId,
  portOpened,
  dialogFinished,
  onStart,
  onReset,
  namedMessageMetaConfig,
  message,
  onMessageChange,
}: DeviceApiMonitorInputProps) => {
  return (
    <footer className="flex flex-col gap-1 px-2 sticky bottom-0 mt-auto w-full">
      <div className="flex flex-row gap-2 justify-end sm:flex-wrap">
        <MessageMetaConfiger
          value={namedMessageMetaConfig.config}
          onValueChange={() => {}}
        />
        <div className="flex flex-row gap-2 w-full">
          <ApiConfigSelector
            selectRange={apiConfigs}
            selectedId={selectedApiId}
            setSelectedId={setSelectedApiId}
          />
          <MessageMetaPresetConfigSelector
            selectedName={namedMessageMetaConfig.name}
            setSelectedName={() => {}}
            readonly={true}
            width="w-min"
            height="h-full"
          />
          <Input
            size="sm"
            className="w-full"
            label="Message"
            value={message}
            onValueChange={onMessageChange}
          />
          <Button
            size="sm"
            color="primary"
            className="h-full"
            onClick={dialogFinished ? onReset : onStart}
            isDisabled={!portOpened}
          >
            {dialogFinished ? "Reset" : "Start"}
          </Button>
        </div>
      </div>
    </footer>
  );
};

type DeviceApiMonitorProps = {
  serialportConfig: NamedSerialportConfig;
  messageMetaConfig: NamedMessageMetaConfig;
  apiConfigs: NamedSerialportApi[];
};
const DeviceApiMonitor = ({
  serialportConfig,
  messageMetaConfig,
  apiConfigs,
}: DeviceApiMonitorProps) => {
  const [localSerialportConfig, setLocalSerialportConfig] = useState(
    serialportConfig.config
  ); // state only for portname
  useEffect(() => {
    setLocalSerialportConfig(serialportConfig.config);
  }, [serialportConfig.config]);

  const { getPortOpened } = useSerialportStatus();

  const portOpened = getPortOpened({
    port_name: localSerialportConfig.port_name,
  });

  const [selectedApiId, setSelectedId] = useState(apiConfigs.at(0)?.id || "");

  const selectedApiConfig = apiConfigs
    .filter((v) => v.id === selectedApiId)
    .at(0);

  const {
    getMessagesBySessionId,
    setSession,
    removeSession,
    resetSession,
    setPortName,
  } = useSessionDialogStore();

  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (sessionId !== undefined) {
      return () => {};
    }
    const value = setSession({
      port_name: localSerialportConfig.port_name,
      message_meta: messageMetaConfig.config,
      messages: selectedApiConfig?.config || DEFAULTSerialportConversation,
    });
    setSessionId(value.session_id);

    return () => {
      removeSession({ session_id: value.session_id });
      setSessionId(undefined);
    };
  }, []);

  const [message, setMessage] = useState("");
  const prevMessage = usePrevious(message);
  useEffect(() => {
    if (message === prevMessage || sessionId === undefined) {
      return;
    }
    setSession({
      id: sessionId,
      port_name: localSerialportConfig.port_name,
      message_meta: messageMetaConfig.config,
      messages: selectedApiConfig?.config || DEFAULTSerialportConversation,
      message: message.length === 0 ? undefined : message,
    });
  }, [message]);

  useEffect(() => {
    if (!portOpened && sessionId) {
      resetSession({ session_id: sessionId });
    }
  }, [portOpened]);

  const messages = getMessagesBySessionId(sessionId || "");

  const totalTasks = messages?.messages.length || 0;
  const finishedTasks =
    messages?.messages.reduce(
      (prev, cur) =>
        prev + (cur.status === "received" || cur.status === "sent" ? 1 : 0),
      0
    ) || 0;
  const failedTasks =
    messages?.messages.reduce(
      (prev, cur) => prev + (cur.status === "failed" ? 1 : 0),
      0
    ) || 0;
  const sessionFinished = totalTasks === finishedTasks + failedTasks;
  const getNextIdx = () => {
    return messages?.messages.findIndex(
      (v) => v.sender === "Local" && v.status === "inactive"
    );
  };
  const { toastError } = useToast();
  const { sendMessageToSerialPort } = useSendMessage({
    crlf: messageMetaConfig.config.crlf,
    checkSum: messageMetaConfig.config.check_sum,
    onError: (err, payload) => {
      toastError({
        description: `send data to port: ${payload?.[0].port_name} failed, ${err}`,
      });
    },
    onSuccess: () => {},
  });

  const runAction = () => {
    const idx = getNextIdx();
    if (idx === undefined) {
      return;
    }
    const message = messages?.messages.at(idx);
    if (!message) {
      return;
    }
    sendMessageToSerialPort({
      port_name: localSerialportConfig.port_name,
      data: [...Buffer.from(message.expectedMessage || "")],
      messageId: message.id,
    });
  };

  return (
    <div className="h-full relative gap-2 flex flex-col">
      <SerialPortOpener
        serialPortConfig={localSerialportConfig}
        presetConfigName={serialportConfig.name}
        setSerialPortConfig={(v) => {
          setLocalSerialportConfig((prev) => ({ ...prev, ...v }));
          if (v.port_name && v.port_name.length > 0 && sessionId) {
            setPortName({ sessionId: sessionId, portName: v.port_name });
          }
        }}
        readonly
      />
      {messages?.messages && (
        <MessageList
          messages={messages.messages}
          sessionMode
          {...messageMetaConfig.config}
        />
      )}
      <div className="flex flex-row px-2 pt-2">
        <Progress
          label={`${finishedTasks} / ${totalTasks} finished`}
          classNames={{
            label: "text-sm font-mono min-w-fit text-nowrap",
          }}
          color="success"
          className="w-full"
          maxValue={totalTasks - failedTasks}
          value={finishedTasks}
        />
        {failedTasks > 0 && (
          <Progress
            label={`${failedTasks} failed`}
            classNames={{
              label: "text-sm min-w-fit text-nowrap font-mono",
            }}
            color="danger"
            className="w-max"
            maxValue={failedTasks}
            value={failedTasks}
          />
        )}
      </div>
      <DeviceApiMonitorInput
        apiConfigs={apiConfigs}
        selectedApiId={selectedApiId}
        setSelectedApiId={setSelectedId}
        portOpened={portOpened}
        dialogFinished={sessionFinished}
        onStart={runAction}
        onReset={() => {
          if (sessionId) {
            resetSession({ session_id: sessionId });
          }
        }}
        namedMessageMetaConfig={messageMetaConfig}
        message={message}
        onMessageChange={setMessage}
      />
    </div>
  );
};

export { DeviceApiMonitor };
