import { FlowNode } from ".";
import { NodeProps, NodeToolbar } from "@xyflow/react";
import { useSerialportStatus } from "@/hooks/store/usePortStatus";
import { Fragment } from "react/jsx-runtime";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Snippet,
} from "@nextui-org/react";
import PortSelector from "@/components/serialport/port_selector";
import { useEffect, useState } from "react";
import useAvaliablePorts from "@/hooks/commands/useAvaliablePorts";
import { CustomHandler } from "../handles/custom_handle";
import { useNamedSerialortConfigStore } from "@/hooks/store/useNamedSerialPortConfig";
import {
  SerialportConfigFlowNodeHandles,
  SerialportConfigFlowNodeType,
} from "./serialport_config_node";
import useOpenPort from "@/hooks/commands/useOpenPort";
import useClosePort from "@/hooks/commands/useClosePort";
import { useUpdateNode } from "./useUpdateNode";
import { InputHandle } from "../handles/input_handle";

const NodeType = "serialport";

export type SerialportFlowNodeType = FlowNode<
  {
    portName: string;
    value: string;
    active: boolean;
    valid: boolean;
  },
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

type SerialportFlowNodeProps = NodeProps<SerialportFlowNodeType>;

export const SerialportFlowNode = ({ data, id }: SerialportFlowNodeProps) => {
  const { portName } = data;
  const [localPortName, setLocalPortName] = useState(portName);
  const { getPortOpened } = useSerialportStatus();

  const portOpened = getPortOpened({ port_name: localPortName });

  const { refresh, refreshing } = useAvaliablePorts();
  const [serialportConfigId, setSerialportConfigId] = useState("");
  const serialportConfig = useNamedSerialortConfigStore((state) =>
    state.get({ id: serialportConfigId })
  );
  const portExists = useSerialportStatus((state) =>
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
        valid: localPortName.length > 0,
        value: localPortName,
      }),
    [updateNode, localPortName, portOpened]
  );

  return (
    <Fragment>
      <NodeToolbar isVisible nodeId={id}>
        <ButtonGroup size="sm">
          <Button
            color="primary"
            isDisabled={!portExists || !configExists || portOpened}
            onClick={() => {
              if (serialportConfig !== undefined) {
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
            onClick={() => closePort({ portName: localPortName })}
            isLoading={portClosing}
          >
            Close
          </Button>
          <Button color="primary" onClick={refresh} isLoading={refreshing}>
            Refresh
          </Button>
        </ButtonGroup>
      </NodeToolbar>

      <CustomHandler
        type="source"
        id={`${id}-${SerialportFlowNodeHandles.output[NodeType]}-output`}
      />

      <Card className="w-72 overflow-hidden">
        <CardHeader className="flex flex-row justify-between">
          <span className="text-medium font-semibold leading-none">
            Serialport
          </span>

          <Chip
            variant="dot"
            color={portOpened ? "primary" : "default"}
            className="font-mono text-sm"
            size="sm"
          >
            {portOpened ? "opened" : "closed"}
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody className="flex flex-col gap-2">
          <PortSelector
            selectedName={localPortName}
            setSelectedPortName={(port) => {
              setLocalPortName(port);
            }}
            width="w-full"
            height="h-min"
          />
          <InputHandle
            id={`${id}-${SerialportFlowNodeHandles.input["serialport-config"]}-input`}
            connectionLimit={1}
            onValueChange={(data?: SerialportConfigFlowNodeType["data"]) => {
              setSerialportConfigId(data ? data.configId : "");
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
        </CardBody>
      </Card>
    </Fragment>
  );
};
