import { SERIALPORT } from "@/bridge/call_rust";
import { Radio, RadioGroup } from "@nextui-org/react";

export type SerialConfigRadioProps<
  T1 extends keyof SERIALPORT.ConfigTypes,
  Type = SERIALPORT.ConfigTypes[T1]
> = {
  value: Type;
  setValue: (v: Type) => void;
  readonly: boolean;
};

const RadioBuilder = <
  T1 extends "DataBits" | "FlowControl" | "Parity" | "StopBits"
>(
  radioFor: T1
) => {
  const options = SERIALPORT.ConfigOptions[radioFor];
  const name =
    radioFor === "DataBits"
      ? "Data Bits"
      : radioFor === "FlowControl"
      ? "Flow Control"
      : radioFor === "Parity"
      ? "Parity"
      : "Stop Bits";
  type OptionType = SERIALPORT.ConfigTypes[T1];
  type Props = SerialConfigRadioProps<T1>;
  const component = ({ value, setValue, readonly }: Props) => {
    return (
      <RadioGroup
        isReadOnly={readonly}
        label={
          <p className="text-medium font-bold text-content1-foreground">
            {name}
          </p>
        }
        orientation="horizontal"
        value={value.toString()}
        onValueChange={(v) => {
          setValue(v as OptionType);
        }}
      >
        {options.map((v) => (
          <Radio value={v} key={v}>
            {v}
          </Radio>
        ))}
      </RadioGroup>
    );
  };
  return component;
};

export default RadioBuilder;
