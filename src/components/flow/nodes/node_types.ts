import {
  SerialportApiFlowNode,
  SerialportApiFlowNodeHandles,
  SerialportApiFlowNodeType,
} from "./api_node";
import {
  InputFlowNode,
  InputFlowNodeHandles,
  InputFlowNodeType,
} from "./input_node";
import {
  MessageMetaConfigFlowNode,
  MessageMetaConfigFlowNodeHandles,
  MessageMetaConfigFlowNodeType,
} from "./message_meta_config_node";
import {
  PreviewFlowNode,
  PreviewFlowNodeHandles,
  PreviewFlowNodeType,
} from "./preview_node";
import {
  ScriptFlowNode,
  ScriptFlowNodeHandles,
  ScriptFlowNodeType,
} from "./script_node";
import {
  SerialportConfigFlowNode,
  SerialportConfigFlowNodeHandles,
  SerialportConfigFlowNodeType,
} from "./serialport_config_node";
import {
  SerialportFlowNode,
  SerialportFlowNodeHandles,
  SerialportFlowNodeType,
} from "./serialport_node";

export const FlowNodeTypes = {
  serialport: SerialportFlowNode,
  "serialport-config": SerialportConfigFlowNode,
  "message-meta-config": MessageMetaConfigFlowNode,
  "serialport-api-config": SerialportApiFlowNode,
  script: ScriptFlowNode,
  "text-input": InputFlowNode,
  "text-preview": PreviewFlowNode,
};
export type FlowNodeCategories = keyof typeof FlowNodeTypes;
export type FlowNodeTypes =
  | SerialportFlowNodeType
  | SerialportConfigFlowNodeType
  | MessageMetaConfigFlowNodeType
  | SerialportApiFlowNodeType
  | ScriptFlowNodeType
  | InputFlowNodeType
  | PreviewFlowNodeType;

const FlowNodeHandles = {
  "serialport-config": SerialportConfigFlowNodeHandles,
  serialport: SerialportFlowNodeHandles,
  "message-meta-config": MessageMetaConfigFlowNodeHandles,
  "serialport-api-config": SerialportApiFlowNodeHandles,
  script: ScriptFlowNodeHandles,
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
    // {
    //   sourceNode: "serialport-config",
    //   targetNode: "script",
    //   souceHandle: "serialport-config",
    //   targetHandle: "script",
    // } satisfies ConnectionType<"serialport-config", "script">,
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
    // {
    //   sourceNode: "serialport",
    //   targetNode: "script",
    //   souceHandle: "serialport",
    //   targetHandle: "script",
    // } satisfies ConnectionType<"serialport", "script">,
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
    // {
    //   sourceNode: "message-meta-config",
    //   targetNode: "script",
    //   souceHandle: "message-meta-config",
    //   targetHandle: "script",
    // } satisfies ConnectionType<"message-meta-config", "script">,
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
    {
      sourceNode: "text-input",
      targetNode: "script",
      souceHandle: "value",
      targetHandle: "script",
    } satisfies ConnectionType<"text-input", "script">,
  ],
  script: [
    {
      sourceNode: "script",
      targetNode: "text-preview",
      souceHandle: "script",
      targetHandle: "value",
    } satisfies ConnectionType<"script", "text-preview">,
    {
      sourceNode: "script",
      targetNode: "serialport-api-config",
      souceHandle: "script",
      targetHandle: "value",
    } satisfies ConnectionType<"script", "serialport-api-config">,
    {
      sourceNode: "script",
      targetNode: "script",
      souceHandle: "script",
      targetHandle: "script",
    } satisfies ConnectionType<"script", "script">,
  ],
  "text-preview": [
    {
      sourceNode: "text-preview",
      targetNode: "text-preview",
      souceHandle: "value",
      targetHandle: "value",
    } satisfies ConnectionType<"text-preview", "text-preview">,
    {
      sourceNode: "text-preview",
      targetNode: "serialport-api-config",
      souceHandle: "value",
      targetHandle: "value",
    } satisfies ConnectionType<"text-preview", "serialport-api-config">,
    {
      sourceNode: "text-preview",
      targetNode: "script",
      souceHandle: "value",
      targetHandle: "script",
    } satisfies ConnectionType<"text-preview", "script">,
  ],
  "serialport-api-config": [
    {
      sourceNode: "serialport-api-config",
      targetNode: "serialport-api-config",
      souceHandle: "value",
      targetHandle: "value",
    } satisfies ConnectionType<
      "serialport-api-config",
      "serialport-api-config"
    >,
    {
      sourceNode: "serialport-api-config",
      targetNode: "script",
      souceHandle: "value",
      targetHandle: "script",
    } satisfies ConnectionType<"serialport-api-config", "script">,
    {
      sourceNode: "serialport-api-config",
      targetNode: "text-preview",
      souceHandle: "value",
      targetHandle: "value",
    } satisfies ConnectionType<"serialport-api-config", "text-preview">,
  ],
} as const satisfies Record<FlowNodeCategories, any>;
