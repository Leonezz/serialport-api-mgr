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
import { Fragment, useEffect, useState } from "react";
import { useUpdateNode } from "./useUpdateNode";
import { StyledTitle } from "@/components/basics/styled_title";
import { CustomHandler } from "../handles/custom_handle";

export type PreviewFlowNodeType = FlowNode<
  { active: boolean; valid: boolean; value: string },
  "text-preview"
>;

export const PreviewFlowNodeHandles = {
  input: {
    value: "value",
  },
  output: {
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
      value: localValue,
    });
  }, [updateNode, localValue]);

  return (
    <Fragment>
      <CustomHandler
        id={`${id}-${PreviewFlowNodeHandles.output.value}-output`}
        type="source"
      />
      <Card className="w-72 overflow-hidden">
        <CardHeader>
          <StyledTitle>Preview</StyledTitle>
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
    </Fragment>
  );
};
