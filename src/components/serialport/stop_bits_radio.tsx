import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";

type StopBitsRadioProps = SerialConfigRadioProps<"StopBits">;
const StopBitsRadio = (props: StopBitsRadioProps) => {
  const Component = RadioBuilder("StopBits");
  return <Component {...props} />;
};
export default StopBitsRadio;
