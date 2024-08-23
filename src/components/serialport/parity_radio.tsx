import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";

type ParityRadioProps = SerialConfigRadioProps<"parity">;
const ParityRadio = (props: ParityRadioProps) => {
  const Component = RadioBuilder("parity");
  return <Component {...props} />;
};

export default ParityRadio;
