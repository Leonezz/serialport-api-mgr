import { NodeProps, useHandleConnections, useNodesData } from "@xyflow/react";
import { FlowNode } from ".";
import { useState } from "react";
import {
  Chip,
  Input,
} from "@nextui-org/react";
import { useUpdateNode } from "./useUpdateNode";
import { OutputHandle } from "../handles/output_handle";
import { StyledTitle } from "@/components/basics/styled_title";
import { BaseFlowNode, BaseFlowNodeType } from "./base_note";

const NodeType = "text-input";
export type InputFlowNodeType = FlowNode<BaseFlowNodeType<{}>, typeof NodeType>;
type InputFlowNodeProps = NodeProps<InputFlowNodeType>;
const NodeWrapper = BaseFlowNode<{}>;

export const InputFlowNodeHandles = {
  output: {
    value: "value",
  },
} as const;

export const InputFlowNode = ({ id, data, selected }: InputFlowNodeProps) => {
  const [localValue, setLocalValue] = useState(data.value);
  const updateNode = useUpdateNode<InputFlowNodeType>();

  const handleId = `${id}-${InputFlowNodeHandles.output.value}-output`;

  const connections = useHandleConnections({ type: "source", id: handleId });
  const targetNodes = useNodesData(connections.map((v) => v.target));

  return (
    <NodeWrapper
      value={localValue}
      valid={localValue.length > 0}
      active={localValue.length > 0}
      id={id}
      selected={!!selected}
      minHeight={120}
      minWidth={300}
      title={
        <div className="flex flex-row w-full justify-between">
          <StyledTitle>Input</StyledTitle>
          <Chip
            size="sm"
            variant="dot"
            color={localValue.length > 0 ? "primary" : "default"}
            className="font-mono text-sm"
          >
            {`used by ${targetNodes.length}`}
          </Chip>
        </div>
      }
      body={
        <OutputHandle id={handleId}>
          <Input
            type="text"
            value={localValue}
            onValueChange={(value) => {
              setLocalValue(value);
              updateNode(id, {
                value: value,
                valid: value.length > 0,
                active: value.length > 0,
              });
            }}
          />
        </OutputHandle>
      }
    />
  );
};
