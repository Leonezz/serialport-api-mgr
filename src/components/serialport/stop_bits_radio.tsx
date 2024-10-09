import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";
const Component = RadioBuilder("stop_bits");
type StopBitsRadioProps = SerialConfigRadioProps<"stop_bits">;
const StopBitsRadio = (props: StopBitsRadioProps) => {
  return <Component {...props} />;
};
export default StopBitsRadio;
