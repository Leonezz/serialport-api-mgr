import { ConnectableNodes } from "../nodes/node_types";
// import { ConfigToSerialportFlowEdge } from "./config-to-serialport-edge";
import { DefaultFlowEdge } from "./default_edge";
// import { TextInputToOutputFlowEdge } from "./text_input_to_output";
type ValueOf<T, K> = K extends keyof T ? T[K] : never;

type ConnectionOf<K extends keyof typeof ConnectableNodes> = ValueOf<
  Pick<typeof ConnectableNodes, K>,
  K
>;
type FlowEdgeTypePettern<Key extends keyof typeof ConnectableNodes> =
  `${ConnectionOf<Key>[number]["sourceNode"]}@${ConnectionOf<Key>[number]["souceHandle"]}TO${ConnectionOf<Key>[number]["targetNode"]}@${ConnectionOf<Key>[number]["targetHandle"]}`;

export const AvaliableFlowEdgeTypes = [
  "serialport-config@serialport-configTOserialport@serialport-config" satisfies FlowEdgeTypePettern<"serialport-config">,
  "serialport-config@serialport-configTOtext-preview@value" satisfies FlowEdgeTypePettern<"serialport-config">,
  "message-meta-config@message-meta-configTOtext-preview@value" satisfies FlowEdgeTypePettern<"message-meta-config">,
  "message-meta-config@message-meta-configTOserialport-api-config@message-meta-config" satisfies FlowEdgeTypePettern<"message-meta-config">,
  "serialport@serialportTOserialport-api-config@serialport" satisfies FlowEdgeTypePettern<"serialport">,
  "serialport@serialportTOtext-preview@value" satisfies FlowEdgeTypePettern<"serialport">,
  "text-input@valueTOtext-preview@value" satisfies FlowEdgeTypePettern<"text-input">,
  "text-input@valueTOserialport-api-config@value" satisfies FlowEdgeTypePettern<"text-input">,
  "text-input@valueTOscript@script" satisfies FlowEdgeTypePettern<"text-input">,
  "script@scriptTOserialport-api-config@value" satisfies FlowEdgeTypePettern<"script">,
  "script@scriptTOtext-preview@value" satisfies FlowEdgeTypePettern<"script">,
  "script@scriptTOscript@script" satisfies FlowEdgeTypePettern<"script">,
  "text-preview@valueTOscript@script" satisfies FlowEdgeTypePettern<"text-preview">,
  "text-preview@valueTOserialport-api-config@value" satisfies FlowEdgeTypePettern<"text-preview">,
  "text-preview@valueTOtext-preview@value" satisfies FlowEdgeTypePettern<"text-preview">,
] as const;

export const FlowEdgeTypes = {
  "serialport-config@serialport-configTOserialport@serialport-config":
    DefaultFlowEdge,
  "serialport-config@serialport-configTOtext-preview@value": DefaultFlowEdge,
  "serialport@serialportTOtext-preview@value": DefaultFlowEdge,
  "serialport@serialportTOserialport-api-config@serialport": DefaultFlowEdge,
  "message-meta-config@message-meta-configTOtext-preview@value":
    DefaultFlowEdge,
  "message-meta-config@message-meta-configTOserialport-api-config@message-meta-config":
    DefaultFlowEdge,
  "text-input@valueTOtext-preview@value": DefaultFlowEdge,
  "text-input@valueTOserialport-api-config@value": DefaultFlowEdge,
  "script@scriptTOserialport-api-config@value": DefaultFlowEdge,
  "script@scriptTOtext-preview@value": DefaultFlowEdge,
  "script@scriptTOscript@script": DefaultFlowEdge,
  "text-input@valueTOscript@script": DefaultFlowEdge,
  "text-preview@valueTOscript@script": DefaultFlowEdge,
  "text-preview@valueTOserialport-api-config@value": DefaultFlowEdge,
  "text-preview@valueTOtext-preview@value": DefaultFlowEdge,
} as const satisfies Record<(typeof AvaliableFlowEdgeTypes)[number], any>;

export type FlowEdgeCategories = keyof typeof FlowEdgeTypes;
