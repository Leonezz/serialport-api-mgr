import {
  NodeProps,
  NodeToolbar,
  useHandleConnections,
  useNodesData,
} from "@xyflow/react";
import { FlowNode } from ".";
import { Fragment, useEffect, useState } from "react";
import { useNamedApiStore } from "@/hooks/store/useNamedConversationStore";
import { useUpdateNode } from "./useUpdateNode";
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
import { SerialportApiPresetConfigSelector } from "@/components/serialport/config/config_selector";
import { CustomHandler } from "../handles/custom_handle";
import { InputHandle } from "../handles/input_handle";
import {
  SerialportFlowNodeHandles,
  SerialportFlowNodeType,
} from "./serialport_node";
import { useNamedMessageMetaConfigStore } from "@/hooks/store/useNamedMessageMetaConfig";
import {
  MessageMetaConfigFlowNodeHandles,
  MessageMetaConfigFlowNodeType,
} from "./message_meta_config_node";
import { InputFlowNodeHandles, InputFlowNodeType } from "./input_node";

const NodeType = "serialport-api-config" as const;

type SerialportApiFlowNodeType = FlowNode<
  {
    configId: string;
    value: string;
    valid: boolean;
    active: boolean;
  },
  typeof NodeType
>;

export const SerialportApiFlowNodeHandles = {
  input: {
    [SerialportFlowNodeHandles.output.serialport]:
      SerialportFlowNodeHandles.output.serialport,
    [MessageMetaConfigFlowNodeHandles.output["message-meta-config"]]:
      MessageMetaConfigFlowNodeHandles.output["message-meta-config"],
    [InputFlowNodeHandles.output.value]: [InputFlowNodeHandles.output.value],
  } as const,
} as const;

type SerialportApiFlowNodeProps = NodeProps<SerialportApiFlowNodeType>;
export const SerialportApiFlowNode = ({
  id,
  data,
}: SerialportApiFlowNodeProps) => {
  const [localConfigId, setLocalConfigId] = useState(data.configId);
  const [localPortName, setLocalPortName] = useState("");
  const [localMessageMetaConfigId, setLocalMessageMetaConfigId] = useState("");
  const [localInputText, setLocalInputText] = useState("");

  const readyToGo =
    localConfigId.length > 0 &&
    localPortName.length > 0 &&
    localMessageMetaConfigId.length > 0;

  const messageMetaConfig = useNamedMessageMetaConfigStore((state) =>
    state.get({ id: localMessageMetaConfigId })
  );

  const { getByName } = useNamedApiStore();
  const selectedConfig = useNamedApiStore((state) =>
    state.get({ id: localConfigId })
  );
  const outputHandleId = `${id}-output`;
  const updateNode = useUpdateNode<SerialportApiFlowNodeType>();

  const connections = useHandleConnections({
    type: "source",
    id: outputHandleId,
  });
  const targetNodes = useNodesData(connections.map((v) => v.target));
  const activeTargets = targetNodes.filter((v) => v.data.active);

  useEffect(() => {
    updateNode(id, {
      configId: localConfigId,
      value: localPortName,
      valid: readyToGo,
    });
  }, [updateNode, localConfigId, localPortName, readyToGo]);

  return (
    <Fragment>
      <NodeToolbar isVisible nodeId={id}>
        <ButtonGroup size="sm">
          <Button color="primary" isDisabled={!readyToGo}>
            Start
          </Button>
          <Button color="danger">Reset</Button>
        </ButtonGroup>
      </NodeToolbar>
      <CustomHandler type="source" id={outputHandleId} />
      <Card className="w-72 overflow-hidden">
        <CardHeader className="flex flex-row justify-between">
          <span className="text-medium font-semibold">Api</span>
          <div className="flex flex-col gap-2">
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

        <CardBody className="flex flex-col gap-2">
          <SerialportApiPresetConfigSelector
            width="w-full"
            height="h-full"
            readonly={activeTargets.length > 0}
            selectedName={selectedConfig?.name || ""}
            setSelectedName={(name) => {
              const selectedConfigId = getByName({ name: name })?.id;
              setLocalConfigId(selectedConfigId || "");
            }}
          />

          <InputHandle
            id={`${id}-${SerialportApiFlowNodeHandles.input["serialport"]}-input`}
            connectionLimit={1}
            onValueChange={(
              data: SerialportFlowNodeType["data"] | undefined
            ) => {
              setLocalPortName(data?.portName || "");
            }}
          >
            <Snippet
              variant="flat"
              className="w-full truncate"
              symbol={<span className="font-semibold">Port: </span>}
            >
              {localPortName}
            </Snippet>
          </InputHandle>
          <InputHandle
            id={`${id}-${SerialportApiFlowNodeHandles.input["message-meta-config"]}-input`}
            connectionLimit={1}
            onValueChange={(
              data: MessageMetaConfigFlowNodeType["data"] | undefined
            ) => {
              setLocalMessageMetaConfigId(data?.configId || "");
            }}
          >
            <Snippet
              variant="flat"
              className="w-full truncate"
              symbol={<span className="font-semibold">Message Config: </span>}
            >
              {messageMetaConfig?.name}
            </Snippet>
          </InputHandle>
          <InputHandle
            id={`${id}-${SerialportApiFlowNodeHandles.input["value"]}-input`}
            connectionLimit={1}
            onValueChange={(data: InputFlowNodeType["data"] | undefined) => {
              setLocalInputText(data?.value || "");
            }}
          >
            <Snippet
              variant="flat"
              className="w-full truncate"
              symbol={<span className="font-semibold">Input Message: </span>}
            >
              {localInputText}
            </Snippet>
          </InputHandle>
        </CardBody>
      </Card>
    </Fragment>
  );
};
