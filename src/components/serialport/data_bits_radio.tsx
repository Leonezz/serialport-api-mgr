import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";
const Component = RadioBuilder("data_bits");
type DataBitsRadioProps = SerialConfigRadioProps<"data_bits">;
const DataBitsRadio = (props: DataBitsRadioProps) => {
  return <Component {...props} />;
};

export default DataBitsRadio;
