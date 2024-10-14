import { NodeProps, useHandleConnections, useNodesData } from "@xyflow/react";
import { FlowNode } from ".";
import { useState } from "react";
import { useNamedMessageMetaConfigStore } from "@/hooks/store/useNamedMessageMetaConfig";
import { useUpdateNode } from "./useUpdateNode";
import { Chip } from "@nextui-org/react";
import { OutputHandle } from "../handles/output_handle";
import { MessageMetaPresetConfigSelector } from "@/components/serialport/config/config_selector";
import { StyledTitle } from "@/components/basics/styled_title";
import { BaseFlowNode, BaseFlowNodeType } from "./base_note";

const NodeType = "message-meta-config" as const;

export type MessageMetaConfigFlowNodeType = FlowNode<
  BaseFlowNodeType<{
    configId?: string;
  }>,
  typeof NodeType
>;
type MessageMetaConfigFlowNodeProps = NodeProps<MessageMetaConfigFlowNodeType>;
const NodeWrapper = BaseFlowNode<{ configId?: string }>;

export const MessageMetaConfigFlowNodeHandles = {
  output: {
    [NodeType]: NodeType,
  },
} as const;

export const MessageMetaConfigFlowNode = ({
  id,
  data,
  selected,
}: MessageMetaConfigFlowNodeProps) => {
  const [localConfigId, setLocalConfigId] = useState(data.configId);

  const selectedConfig = useNamedMessageMetaConfigStore((state) =>
    localConfigId !== undefined ? state.get({ id: localConfigId }) : undefined
  );
  const { getByName } = useNamedMessageMetaConfigStore();

  const handleId = `${id}-${MessageMetaConfigFlowNodeHandles.output[NodeType]}-output`;

  const updateNode = useUpdateNode<MessageMetaConfigFlowNodeType>();

  const connections = useHandleConnections({ type: "source", id: handleId });
  const targetNodes = useNodesData(connections.map((v) => v.target));
  const activeNodes = targetNodes.filter((node) => node.data.active);

  return (
    <NodeWrapper
      id={id}
      configId={localConfigId}
      value={selectedConfig?.name || ""}
      valid={selectedConfig !== undefined}
      active={selectedConfig !== undefined}
      minWidth={300}
      minHeight={150}
      selected={!!selected}
      title={
        <div className="flex flex-row justify-between w-full">
          <StyledTitle>Message Config</StyledTitle>
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
        </div>
      }
      body={
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
      }
    />
  );
};
