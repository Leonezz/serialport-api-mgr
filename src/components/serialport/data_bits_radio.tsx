import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";

type DataBitsRadioProps = SerialConfigRadioProps<"data_bits">;
const DataBitsRadio = (props: DataBitsRadioProps) => {
  const Component = RadioBuilder("data_bits");
  return <Component {...props} />;
};

export default DataBitsRadio;
