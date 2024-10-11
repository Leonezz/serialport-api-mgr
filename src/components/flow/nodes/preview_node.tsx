import { NodeProps } from "@xyflow/react";
import { FlowNode } from ".";
import {
  Snippet,
} from "@nextui-org/react";
import { InputHandle } from "../handles/input_handle";
import { useEffect, useState } from "react";
import { useUpdateNode } from "./useUpdateNode";
import { StyledTitle } from "@/components/basics/styled_title";
import { BaseFlowNode, BaseFlowNodeType } from "./base_note";

const NodeType = "text-preview";
export type PreviewFlowNodeType = FlowNode<
  BaseFlowNodeType<{}>,
  typeof NodeType
>;

export const PreviewFlowNodeHandles = {
  input: {
    value: "value",
  },
  output: {
    value: "value",
  },
} as const;

const NodeWrapper = BaseFlowNode<{}>;

type PreviewFlowNodeProps = NodeProps<PreviewFlowNodeType>;
export const PreviewFlowNode = ({ id, selected }: PreviewFlowNodeProps) => {
  const [localValue, setLocalValue] = useState("");
  const updateNode = useUpdateNode<PreviewFlowNodeType>();
  useEffect(() => {
    updateNode(id, {
      active: false,
      valid: true,
      value: localValue,
    });
  }, [updateNode, localValue]);

  return (
    <NodeWrapper
      id={id}
      selected={!!selected}
      value={localValue}
      active={false}
      valid={true}
      minWidth={300}
      minHeight={120}
      title={<StyledTitle>Preview</StyledTitle>}
      body={
        <InputHandle
          id={`${id}-${PreviewFlowNodeHandles.input.value}-input`}
          connectionLimit={1}
          onValueChange={(data: { value: string } | undefined) =>
            setLocalValue(data ? data.value : "")
          }
        >
          <Snippet variant="flat" className="w-full truncate">
            {localValue}
          </Snippet>
        </InputHandle>
      }
      outputHandle={{
        handleId: `${id}-${PreviewFlowNodeHandles.output.value}-output`,
      }}
    />
  );
};
