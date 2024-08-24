import { emitToRustBus } from "@/bridge/call_rust";
import useRequestState from "@/hooks/commands.ts/useRequestState";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  ButtonGroup,
  Checkbox,
} from "@nextui-org/react";
import { useState } from "react";
import { useToast } from "../shadcn/use-toast";
import { ViewModeOptions, ViewModeType } from "@/types/message/view_mode";
import { CRLFOptions, CRLFOptionsType } from "@/types/message/crlf";
import {
  TextEncodingOptions,
  TextEncodingType,
} from "@/types/message/encoding";

export type MsgInputToolBarProps = {
  portName: string;
  viewMode: ViewModeType;
  setViewMode: (mode: ViewModeType) => void;
  crlfMode: CRLFOptionsType;
  setCrlfMode: (mode: CRLFOptionsType) => void;
  textEncoding: TextEncodingType;
  setTextEncoding: (mode: TextEncodingType) => void;
  portOpened: boolean
};

const MsgInputToolBar = ({
  portName,
  viewMode,
  setViewMode,
  crlfMode,
  setCrlfMode,
  textEncoding,
  setTextEncoding,
  portOpened
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
      console.log(err)
      toastError({
        description: `write rts to ${portName} failed: ${err?.msg}`,
      });
    },
  });

  return (
    <div className="justify-between w-full flex flex-row">
      <div className="flex flex-row gap-2">
        <Autocomplete
          label={<p className="text-xs font-bold font-mono w-max">View Mode</p>}
          labelPlacement="outside-left"
          allowsCustomValue={false}
          defaultSelectedKey={"Text"}
          onEmptied={() => {
            setViewMode("Text");
          }}
          value={viewMode}
          onSelectionChange={(key) => {
            setViewMode(key?.toString() as ViewModeType);
          }}
          size="sm"
          className="w-40 text-xs font-mono"
          isClearable={false}
        >
          {ViewModeOptions.map((option) => (
            <AutocompleteItem
              key={option}
              textValue={option}
              className="text-xs font-mono"
            >
              {option}
            </AutocompleteItem>
          ))}
        </Autocomplete>
        {viewMode === "Text" ? (
          <Autocomplete
            label={
              <p className="text-xs font-bold font-mono w-max">Encoding</p>
            }
            labelPlacement="outside-left"
            defaultSelectedKey={textEncoding}
            allowsCustomValue={false}
            onEmptied={() => setTextEncoding("utf-8")}
            value={textEncoding}
            onSelectionChange={(key) =>
              setTextEncoding((key?.toString() || "utf-8") as TextEncodingType)
            }
            className="w-fit text-xs font-mono"
            isClearable={false}
          >
            {TextEncodingOptions.map((option) => (
              <AutocompleteItem
                key={option}
                textValue={option}
                className="text-xs font-mono"
              >
                {option}
              </AutocompleteItem>
            ))}
          </Autocomplete>
        ) : null}
        <Autocomplete
          label={<p className="text-xs font-bold font-mono w-max">CRLF</p>}
          labelPlacement="outside-left"
          defaultSelectedKey={"CRLF"}
          allowsCustomValue={false}
          onEmptied={() => {
            setCrlfMode("CRLF");
          }}
          value={crlfMode}
          onSelectionChange={(key) =>
            setCrlfMode((key?.toString() || "CRLF") as CRLFOptionsType)
          }
          className="w-32 text-xs font-mono"
          isClearable={false}
        >
          {CRLFOptions.map((option) => (
            <AutocompleteItem
              key={option}
              textValue={option}
              className="text-xs font-mono"
            >
              {option}
            </AutocompleteItem>
          ))}
        </Autocomplete>
      </div>
      <div className="flex flex-col gap-0">
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
