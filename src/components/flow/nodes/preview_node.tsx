import { NodeProps } from "@xyflow/react";
import { FlowNode } from ".";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Snippet,
} from "@nextui-org/react";
import { InputHandle } from "../handles/input_handle";
import { useEffect, useState } from "react";
import { useUpdateNode } from "./useUpdateNode";

export type PreviewFlowNodeType = FlowNode<
  { active: boolean; valid: boolean; value: "" },
  "text-preview"
>;

export const PreviewFlowNodeHandles = {
  input: {
    value: "value",
  },
} as const;

type PreviewFlowNodeProps = NodeProps<PreviewFlowNodeType>;
export const PreviewFlowNode = ({ id }: PreviewFlowNodeProps) => {
  const [localValue, setLocalValue] = useState("");
  const updateNode = useUpdateNode<PreviewFlowNodeType>();
  useEffect(() => {
    updateNode(id, {
      active: false,
      valid: true,
    });
  }, [updateNode, localValue]);

  return (
    <Card className="w-72 overflow-hidden">
      <CardHeader>
        <span className="text-medium font-semibold leading-none">Preview</span>
      </CardHeader>
      <Divider />
      <CardBody>
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
      </CardBody>
    </Card>
  );
};
