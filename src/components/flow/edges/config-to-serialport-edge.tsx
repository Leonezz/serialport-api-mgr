// import { EdgeProps, useNodesData } from "@xyflow/react";
// import { FlowEdge } from ".";
// import { SerialportConfigFlowNodeType } from "../nodes/serialport_config_node";
// import { SerialportFlowNodeType } from "../nodes/serialport_node";
// import { DefaultFlowEdge } from "./default_edge";

// type ConfigToSerialportFlowEdgeType = FlowEdge<
//   {},
//   "serialport-config@serialport-configTOserialport@serialport-config"
// >;
// type ConfigToSerialportFlowEdgeProps =
//   EdgeProps<ConfigToSerialportFlowEdgeType>;
// export const ConfigToSerialportFlowEdge = ({
//   data,
//   ...edgeProps
// }: ConfigToSerialportFlowEdgeProps) => {
//   const { source, target } = edgeProps;

//   const configData = useNodesData<SerialportConfigFlowNodeType>(source);
//   const portData = useNodesData<SerialportFlowNodeType>(target);

//   const configValid = (configData?.data.configId || "").length > 0;
//   const portSelected = (portData?.data.portName || "").length > 0;
//   const portOpened = !!portData?.data.active;

//   return (
//     <DefaultFlowEdge
//       sourceActive={configValid}
//       targetActive={portSelected}
//       removable={!portOpened}
//       {...edgeProps}
//     />
//   );
// };
