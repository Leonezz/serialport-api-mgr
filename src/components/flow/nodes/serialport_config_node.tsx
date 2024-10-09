import { NodeProps, useHandleConnections, useNodesData } from "@xyflow/react";
import { FlowNode } from ".";
import { useNamedSerialortConfigStore } from "@/hooks/store/useNamedSerialPortConfig";
import { Card, CardBody, CardHeader, Chip, Divider } from "@nextui-org/react";
import { SerialportPresetConfigSelector } from "@/components/serialport/config/config_selector";
import { useEffect, useState } from "react";
import { useUpdateNode } from "./useUpdateNode";
import { OutputHandle } from "../handles/output_handle";
import { StyledTitle } from "@/components/basics/styled_title";

const NodeType = "serialport-config";

export type SerialportConfigFlowNodeType = FlowNode<
  {
    configId: string;
    value: string;
    valid: boolean;
    active: boolean;
  },
  typeof NodeType
>;

export const SerialportConfigFlowNodeHandles = {
  output: {
    [NodeType]: NodeType,
  },
} as const;

type SerialportConfigFlowNodeProps = NodeProps<SerialportConfigFlowNodeType>;

export const SerialportConfigFlowNode = ({
  id,
  data,
}: SerialportConfigFlowNodeProps) => {
  const [localConfigId, setLocalConfigId] = useState(data.configId);

  const { getByName } = useNamedSerialortConfigStore();

  const selectedConfig = useNamedSerialortConfigStore((state) =>
    state.get({ id: localConfigId })
  );
  const handleId = `${id}-${SerialportConfigFlowNodeHandles.output[NodeType]}-output`;

  const updateNode = useUpdateNode<SerialportConfigFlowNodeType>();

  const connections = useHandleConnections({ type: "source", id: handleId });
  const targetNodes = useNodesData(connections.map((v) => v.target));
  const activeTargets = targetNodes.filter((v) => v.data.active);

  useEffect(() => {
    updateNode(id, {
      configId: localConfigId,
      value: selectedConfig?.name,
      valid: localConfigId?.length > 0,
      active: localConfigId?.length > 0,
    });
  }, [updateNode, localConfigId, selectedConfig]);

  return (
    <Card className="w-72 overflow-hidden">
      <CardHeader className="flex flex-row justify-between">
        <StyledTitle>Serialport Config</StyledTitle>
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
            color={activeTargets.length > 0 ? "primary" : "default"}
            className="font-mono text-sm"
          >
            {`${activeTargets.length} active`}
          </Chip>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <OutputHandle id={handleId}>
          <SerialportPresetConfigSelector
            width="w-full"
            height="h-full"
            readonly={activeTargets.length > 0}
            selectedName={selectedConfig?.name || ""}
            setSelectedName={(name) => {
              const selectedConfigId = getByName({ name: name })?.id;

              setLocalConfigId(selectedConfigId || "");
            }}
          />
        </OutputHandle>
      </CardBody>
    </Card>
  );
};
