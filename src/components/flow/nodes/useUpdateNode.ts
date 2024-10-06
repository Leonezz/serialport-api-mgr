import { Node, useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

export const useUpdateNode = <NodeType extends Node>() => {
  const { setNodes } = useReactFlow<NodeType>();
  return useCallback(
    (id: string, update: Partial<NodeType["data"]>) =>
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id !== id ? node : { ...node, data: { ...node.data, ...update } }
        )
      ),
    [setNodes]
  );
};
