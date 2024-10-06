import {
  Handle,
  Node,
  Position,
  useHandleConnections,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { useEffect } from "react";
import { ConnectableNodes } from "../nodes/node_types";

export type CustomHandlerProps<DataType> = {
  id: string;
  type: "source" | "target";
  connectionLimit?: number;
  onChange?: (data: DataType | undefined) => void;
};
export const CustomHandler = <NodeType extends Node>({
  type,
  id,
  connectionLimit,
  onChange,
}: CustomHandlerProps<NodeType["data"]>) => {
  const isInputType = type === "target";
  const connections = useHandleConnections({ type: type, id: id });

  const nodeData = useNodesData<NodeType>(connections?.[0]?.source);
  const { getNode } = useReactFlow<Node>();

  useEffect(() => {
    if (onChange) {
      onChange(nodeData?.data);
    }
  }, [nodeData]);

  const sourceValid = !!nodeData?.data?.valid;
  const sourceActive = !!nodeData?.data?.active;

  const targetNodeData = useNodesData<NodeType>(connections?.[0]?.target);
  const targetValid = !!targetNodeData?.data?.valid;
  const targetActive = !!targetNodeData?.data?.active;

  const valid = isInputType ? targetValid : sourceValid;
  const active = isInputType ? targetActive : sourceActive;

  return (
    <Handle
      type={type}
      id={id}
      position={isInputType ? Position.Left : Position.Right}
      className={`h-[77%] rounded-sm w-2  ${
        connections.length === 0
          ? "!bg-secondary"
          : active
          ? "!bg-success"
          : valid
          ? "!bg-warning"
          : "!bg-danger"
      } ${isInputType ? "!-left-2 !ml-0 " : "!-right-2"} `}
      isConnectable={
        connectionLimit === undefined || connections.length < connectionLimit
      }
      isValidConnection={(edge) => {
        const inutNodeId = edge.target;
        const inputNodeType = getNode(inutNodeId)?.type;
        const inputHandleId = edge.targetHandle;
        const outputNodeId = edge.source;
        const outputNodeType = getNode(outputNodeId)?.type;
        const outputHandleId = edge.sourceHandle;
        if (
          !inputNodeType ||
          !outputNodeType ||
          !inputHandleId ||
          !outputHandleId ||
          !Object.keys(ConnectableNodes).includes(outputNodeType)
        ) {
          return false;
        }

        const connections =
          ConnectableNodes[outputNodeType as keyof typeof ConnectableNodes];
        return connections.some(
          (value) =>
            value.sourceNode === outputNodeType &&
            value.targetNode === inputNodeType &&
            outputHandleId === `${outputNodeId}-${value.souceHandle}-output` &&
            inputHandleId === `${inutNodeId}-${value.targetHandle}-input`
        );
      }}
    />
  );
};
