import { FlowEdgeTypes } from "@/components/flow/edges/edge_types";
import { FlowNodeTypes } from "@/components/flow/nodes/node_types";
import {
  useNamedFlowConfigStore,
  useStoredFlowActions,
} from "@/hooks/store/useFlowConfigStore";
import {
  Background,
  Controls,
  MiniMap,
  NodeToolbar,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { useCallback } from "react";
import { v7 as uuid } from "uuid";
import { NodeSelectSide } from "../aside/node_select";

type FlowView = {
  configId: string;
};
export const FlowView = ({ configId }: FlowView) => {
  const { get } = useNamedFlowConfigStore();
  const config = get({ id: configId })?.config;
  const nodes = config?.nodes;
  const edges = config?.edges;
  const { onEdgesChange, onConnect, onNodesChange, addNode } =
    useStoredFlowActions({
      storeId: configId,
    });

  const { screenToFlowPosition } = useReactFlow();
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const data = event.dataTransfer.getData("text/plain");
      // check if the dropped element is valid
      if (data === undefined) {
        return;
      }

      // project was renamed to screenToFlowPosition
      // and you don't need to subtract the reactFlowBounds.left/top anymore
      // details: https://reactflow.dev/whats-new/2023-11-10
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: uuid(),
        type: data,
        position: position,
        data: {},
      } as FlowNodeTypes;

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className="flex flex-row gap-1 w-full h-full">
      <ReactFlow
        nodeTypes={FlowNodeTypes}
        nodes={nodes}
        onNodesChange={onNodesChange}
        edgeTypes={FlowEdgeTypes}
        edges={edges}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        minZoom={0.3}
      >
        <MiniMap />
        <Background />
        <NodeToolbar />
        <Controls />
      </ReactFlow>

      <NodeSelectSide />
    </div>
  );
};
