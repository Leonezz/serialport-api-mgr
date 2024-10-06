import {
  NodeProps,
  useHandleConnections,
  useNodesData,
} from "@xyflow/react";
import { FlowNode } from ".";
import { Fragment, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
} from "@nextui-org/react";
import { useUpdateNode } from "./useUpdateNode";
import { OutputHandle } from "../handles/output_handle";

export type InputFlowNodeType = FlowNode<
  { value: string; valid: boolean; active: boolean },
  "text-input"
>;
type InputFlowNodeProps = NodeProps<InputFlowNodeType>;

export const InputFlowNodeHandles = {
  output: {
    value: "value",
  },
} as const;

export const InputFlowNode = ({ id, data }: InputFlowNodeProps) => {
  const [localValue, setLocalValue] = useState(data.value);
  const updateNode = useUpdateNode<InputFlowNodeType>();

  const handleId = `${id}-${InputFlowNodeHandles.output.value}-output`;

  const connections = useHandleConnections({ type: "source", id: handleId });
  const targetNodes = useNodesData(connections.map((v) => v.target));

  return (
    <Fragment>
      <Card className="w-72 overflow-hidden">
        <CardHeader className="flex flex-row justify-between">
          <span className="text-medium font-semibold leading-none">Input</span>
          <Chip
            size="sm"
            variant="dot"
            color={localValue.length > 0 ? "primary" : "default"}
            className="font-mono text-sm"
          >
            {`used by ${targetNodes.length}`}
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody>
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
        </CardBody>
      </Card>
    </Fragment>
  );
};
