import { NodeToolbar, useEdges, useNodes, useReactFlow } from "@xyflow/react";
import { BasicFlowNodeStatus } from ".";
import { Fragment, ReactNode } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from "@nextui-org/react";
import { CustomHandler } from "../handles/custom_handle";
import { DefaultResizer } from "../resizer/default_resizer";

export type BaseFlowNodeType<Data> = BasicFlowNodeStatus & Data;

type BaseFlowNodeProps<Data> = BaseFlowNodeType<Data> & {
  id: string;
  selected: boolean;
};

type InputHandleType = {
  handleId: `${string}-${string}-input`;
  onValueChange: <T>(value: T) => void;
};

type OutputHandleType = {
  handleId: `${string}-${string}-output`;
};

export const BaseFlowNode = <Data extends Record<string, unknown>>({
  id,
  selected,
  inputHandle,
  outputHandle,
  title,
  body,
  extraToolBar,
  minWidth,
  minHeight,
}: BaseFlowNodeProps<Data> & {
  inputHandle?: InputHandleType;
  outputHandle?: OutputHandleType;
  title: ReactNode;
  body: ReactNode;
  extraToolBar?: ReactNode;
  minWidth: number;
  minHeight: number;
}) => {
  const { deleteElements } = useReactFlow();
  const edges = useEdges()
    .filter((edge) => edge.target === id || edge.source === id)
    .map((edge) => edge.id);
  const deleteNode = () => {
    deleteElements({ nodes: [{ id: id }] });
  };
  const curEdges = () => {
    deleteElements({ edges: edges.map((edgeId) => ({ id: edgeId })) });
  };
  return (
    <Fragment>
      <NodeToolbar
        isVisible={selected}
        nodeId={id}
        className="flex flex-col gap-2"
      >
        {extraToolBar}
        <ButtonGroup size="sm">
          <Button color="danger" onClick={deleteNode}>
            Delete Node
          </Button>
          <Button color="danger" onClick={curEdges}>
            Cut Edges
          </Button>
        </ButtonGroup>
      </NodeToolbar>

      <DefaultResizer
        minWidth={minWidth}
        minHeight={minHeight}
        visible={!!selected}
      />

      {inputHandle && (
        <CustomHandler
          id={inputHandle.handleId}
          type="target"
          onChange={inputHandle.onValueChange}
          connectionLimit={1}
        />
      )}

      {outputHandle && (
        <CustomHandler id={outputHandle.handleId} type="source" />
      )}

      <Card className="overflow-hidden w-full h-full min-w-72">
        <CardHeader>{title}</CardHeader>

        <Divider />

        <CardBody className="h-full w-full">{body}</CardBody>
      </Card>
    </Fragment>
  );
};
