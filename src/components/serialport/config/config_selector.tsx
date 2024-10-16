import { StyledTitle } from "@/components/basics/styled_title";
import { UseStoreHandles } from "@/components/config_mgr/util";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { capitalize } from "es-toolkit";

type PresetConfigSelectorProps = {
  selectedName: string;
  setSelectedName: (name: string) => void;
  readonly: boolean;
  width: "w-full" | "w-fit" | "w-min" | "w-max";
  height: "h-full" | "h-fit" | "h-min" | "h-max";
};

const PresetConfigSelector = <Key extends "serialport" | "message" | "api">(
  selectorFor: Key
) => {
  return ({
    selectedName,
    setSelectedName,
    readonly,
    width,
    height,
  }: PresetConfigSelectorProps) => {
    const { getNameList } = UseStoreHandles[selectorFor]();
    const nameList = getNameList();
    const onValueChange = (value: string) => {
      if (value.length === 0) {
        return;
      }
      setSelectedName(value);
    };

    return (
      <Autocomplete
        isReadOnly={readonly}
        type="text"
        allowsCustomValue
        label={
          <StyledTitle size="small" color={readonly ? "default" : "primary"}>
            {`${capitalize(selectorFor)} Config`}
          </StyledTitle>
        }
        isClearable={false}
        placeholder="Select a preset"
        size="sm"
        value={selectedName}
        defaultInputValue={selectedName}
        onValueChange={onValueChange}
        onSelectionChange={(key) => {
          if (key === null) {
            return;
          }
          const value = key.toString();
          onValueChange(value);
        }}
        className={`text-xs font-mono ${width} ${height} min-w-fit hover:w-full"
        }`}
      >
        {nameList.map((n) => (
          <AutocompleteItem key={n} textValue={n}>
            {n}
          </AutocompleteItem>
        ))}
      </Autocomplete>
    );
  };
};

export const SerialportPresetConfigSelector =
  PresetConfigSelector("serialport");
export const SerialportApiPresetConfigSelector = PresetConfigSelector("api");
export const MessageMetaPresetConfigSelector = PresetConfigSelector("message");

// export { PresetConfigSelector };
