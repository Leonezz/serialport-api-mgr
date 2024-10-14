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
import { MessageMetaPresetConfigSelector } from "../serialport/config/config_selector";
import { StyledTitle } from "../basics/styled_title";
import { useDialogSession } from "@/hooks/dialog_session/useDialogSession";
import { useUpdateEffect } from "ahooks";

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
      label={<StyledTitle size="medium">Api Config</StyledTitle>}
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
  sending: boolean;
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
  sending,
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
            width="w-fit"
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
            isLoading={sending}
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
  const [message, setMessage] = useState("");

  const selectedApiConfig = apiConfigs
    .filter((v) => v.id === selectedApiId)
    .at(0);

  const [localSessionId, setLocalSessionId] = useState<string | undefined>(
    undefined
  );

  const {
    sessionId,
    totalTasks,
    finishedTasks,
    failedTasks,
    sessionFinished,
    runNext,
    sending,
    messages,
    setPortName,
    reset,
  } = useDialogSession({
    sessionId: localSessionId,
    messageMetaConfig: messageMetaConfig.config,
    apiConfig: selectedApiConfig?.config || DEFAULTSerialportConversation,
    message: message,
    portName: localSerialportConfig.port_name,
  });

  useUpdateEffect(() => {
    if (localSessionId !== undefined) {
      setPortName(localSerialportConfig.port_name);
    }
  }, [localSessionId, localSerialportConfig.port_name]);

  useUpdateEffect(() => {
    setLocalSessionId(sessionId);
  }, [sessionId]);

  useUpdateEffect(() => {
    if (!portOpened && sessionId) {
      reset();
    }
  }, [portOpened]);

  return (
    <div className="h-full relative gap-2 flex flex-col">
      <SerialPortOpener
        serialPortConfig={localSerialportConfig}
        presetConfigName={serialportConfig.name}
        setSerialPortConfig={(v) => {
          setLocalSerialportConfig((prev) => ({ ...prev, ...v }));
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
        sending={sending}
        dialogFinished={sessionFinished}
        onStart={() => {
          runNext();
        }}
        onReset={() => {
          reset();
        }}
        namedMessageMetaConfig={messageMetaConfig}
        message={message}
        onMessageChange={setMessage}
      />
    </div>
  );
};

export { DeviceApiMonitor };
