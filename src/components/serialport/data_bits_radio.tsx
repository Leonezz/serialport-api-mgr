import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";

type DataBitsRadioProps = SerialConfigRadioProps<"DataBits">;
const DataBitsRadio = (props: DataBitsRadioProps) => {
  const Component = RadioBuilder("DataBits");
  return <Component {...props} />;
};

export default DataBitsRadio;
