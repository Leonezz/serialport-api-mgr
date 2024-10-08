import { SerialportApiFlowNode } from "./api_node";
import { InputFlowNode, InputFlowNodeHandles } from "./input_node";
import {
  MessageMetaConfigFlowNode,
  MessageMetaConfigFlowNodeHandles,
} from "./message_meta_config_node";
import { PreviewFlowNode, PreviewFlowNodeHandles } from "./preview_node";
import {
  SerialportConfigFlowNode,
  SerialportConfigFlowNodeHandles,
} from "./serialport_config_node";
import {
  SerialportFlowNode,
  SerialportFlowNodeHandles,
} from "./serialport_node";

export const FlowNodeTypes = {
  serialport: SerialportFlowNode,
  "serialport-config": SerialportConfigFlowNode,
  "message-meta-config": MessageMetaConfigFlowNode,
  "serialport-api-config": SerialportApiFlowNode,
  "text-input": InputFlowNode,
  "text-preview": PreviewFlowNode,
};
export type FlowNodeCategories = keyof typeof FlowNodeTypes;

const FlowNodeHandles = {
  "serialport-config": SerialportConfigFlowNodeHandles,
  serialport: SerialportFlowNodeHandles,
  "message-meta-config": MessageMetaConfigFlowNodeHandles,
  "serialport-api-config": SerialportConfigFlowNodeHandles,
  "text-input": InputFlowNodeHandles,
  "text-preview": PreviewFlowNodeHandles,
} as const satisfies Record<
  FlowNodeCategories,
  { input?: Record<string, string>; output?: Record<string, string> }
>;

type ValueOf<T, K> = K extends keyof T ? T[K] : never;
type ConnectionType<
  SourceNode extends FlowNodeCategories,
  TargetNode extends FlowNodeCategories
> = {
  sourceNode: SourceNode;
  targetNode: TargetNode;
  souceHandle: keyof ValueOf<
    ValueOf<typeof FlowNodeHandles, SourceNode>,
    "output"
  >;
  targetHandle: keyof ValueOf<
    ValueOf<typeof FlowNodeHandles, TargetNode>,
    "input"
  >;
};

export const ConnectableNodes = {
  "serialport-config": [
    {
      sourceNode: "serialport-config",
      targetNode: "serialport",
      souceHandle: "serialport-config",
      targetHandle: "serialport-config",
    } satisfies ConnectionType<"serialport-config", "serialport">,
    {
      sourceNode: "serialport-config",
      targetNode: "text-preview",
      targetHandle: "value",
      souceHandle: "serialport-config",
    } satisfies ConnectionType<"serialport-config", "text-preview">,
  ],
  serialport: [
    {
      sourceNode: "serialport",
      targetNode: "text-preview",
      souceHandle: "serialport",
      targetHandle: "value",
    } satisfies ConnectionType<"serialport", "text-preview">,
    {
      sourceNode: "serialport",
      targetNode: "serialport-api-config",
      souceHandle: "serialport",
      targetHandle: "serialport",
    } satisfies ConnectionType<"serialport", "serialport-api-config">,
  ],
  "message-meta-config": [
    {
      sourceNode: "message-meta-config",
      targetNode: "text-preview",
      souceHandle: "message-meta-config",
      targetHandle: "value",
    } satisfies ConnectionType<"message-meta-config", "text-preview">,
    {
      sourceNode: "message-meta-config",
      targetNode: "serialport-api-config",
      souceHandle: "message-meta-config",
      targetHandle: "message-meta-config",
    } satisfies ConnectionType<"message-meta-config", "serialport-api-config">,
  ],
  "text-input": [
    {
      sourceNode: "text-input",
      targetNode: "text-preview",
      souceHandle: "value",
      targetHandle: "value",
    } satisfies ConnectionType<"text-input", "text-preview">,
    {
      sourceNode: "text-input",
      targetNode: "serialport-api-config",
      souceHandle: "value",
      targetHandle: "value",
    } satisfies ConnectionType<"text-input", "serialport-api-config">,
  ],
  "text-preview": [],
  "serialport-api-config": [],
} as const satisfies Record<FlowNodeCategories, any>;
