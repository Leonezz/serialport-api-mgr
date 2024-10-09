import RadioBuilder, { SerialConfigRadioProps } from "./radio_builder";
const Component = RadioBuilder("flow_control");
type FlowControlRadioProps = SerialConfigRadioProps<"flow_control">;
const FlowControlRadio = (props: FlowControlRadioProps) => {
  return <Component {...props} />;
};

export default FlowControlRadio;
