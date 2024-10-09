import {
  Node,
  NodeProps,
  useHandleConnections,
  useNodesData,
} from "@xyflow/react";
import { BasicFlowNodeStatus, FlowNode } from ".";
import { Fragment, useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Snippet,
} from "@nextui-org/react";
import { CustomHandler } from "../handles/custom_handle";
import { InputHandle } from "../handles/input_handle";
import { ScriptCodeMirror } from "@/components/conversation/script_code_mirror";
import {
  BuildScriptRunner,
  ScriptTester,
} from "@/components/conversation/script_tester";
import { OK, Result } from "@/types/global";
import { getScriptContent, trimScript } from "@/util/js_scripts/js_script_util";
import { StyledTitle } from "@/components/basics/styled_title";
import { useUpdateNode } from "./useUpdateNode";
import { DefaultResizer } from "../resizer/default_resizer";

const NodeType = "script";

export type ScriptFlowNodeType = FlowNode<
  {
    // script: string;
    value: string;
    valid: boolean;
    active: boolean;
  },
  typeof NodeType
>;

export const ScriptFlowNodeHandles = {
  output: {
    [NodeType]: NodeType,
  },
  input: {
    [NodeType]: NodeType,
  },
};

type ScriptFlowNodeProps = NodeProps<ScriptFlowNodeType>;

const INITIAL_SCRIPT = `\
const process = (input = "") => {
  // ...write your script body here
  return input;
}
`;

export const ScriptFlowNode = ({ id, data, selected }: ScriptFlowNodeProps) => {
  const [localScript, setLocalScript] = useState(INITIAL_SCRIPT);
  const [localInput, setLocalInput] = useState("");
  const [localOutput, setLocaloutput] = useState<Result<string>>(OK(""));

  const inputHandleId = `${id}-${ScriptFlowNodeHandles.input[NodeType]}-input`;
  const outputHandleId = `${id}-${ScriptFlowNodeHandles.output[NodeType]}-output`;

  const outConnections = useHandleConnections({
    type: "source",
    id: outputHandleId,
  });
  const targetNodes = useNodesData<Node<BasicFlowNodeStatus>>(
    outConnections.map((v) => v.target)
  );
  const activeTargeets = targetNodes.filter((v) => v.data.active);
  const updateNode = useUpdateNode<ScriptFlowNodeType>();
  useEffect(() => {
    const res = BuildScriptRunner<string>({
      argument: "input",
      script: getScriptContent(localScript),
    })(localInput);
    updateNode(id, {
      valid: res.ok,
      active: false,
      value: res.ok ? res.value : res.error.message,
    });
    setLocaloutput(res);
  }, [localScript, localInput, setLocaloutput]);

  return (
    <Fragment>
      <DefaultResizer minWidth={400} minHeight={320} visible={!!selected} />
      <CustomHandler type="source" id={outputHandleId} />
      <Card className="scrollbar-hide h-full">
        <CardHeader className="flex flex-row justify-between">
          <StyledTitle>Script</StyledTitle>
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
              color={activeTargeets.length > 0 ? "primary" : "default"}
            >{`${activeTargeets.length} active`}</Chip>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="flex flex-col gap-2 w-full h-full scrollbar-hide">
          <InputHandle
            id={inputHandleId}
            onValueChange={(data: { value: string } | undefined) => {
              setLocalInput(data?.value || "");
            }}
            connectionLimit={1}
          >
            <ScriptCodeMirror
              value={localScript}
              onValudChange={(value) => {
                setLocalScript(value);
              }}
              readonly={false}
            />
          </InputHandle>
          <Snippet color={localOutput.ok ? "success" : "danger"}>
            {localOutput.ok ? localOutput.value : localOutput.error.message}
          </Snippet>
          <ScriptTester script={localScript} input={""} argument="input" />
        </CardBody>
      </Card>
    </Fragment>
  );
};
