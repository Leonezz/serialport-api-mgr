import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";

type StopBitsRadioProps = SerialConfigRadioProps<"stop_bits">;
const StopBitsRadio = (props: StopBitsRadioProps) => {
  const Component = RadioBuilder("stop_bits");
  return <Component {...props} />;
};
export default StopBitsRadio;
