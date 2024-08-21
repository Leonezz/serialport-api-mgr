import { SERIALPORT } from "@/bridge/call_rust";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";

type BaudRateInputProps = {
  value: number;
  setValue: (value: number) => void;
  readonly: boolean;
};
const BaudRateInput = ({ value, setValue, readonly }: BaudRateInputProps) => {
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
      labelPlacement="outside"
      placeholder="Set a baud rate"
      size="sm"
      value={value}
      onValueChange={(value) => {
        setValue(Number(value));
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
