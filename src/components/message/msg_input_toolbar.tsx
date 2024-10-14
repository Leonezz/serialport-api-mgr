import { emitToRustBus } from "@/bridge/call_rust";
import { useRequestState } from "@/hooks/commands/useRequestState";
import { Button, ButtonGroup } from "@nextui-org/react";
import { useToast } from "../shadcn/use-toast";
import { MessageMetaConfig } from "@/types/message/message_meta";
import { MessageMetaConfiger } from "./message_meta_configer";
import { useState } from "react";
import { useNamedMessageMetaConfigStore } from "@/hooks/store/useNamedMessageMetaConfig";
import { MessageMetaPresetConfigSelector } from "../serialport/config/config_selector";
import { ERROR } from "@/bridge/logging";

export type MsgInputToolBarProps = {
  portName: string;
  portOpened: boolean;
  messageMetaConfig: MessageMetaConfig;
  updateMessageMetaConfig: (data: Partial<MessageMetaConfig>) => void;
};

const MsgInputToolBar = ({
  portName,
  portOpened,
  messageMetaConfig,
  updateMessageMetaConfig,
}: MsgInputToolBarProps) => {
  const { toastError } = useToast();
  const { runRequest: writeDtr } = useRequestState({
    action: (dtr: boolean) =>
      emitToRustBus("write_dtr", { port_name: portName, dtr: dtr }),
    onError: (err) => {
      toastError({
        description: `write dtr to ${portName} failed: ${err?.msg}`,
      });
    },
  });
  const { runRequest: writeRts } = useRequestState({
    action: (rts: boolean) =>
      emitToRustBus("write_rts", { port_name: portName, rts: rts }),
    onError: (err) => {
      ERROR("write rts", JSON.stringify(err));
      toastError({
        description: `write rts to ${portName} failed: ${err?.msg}`,
      });
    },
  });
  const [presetName, setPresetName] = useState("");

  const { getByName } = useNamedMessageMetaConfigStore();
  const onPresetSelected = (name: string) => {
    setPresetName(name);
    const presetConfig = getByName({ name: name });

    if (!presetConfig) {
      return;
    }
    updateMessageMetaConfig(presetConfig.config);
  };

  return (
    <div className="justify-between w-full flex flex-row gap-2">
      <MessageMetaPresetConfigSelector
        selectedName={presetName}
        setSelectedName={onPresetSelected}
        readonly={false}
        width="w-fit"
        height="h-full"
      />
      <MessageMetaConfiger
        value={messageMetaConfig}
        onValueChange={updateMessageMetaConfig}
      />
      <div className="flex flex-col self-center">
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="dtr" className="text-sm font-mono">
            DTR
          </label>
          <ButtonGroup size="sm" id="dtr" isDisabled={!portOpened}>
            <Button
              variant="solid"
              color="success"
              className="h-fit w-fit rounded-none"
              onClick={() => writeDtr(true)}
            >
              HIGH
            </Button>
            <Button
              variant="flat"
              color="danger"
              className="h-fit w-fit rounded-none"
              onClick={() => writeDtr(false)}
            >
              LOW
            </Button>
          </ButtonGroup>
        </div>
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="rts" className="text-sm font-mono">
            RTS
          </label>
          <ButtonGroup size="sm" id="rts" isDisabled={!portOpened}>
            <Button
              variant="solid"
              color="success"
              className="h-fit w-fit rounded-none"
              onClick={() => writeRts(true)}
            >
              HIGH
            </Button>
            <Button
              variant="flat"
              color="danger"
              className="h-fit w-fit rounded-none"
              onClick={() => writeRts(false)}
            >
              LOW
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
};
export default MsgInputToolBar;
