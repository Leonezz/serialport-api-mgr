import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";

type FlowControlRadioProps = SerialConfigRadioProps<"flow_control">;
const FlowControlRadio = (props: FlowControlRadioProps) => {
  const Component = RadioBuilder("flow_control");
  return <Component {...props} />;
};

export default FlowControlRadio;
