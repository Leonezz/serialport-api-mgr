import { NodeProps, useHandleConnections, useNodesData } from "@xyflow/react";
import { FlowNode } from ".";
import { useState } from "react";
import { useNamedMessageMetaConfigStore } from "@/hooks/store/useNamedMessageMetaConfig";
import { useUpdateNode } from "./useUpdateNode";
import { Card, CardBody, CardHeader, Chip, Divider } from "@nextui-org/react";
import { OutputHandle } from "../handles/output_handle";
import { MessageMetaPresetConfigSelector } from "@/components/serialport/config/config_selector";

const NodeType = "message-meta-config" as const;

export type MessageMetaConfigFlowNodeType = FlowNode<
  {
    configId: string;
    value: string;
    valid: boolean;
    active: boolean;
  },
  typeof NodeType
>;
type MessageMetaConfigFlowNodeProps = NodeProps<MessageMetaConfigFlowNodeType>;

export const MessageMetaConfigFlowNodeHandles = {
  output: {
    [NodeType]: NodeType,
  },
} as const;

export const MessageMetaConfigFlowNode = ({
  id,
  data,
}: MessageMetaConfigFlowNodeProps) => {
  const [localConfigId, setLocalConfigId] = useState(data.configId);

  const selectedConfig = useNamedMessageMetaConfigStore((state) =>
    state.get({ id: localConfigId })
  );
  const { getByName } = useNamedMessageMetaConfigStore();

  const handleId = `${id}-${MessageMetaConfigFlowNodeHandles.output[NodeType]}-output`;

  const updateNode = useUpdateNode<MessageMetaConfigFlowNodeType>();

  const connections = useHandleConnections({ type: "source", id: handleId });
  const targetNodes = useNodesData(connections.map((v) => v.target));
  const activeNodes = targetNodes.filter((node) => node.data.active);

  return (
    <Card className="w-72 overflow-hidden">
      <CardHeader className="flex flex-row justify-between">
        <span className="text-medium font-semibold">Message Config</span>
        <div className="flex flex-col gap-1">
          <Chip
            size="sm"
            variant="dot"
            color="default"
            className="font-mono text-sm"
          >
            {`used by ${targetNodes.length}`}
          </Chip>
          <Chip
            size="sm"
            variant="dot"
            color={activeNodes.length > 0 ? "primary" : "default"}
            className="font-mono text-sm"
          >
            {`${activeNodes.length} active`}
          </Chip>
        </div>
      </CardHeader>

      <Divider />

      <CardBody>
        <OutputHandle id={handleId}>
          <MessageMetaPresetConfigSelector
            width="w-full"
            height="h-full"
            readonly={activeNodes.length > 0}
            selectedName={selectedConfig?.name || ""}
            setSelectedName={(name) => {
              const selectedConfigId = getByName({ name: name })?.id;
              setLocalConfigId(selectedConfigId || "");
              updateNode(id, {
                configId: selectedConfigId,
                value: name,
                valid: selectedConfigId !== undefined,
                active: selectedConfigId !== undefined,
              });
            }}
          />
        </OutputHandle>
      </CardBody>
    </Card>
  );
};
