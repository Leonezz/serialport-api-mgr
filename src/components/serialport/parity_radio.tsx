import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";
const Component = RadioBuilder("parity");
type ParityRadioProps = SerialConfigRadioProps<"parity">;
const ParityRadio = (props: ParityRadioProps) => {
  return <Component {...props} />;
};

export default ParityRadio;
