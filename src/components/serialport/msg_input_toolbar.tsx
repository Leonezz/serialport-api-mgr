import { emitToRustBus } from "@/bridge/call_rust";
import useRequestState from "@/hooks/commands.ts/useRequestState";
import {
  Autocomplete,
  AutocompleteItem,
  Checkbox,
} from "@nextui-org/react";
import { useState } from "react";
import { useToast } from "../shadcn/use-toast";
import { ViewModeOptions, ViewModeType } from "@/types/message/view_mode";
import { CRLFOptions, CRLFOptionsType } from "@/types/message/crlf";
import { TextEncodingOptions, TextEncodingType } from "@/types/message/encoding";

export type MsgInputToolBarProps = {
  portName: string;
  viewMode: ViewModeType;
  setViewMode: (mode: ViewModeType) => void;
  crlfMode: CRLFOptionsType;
  setCrlfMode: (mode: CRLFOptionsType) => void;
  textEncoding: TextEncodingType;
  setTextEncoding: (mode: TextEncodingType) => void;
};

const MsgInputToolBar = ({
  portName,
  viewMode,
  setViewMode,
  crlfMode,
  setCrlfMode,
  textEncoding,
  setTextEncoding,
}: MsgInputToolBarProps) => {
  const [dtr, setDtr] = useState(false);
  const [rts, setRts] = useState(false);
  const { toastError } = useToast();
  const { runRequest: writeDtr } = useRequestState({
    action: () => emitToRustBus("write_dtr", { port_name: portName, dtr: dtr }),
    onError: (err) => {
      setDtr(!dtr);
      toastError({
        description: `write dtr to ${portName} failed: ${err}`,
      });
    },
  });
  const { runRequest: writeRts } = useRequestState({
    action: () => emitToRustBus("write_rts", { port_name: portName, rts: rts }),
    onError: (err) => {
      setRts(!rts);
      toastError({
        description: `write rts to ${portName} failed: ${err}`,
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
      <div className="flex flex-col">
        <Checkbox
          className="text-xs font-mono"
          size="sm"
          isSelected={dtr}
          onValueChange={(value) => {
            setDtr(value);
            writeDtr();
          }}
        >
          DTR
        </Checkbox>
        <Checkbox
          className="text-xs font-mono"
          size="sm"
          isSelected={rts}
          onValueChange={(value) => {
            setRts(value);
            writeRts();
          }}
        >
          RTS
        </Checkbox>
      </div>
    </div>
  );
};
export default MsgInputToolBar;
