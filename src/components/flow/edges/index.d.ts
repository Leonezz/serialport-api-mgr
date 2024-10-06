import { Edge } from "@xyflow/react";
import { AvaliableFlowEdgeTypes, FlowEdgeCategories } from "./edge_types";

export type FlowEdge<
  EdgeData extends Record<string, unknown> = Record<string, unknown>,
  NodeType extends FlowEdgeCategories
> = Edge<EdgeData.EdgeType>;
