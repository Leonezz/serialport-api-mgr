import { emitToRustBus } from "@/bridge/call_rust";
import useRequestState from "@/hooks/commands.ts/useRequestState";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  ButtonGroup,
} from "@nextui-org/react";
import { useToast } from "../shadcn/use-toast";
import {
  MessageConfigType,
  MessageMetaOptions,
  MessageMetaType,
} from "@/types/message/message_meta";
import { startCase } from "es-toolkit";

export type MsgInputToolBarProps = {
  portName: string;
  viewMode: MessageMetaType["viewMode"];
  setViewMode: (mode: MessageMetaType["viewMode"]) => void;
  crlfMode: MessageMetaType["crlf"];
  setCrlfMode: (mode: MessageMetaType["crlf"]) => void;
  textEncoding: MessageMetaType["textEncoding"];
  setTextEncoding: (mode: MessageMetaType["textEncoding"]) => void;
  checkSum: MessageMetaType["checkSum"];
  setCheckSum: (mode: MessageMetaType["checkSum"]) => void;
  portOpened: boolean;
};

const OptionSelector = <T1 extends keyof typeof MessageMetaOptions>({
  selectorFor,
}: {
  selectorFor: T1;
}) => {
  const options = MessageMetaOptions[selectorFor];
  return ({
    value,
    setValue,
  }: {
    value: MessageConfigType<T1>;
    setValue: (value: MessageConfigType<T1>) => void;
  }) => (
    <Autocomplete
      label={
        <p className="text-xs font-bold font-mono w-max">
          {startCase(selectorFor)}
        </p>
      }
      labelPlacement="outside-left"
      allowsCustomValue={false}
      defaultSelectedKey={value}
      onEmptied={() => {
        setValue(options[0]);
      }}
      value={value}
      onSelectionChange={(key) => {
        setValue(key?.toString() as MessageConfigType<T1>);
      }}
      size="sm"
      className="w-fit text-xs font-mono hover:w-full"
      isClearable={false}
    >
      {options.map((option) => (
        <AutocompleteItem
          key={option}
          textValue={option}
          className="text-xs font-mono"
        >
          {option}
        </AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

const ViewModeSelector = OptionSelector({
  selectorFor: "viewMode",
});
const TextEncodingSelector = OptionSelector({
  selectorFor: "textEncoding",
});
const CRLFSelector = OptionSelector({
  selectorFor: "crlf",
});
const CheckSumSelector = OptionSelector({
  selectorFor: "checkSum",
});

const MsgInputToolBar = ({
  portName,
  viewMode,
  setViewMode,
  crlfMode,
  setCrlfMode,
  textEncoding,
  setTextEncoding,
  checkSum,
  setCheckSum,
  portOpened,
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
      console.log(err);
      toastError({
        description: `write rts to ${portName} failed: ${err?.msg}`,
      });
    },
  });

  return (
    <div className="justify-between w-full flex flex-row gap-2">
      <div className="flex flex-row gap-2">
        <ViewModeSelector value={viewMode} setValue={setViewMode} />
        {viewMode === "Text" ? (
          <TextEncodingSelector
            value={textEncoding}
            setValue={setTextEncoding}
          />
        ) : null}
        <CRLFSelector value={crlfMode} setValue={setCrlfMode} />
        <CheckSumSelector value={checkSum} setValue={setCheckSum} />
      </div>
      <div className="flex flex-col">
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
