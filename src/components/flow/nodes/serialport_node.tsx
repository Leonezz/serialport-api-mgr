import { FlowNode } from ".";
import { NodeProps } from "@xyflow/react";
import { useSerialportStatus } from "@/hooks/store/usePortStatus";
import { Button, ButtonGroup, Chip, Snippet } from "@nextui-org/react";
import PortSelector from "@/components/serialport/port_selector";
import { useEffect, useState } from "react";
import useAvaliablePorts from "@/hooks/commands/useAvaliablePorts";
import { useNamedSerialortConfigStore } from "@/hooks/store/useNamedSerialPortConfig";
import {
  SerialportConfigFlowNodeHandles,
  SerialportConfigFlowNodeType,
} from "./serialport_config_node";
import useOpenPort from "@/hooks/commands/useOpenPort";
import useClosePort from "@/hooks/commands/useClosePort";
import { useUpdateNode } from "./useUpdateNode";
import { InputHandle } from "../handles/input_handle";
import { StyledTitle } from "@/components/basics/styled_title";
import { BaseFlowNode, BaseFlowNodeType } from "./base_note";
import { OutputHandle } from "../handles/output_handle";

const NodeType = "serialport";

export type SerialportFlowNodeType = FlowNode<
  BaseFlowNodeType<{
    portName?: string;
  }>,
  typeof NodeType
>;
export const SerialportFlowNodeHandles = {
  input: {
    [SerialportConfigFlowNodeHandles.output["serialport-config"]]:
      SerialportConfigFlowNodeHandles.output["serialport-config"],
  } as const,
  output: {
    [NodeType]: NodeType,
  } as const,
} as const;

const NodeWrapper = BaseFlowNode<{ portName?: string }>;

type SerialportFlowNodeProps = NodeProps<SerialportFlowNodeType>;

export const SerialportFlowNode = ({
  data,
  id,
  selected,
}: SerialportFlowNodeProps) => {
  const { portName } = data;
  const [localPortName, setLocalPortName] = useState(portName);
  const { getPortOpened } = useSerialportStatus();

  const portOpened =
    localPortName !== undefined && getPortOpened({ port_name: localPortName });

  const { refresh, refreshing } = useAvaliablePorts();
  const [serialportConfigId, setSerialportConfigId] = useState("");
  const serialportConfig = useNamedSerialortConfigStore((state) =>
    state.get({ id: serialportConfigId })
  );
  const portExists = useSerialportStatus(
    (state) =>
      localPortName !== undefined &&
      state.portExists({ port_name: localPortName })
  );
  const configExists = serialportConfig !== undefined;

  const { openPort, portOpening } = useOpenPort();
  const { closePort, portClosing } = useClosePort();

  const updateNode = useUpdateNode<SerialportFlowNodeType>();
  useEffect(
    () =>
      updateNode(id, {
        portName: portOpened ? localPortName : "",
        active: portOpened,
        valid: localPortName !== undefined && localPortName.length > 0,
        value: localPortName,
      }),
    [updateNode, localPortName, portOpened]
  );

  return (
    <NodeWrapper
      id={id}
      selected={!!selected}
      portName={portOpened ? localPortName : ""}
      value={localPortName}
      valid={localPortName !== undefined && localPortName.length > 0}
      active={portOpened}
      minWidth={300}
      minHeight={175}
      title={
        <div className="flex flex-row justify-between w-full">
          <StyledTitle>Serialport</StyledTitle>
          <Chip
            variant="dot"
            color={portOpened ? "primary" : "default"}
            className="font-mono text-sm"
            size="sm"
          >
            {portOpened ? "opened" : "closed"}
          </Chip>
        </div>
      }
      body={
        <div className="flex flex-col gap-2">
          <OutputHandle
            id={`${id}-${SerialportFlowNodeHandles.output[NodeType]}-output`}
            connectionLimit={1}
          >
            <PortSelector
              selectedName={localPortName || ""}
              setSelectedPortName={(port) => {
                setLocalPortName(port);
              }}
              width="w-full"
              height="h-min"
            />
          </OutputHandle>
          <InputHandle
            id={`${id}-${SerialportFlowNodeHandles.input["serialport-config"]}-input`}
            connectionLimit={1}
            onValueChange={(data?: SerialportConfigFlowNodeType["data"]) => {
              setSerialportConfigId(
                data?.configId !== undefined ? data.configId : ""
              );
            }}
          >
            <Snippet
              variant="flat"
              className="w-full truncate"
              symbol={<span className="font-semibold">Config: </span>}
            >
              {serialportConfig?.name}
            </Snippet>
          </InputHandle>
        </div>
      }
      extraToolBar={
        <ButtonGroup size="sm">
          <Button
            color="primary"
            isDisabled={!portExists || !configExists || portOpened}
            onClick={() => {
              if (
                serialportConfig !== undefined &&
                localPortName !== undefined
              ) {
                openPort({
                  ...serialportConfig?.config,
                  port_name: localPortName,
                });
              }
            }}
            isLoading={portOpening}
          >
            Open
          </Button>
          <Button
            color="danger"
            isDisabled={!portOpened || !portExists}
            onClick={() =>
              localPortName !== undefined &&
              closePort({ portName: localPortName })
            }
            isLoading={portClosing}
          >
            Close
          </Button>
          <Button color="primary" onClick={refresh} isLoading={refreshing}>
            Refresh
          </Button>
        </ButtonGroup>
      }
    />
  );
};
