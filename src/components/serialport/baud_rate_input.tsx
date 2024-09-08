import { SERIALPORT } from "@/types/serialport/base";
import {
  OpenedPortStatus,
  SerialPortStatus,
} from "@/types/serialport/serialport_status";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";

type BaudRateInputProps = {
  value: number;
  portStatus?: SerialPortStatus["port_status"];
  setValue: (value: number) => void;
};
const BaudRateInput = ({ value, setValue, portStatus }: BaudRateInputProps) => {
  const readonly = !!portStatus && portStatus !== "Closed";
  const defauleValue = (
    readonly ? (portStatus as OpenedPortStatus).Opened.baud_rate : value
  ).toString();
  return (
    <Autocomplete
      isReadOnly={readonly}
      type="number"
      allowsCustomValue
      label={
        <p className="text-medium font-bold text-content1-foreground">
          Baud Rate
        </p>
      }
      isClearable={false}
      labelPlacement="outside"
      placeholder="Set a baud rate"
      size="sm"
      value={defauleValue}
      defaultInputValue={defauleValue}
      inputValue={defauleValue}
      onValueChange={(value) => {
        setValue(Number(value));
      }}
      onSelectionChange={(key) => {
        if (key === null) {
          return;
        }
        const value = Number(key.toString());
        setValue(value);
      }}
    >
      {SERIALPORT.CommonlyUsedBaudRates.map((v) => (
        <AutocompleteItem key={v} textValue={`${v}`}>
          {v}
        </AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

export default BaudRateInput;
