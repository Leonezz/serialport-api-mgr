import { SERIALPORT } from "@/types/serialport/base";
import { OpenedPortStatus, SerialPortStatus } from "@/types/serialport/serialport_status";
import { Radio, RadioGroup } from "@nextui-org/react";
import { startCase } from "es-toolkit";

export type SerialConfigRadioProps<
  T1 extends keyof typeof SERIALPORT.ConfigOptions,
  Type = SERIALPORT.ConfigTypes<T1>
> = {
  value: Type;
  portStatus?: SerialPortStatus["port_status"];
  setValue: (v: Type) => void;
};

const RadioBuilder = <
  T1 extends "data_bits" | "flow_control" | "parity" | "stop_bits"
>(
  radioFor: T1
) => {
  const options = SERIALPORT.ConfigOptions[radioFor];
  const name = startCase(radioFor);
  type OptionType = SERIALPORT.ConfigTypes<T1>;
  type Props = SerialConfigRadioProps<T1>;
  const component = ({ value, portStatus, setValue }: Props) => {
    const readonly = !!portStatus && (portStatus !== "Closed");
    const defaultValue = (readonly ? (portStatus as OpenedPortStatus).Opened[radioFor] : value).toString();
    return (
      <RadioGroup
        isReadOnly={readonly}
        label={
          <p className="text-medium font-bold text-content1-foreground">
            {name}
          </p>
        }
        orientation="horizontal"
        value={defaultValue.toString()}
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
