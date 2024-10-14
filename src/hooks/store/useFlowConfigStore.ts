import { FlowNodeTypes } from "@/components/flow/nodes/node_types";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
} from "@xyflow/react";
import {
  buildNamedConfigStore,
  NamedConfigStoreType,
} from "./buildNamedConfigStore";

export type FlowConfigStore = {
  nodes: FlowNodeTypes[];
  edges: Edge[];
};

export type NamedFlowConfigStore = NamedConfigStoreType<FlowConfigStore>;

export const useNamedFlowConfigStore =
  buildNamedConfigStore<FlowConfigStore>("flow-config.json");

export const useStoredFlowActions = ({ storeId }: { storeId: string }) => {
  const { get, update } = useNamedFlowConfigStore();
  const value = get({ id: storeId });
  const onNodesChange: OnNodesChange<FlowNodeTypes> = (changes) => {
    update({
      id: storeId,
      config: {
        nodes: applyNodeChanges(changes, value?.config.nodes || []),
      },
    });
  };

  const onEdgesChange: OnEdgesChange = (changes) => {
    update({
      id: storeId,
      config: {
        edges: applyEdgeChanges(changes, value?.config.edges || []),
      },
    });
  };

  const onConnect: OnConnect = (connection) => {
    const nodes = value?.config.nodes || [];
    const { source, target, sourceHandle, targetHandle } = connection;
    const targetType = nodes.filter((node) => node.id === target).at(0)?.type;
    const sourceType = nodes.filter((node) => node.id === source).at(0)?.type;
    const sourceHandleType = sourceHandle?.substring(
      source.length + 1,
      sourceHandle.length - "-output".length
    );
    const targetHandleType = targetHandle?.substring(
      target.length + 1,
      targetHandle.length - "-input".length
    );
    const edge = {
      ...connection,
      type: `${sourceType}@${sourceHandleType}TO${targetType}@${targetHandleType}`,
    };
    update({
      id: storeId,
      config: {
        edges: addEdge(edge, value?.config.edges || []),
      },
    });
  };

  const setNodes = (nodes: FlowNodeTypes[]) => {
    update({
      id: storeId,
      config: {
        nodes: nodes,
      },
    });
  };

  const setEdges = (edges: Edge[]) => {
    update({
      id: storeId,
      config: {
        edges: edges,
      },
    });
  };

  const addNode = (node: FlowNodeTypes) => {
    update({
      id: storeId,
      config: {
        nodes: [...(value?.config.nodes || []), node],
      },
    });
  };

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    addNode,
  };
};
