// import { EdgeProps, useNodesData } from "@xyflow/react";
// import { FlowEdge } from ".";
// import { DefaultFlowEdge } from "./default_edge";
// import { InputFlowNodeType } from "../nodes/input_node";

// type TextInputToOutputFlowEdgeType = FlowEdge<
//   {},
//   "text-input@valueTOtext-preview@value"
// >;
// type TextInputToOutputFlowEdgeProps = EdgeProps<TextInputToOutputFlowEdgeType>;

// export const TextInputToOutputFlowEdge = ({
//   data,
//   ...edgeProps
// }: TextInputToOutputFlowEdgeProps) => {
//   const { source } = edgeProps;
//   const inputText = useNodesData<InputFlowNodeType>(source);
//   const inputValid = !!(
//     inputText?.data.value && inputText.data.value.length > 0
//   );
//   return (
//     <DefaultFlowEdge
//       sourceActive={inputValid}
//       targetActive={true}
//       removable={true}
//       {...edgeProps}
//     />
//   );
// };
