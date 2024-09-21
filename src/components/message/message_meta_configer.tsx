import {
  MessageMetaConfig,
  MessageMetaConfigFields,
  MessageMetaOptions,
} from "@/types/message/message_meta";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { startCase } from "es-toolkit";

const OptionSelector = <T1 extends keyof typeof MessageMetaOptions>({
  selectorFor,
  fullWidth,
}: {
  selectorFor: T1;
  fullWidth?: boolean;
}) => {
  const options = MessageMetaOptions[selectorFor];
  return ({
    value,
    setValue,
    verticalLayout,
  }: {
    value: MessageMetaConfigFields<T1>;
    setValue: (value: MessageMetaConfigFields<T1>) => void;
    verticalLayout?: boolean;
  }) => (
    <Autocomplete
      label={
        <p
          className={`text-${
            verticalLayout ? "lg" : "sm"
          } font-bold font-mono w-max`}
        >
          {startCase(selectorFor)}
        </p>
      }
      labelPlacement={"inside"}
      allowsCustomValue={false}
      defaultSelectedKey={value}
      onEmptied={() => {
        setValue(options[0]);
      }}
      value={value}
      defaultInputValue={value}
      inputValue={value}
      onSelectionChange={(key) => {
        setValue(key?.toString() as MessageMetaConfigFields<T1>);
      }}
      size="sm"
      className={`w-${
        fullWidth ? "full" : "fit"
      } text-xs font-mono hover:w-full`}
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

type MessageMetaConfigerProps = {
  value: MessageMetaConfig;
  onValueChange: (data: Partial<MessageMetaConfig>) => void;
  verticalLayout?: boolean;
  fullWidth?: boolean;
};
const MessageMetaConfiger = ({
  value,
  onValueChange,
  verticalLayout,
}: MessageMetaConfigerProps) => {
  const ViewModeSelector = OptionSelector({
    selectorFor: "view_mode",
    fullWidth: verticalLayout,
  });
  const TextEncodingSelector = OptionSelector({
    selectorFor: "text_encoding",
    fullWidth: verticalLayout,
  });
  const CRLFSelector = OptionSelector({
    selectorFor: "crlf",
    fullWidth: verticalLayout,
  });
  const CheckSumSelector = OptionSelector({
    selectorFor: "check_sum",
    fullWidth: verticalLayout,
  });
  return (
    <div
      className={`flex flex-${verticalLayout ? "col" : "row"} gap-${
        verticalLayout ? "4" : "2"
      }`}
    >
      <ViewModeSelector
        value={value.view_mode}
        setValue={(v) => onValueChange({ view_mode: v })}
        verticalLayout={verticalLayout}
      />
      {value.view_mode === "Text" ? (
        <TextEncodingSelector
          value={value.text_encoding}
          setValue={(v) => onValueChange({ text_encoding: v })}
          verticalLayout={verticalLayout}
        />
      ) : null}
      <CRLFSelector
        value={value.crlf}
        setValue={(v) => onValueChange({ crlf: v })}
        verticalLayout={verticalLayout}
      />
      <CheckSumSelector
        value={value.check_sum}
        setValue={(v) => onValueChange({ check_sum: v })}
        verticalLayout={verticalLayout}
      />
    </div>
  );
};

export { MessageMetaConfiger };
