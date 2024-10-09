import { FlowEdgeTypes } from "@/components/flow/edges/edge_types";
import { FlowNodeTypes } from "@/components/flow/nodes/node_types";
import {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  NodeToolbar,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { useCallback } from "react";

export const SerialportApplicationPage = () => {
  const initialNodes = [
    {
      data: {
        portName: "",
      },
      id: "node-1",
      position: { x: 100, y: 100 },
      type: "serialport",
    },
    {
      data: {
        configId: "",
      },
      id: "node-2",
      position: { x: 200, y: 200 },
      type: "serialport-config",
    },
    {
      data: {
        value: "",
      },
      id: "node-3",
      position: { x: 250, y: 250 },
      type: "text-input",
    },
    {
      data: {},
      id: "node-4",
      position: { x: 300, y: 300 },
      type: "text-preview",
    },
    {
      data: { configId: "" },
      id: "node-5",
      position: { x: 350, y: 350 },
      type: "message-meta-config",
    },
    {
      data: { configId: "" },
      id: "node-6",
      position: { x: 400, y: 400 },
      type: "serialport-api-config",
    },
    {
      data: {},
      id: "script-1",
      position: { x: 450, y: 450 },
      type: "script",
    },
    {
      data: {},
      id: "script-2",
      position: { x: 500, y: 500 },
      type: "script",
    },
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const onConnect = useCallback(
    (params: Connection) => {
      const { source, target, sourceHandle, targetHandle } = params;
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
        ...params,
        type: `${sourceType}@${sourceHandleType}TO${targetType}@${targetHandleType}`,
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, nodes]
  );

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodeTypes={FlowNodeTypes}
        nodes={nodes}
        onNodesChange={onNodesChange}
        edgeTypes={FlowEdgeTypes}
        edges={edges}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        minZoom={0.1}
      >
        <MiniMap />
        <Background />
        <NodeToolbar />
        <Controls />
      </ReactFlow>
    </ReactFlowProvider>
  );
};
