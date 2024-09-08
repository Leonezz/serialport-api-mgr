import useNamedMessageMetaConfigStore from "@/hooks/store/useNamedMessageMetaConfig";
import useNamedSerialortConfigStore from "@/hooks/store/useNamedSerialPortConfig";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";

type PresetConfigSelectorProps = {
  selectorFor: "serialport" | "message";
  selectedName: string;
  setSelectedName: (name: string) => void;
  readonly: boolean;
};
const PresetConfigSelector = ({
  selectorFor: key,
  selectedName,
  setSelectedName,
  readonly,
}: PresetConfigSelectorProps) => {
  const { getNameList } =
    key === "serialport"
      ? useNamedSerialortConfigStore()
      : useNamedMessageMetaConfigStore();
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
        <p className="text-medium font-bold text-content1-foreground">
          Preset Config
        </p>
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
      className="text-xs font-mono w-max min-w-fit"
    >
      {nameList.map((n) => (
        <AutocompleteItem key={n} textValue={n}>
          {n}
        </AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

export default PresetConfigSelector;
