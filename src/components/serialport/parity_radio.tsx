import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";

type ParityRadioProps = SerialConfigRadioProps<"Parity">;
const ParityRadio = (props: ParityRadioProps) => {
  const Component = RadioBuilder("Parity");
  return <Component {...props} />;
};

export default ParityRadio;
