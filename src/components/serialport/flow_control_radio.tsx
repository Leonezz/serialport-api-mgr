import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";

type FlowControlRadioProps = SerialConfigRadioProps<"FlowControl">;
const FlowControlRadio = (props: FlowControlRadioProps) => {
  const Component = RadioBuilder("FlowControl");
  return <Component {...props} />;
};

export default FlowControlRadio;
