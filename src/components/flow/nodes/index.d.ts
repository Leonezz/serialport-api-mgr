import { Node, NodeTypes } from "@xyflow/react";
import { FlowNodeCategories, FlowNodeTypes } from "./node_types";
export type BasicFlowNodeStatus = {
  value?: string;
  valid?: boolean;
  active?: boolean;
};
export type FlowNode<
  NodeData extends Record<string, unknown> & BasicFlowNodeStatus = Record<
    string,
    unknown
  >,
  NodeType extends FlowNodeCategories
> = Node<NodeData, NodeType>;
