import { NodeProps, useHandleConnections, useNodesData } from "@xyflow/react";
import { FlowNode } from ".";
import { useEffect, useState } from "react";
import { useNamedApiStore } from "@/hooks/store/useNamedConversationStore";
import { useUpdateNode } from "./useUpdateNode";
import {
  Button,
  ButtonGroup,
  Chip,
  Progress,
  Snippet,
} from "@nextui-org/react";
import { SerialportApiPresetConfigSelector } from "@/components/serialport/config/config_selector";
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
import { StyledTitle } from "@/components/basics/styled_title";
import { BaseFlowNode, BaseFlowNodeType } from "./base_note";
import { OutputHandle } from "../handles/output_handle";
import { useDialogSession } from "@/hooks/dialog_session/useDialogSession";
import { DEFAULTMessageConfig } from "@/types/message/message_meta";
import { DEFAULTSerialportConversation } from "@/types/conversation/default";

const NodeType = "serialport-api-config" as const;

export type SerialportApiFlowNodeType = FlowNode<
  BaseFlowNodeType<{ configId?: string }>,
  typeof NodeType
>;
const NodeWrapper = BaseFlowNode<{ configId?: string }>;

export const SerialportApiFlowNodeHandles = {
  input: {
    [SerialportFlowNodeHandles.output.serialport]:
      SerialportFlowNodeHandles.output.serialport,
    [MessageMetaConfigFlowNodeHandles.output["message-meta-config"]]:
      MessageMetaConfigFlowNodeHandles.output["message-meta-config"],
    [InputFlowNodeHandles.output.value]: InputFlowNodeHandles.output.value,
  } as const,
  output: {
    value: "value",
  },
} as const;

type SerialportApiFlowNodeProps = NodeProps<SerialportApiFlowNodeType>;
export const SerialportApiFlowNode = ({
  id,
  data,
  selected,
}: SerialportApiFlowNodeProps) => {
  const [localConfigId, setLocalConfigId] = useState(data.configId);
  const [localPortName, setLocalPortName] = useState("");
  const [localMessageMetaConfigId, setLocalMessageMetaConfigId] = useState("");
  const [localInputText, setLocalInputText] = useState("");

  const readyToGo =
    localConfigId !== undefined &&
    localConfigId.length > 0 &&
    localPortName.length > 0 &&
    localMessageMetaConfigId.length > 0;

  const messageMetaConfig = useNamedMessageMetaConfigStore((state) =>
    state.get({ id: localMessageMetaConfigId })
  );

  const { getByName } = useNamedApiStore();
  const selectedConfig = useNamedApiStore((state) =>
    localConfigId !== undefined ? state.get({ id: localConfigId }) : undefined
  );
  const outputHandleId = `${id}-${SerialportApiFlowNodeHandles.output.value}-output`;
  const updateNode = useUpdateNode<SerialportApiFlowNodeType>();

  const connections = useHandleConnections({
    type: "source",
    id: outputHandleId,
  });
  const targetNodes = useNodesData(connections.map((v) => v.target));
  const activeTargets = targetNodes.filter((v) => v.data.active);

  const [sessionId, setSessionId] = useState<string>();
  const {
    sessionId: createdSessionId,
    setPortName,
    messages,
    totalTasks,
    finishedTasks,
    failedTasks,
    sessionFinished,
    runNext,
    sending,
    sendResult,
    reset,
  } = useDialogSession({
    sessionId: sessionId,
    messageMetaConfig: messageMetaConfig?.config || DEFAULTMessageConfig,
    apiConfig: selectedConfig?.config || DEFAULTSerialportConversation,
    portName: localPortName,
    message: localInputText,
  });

  useEffect(() => {
    setSessionId(createdSessionId);
  }, [createdSessionId]);

  useEffect(() => {
    setPortName(localPortName);
  }, [localPortName]);

  const expectedMessage = messages?.messages
    .sort((a, b) => (b.order || 1) - (a.order || 0))
    .find(
      (v) =>
        v.sender === "Remote" ||
        v.status === "waiting" ||
        v.status === "received" ||
        v.status === "failed"
    );

  useEffect(() => {
    updateNode(id, {
      configId: localConfigId,
      value:
        sessionFinished && expectedMessage
          ? expectedMessage.expectedMessage
          : undefined,
      valid: readyToGo,
      active:
        readyToGo && failedTasks === 0 && finishedTasks > 0 && !sessionFinished,
    });
  }, [
    updateNode,
    localConfigId,
    localPortName,
    readyToGo,
    readyToGo,
    failedTasks,
    finishedTasks,
    sessionFinished,
  ]);

  return (
    <NodeWrapper
      id={id}
      selected={!!selected}
      value={data.value}
      valid={data.valid}
      active={data.active}
      configId={data.configId}
      minWidth={310}
      minHeight={310}
      title={
        <div className="w-full flex flex-col gap-1">
          <div className="flex w-full flex-row justify-between">
            <StyledTitle>Api</StyledTitle>
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
          </div>
          <div className="flex flex-row">
            <Progress
              size="sm"
              color="success"
              className="w-full"
              value={finishedTasks}
              maxValue={totalTasks - failedTasks}
              label="finished"
            />
            {failedTasks > 0 && (
              <Progress
                size="sm"
                color="danger"
                className="w-full"
                value={failedTasks}
                maxValue={failedTasks}
                label="failed"
              />
            )}
          </div>
        </div>
      }
      body={
        <div className="flex flex-col gap-2">
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
          <OutputHandle id={outputHandleId}>
            <Snippet
              variant="flat"
              className="w-full truncate"
              color={
                expectedMessage && expectedMessage.error !== undefined
                  ? "danger"
                  : "success"
              }
            >
              {expectedMessage && expectedMessage.error !== undefined
                ? expectedMessage.error
                : expectedMessage?.expectedMessage}
            </Snippet>
          </OutputHandle>
        </div>
      }
      extraToolBar={
        <ButtonGroup size="sm">
          <Button
            color="primary"
            isDisabled={!readyToGo}
            onClick={runNext}
            isLoading={sending}
          >
            Start
          </Button>
          <Button color="danger" onClick={reset}>
            Reset
          </Button>
        </ButtonGroup>
      }
    />
  );
};
