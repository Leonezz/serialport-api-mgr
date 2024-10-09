import { NodeProps, NodeToolbar } from "@xyflow/react";
import { BasicFlowNodeStatus, FlowNode } from ".";
import { FlowNodeCategories } from "./node_types";
import { Fragment, ReactNode } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from "@nextui-org/react";
import { InputHandle } from "../handles/input_handle";
import { CustomHandler } from "../handles/custom_handle";
import { DefaultResizer } from "../resizer/default_resizer";

export type BaseFlowNodeType<
  Data,
  NodeType extends FlowNodeCategories
> = FlowNode<BasicFlowNodeStatus & Data, NodeType>;

type BaseFlowNodeProps<Data, NodeType extends FlowNodeCategories> = NodeProps<
  BaseFlowNodeType<Data, NodeType>
>;

type InputHandleType = {
  handleId: `${string}-${string}-input`;
  onValueChange: <T>(value: T) => void;
};

type OutputHandleType = {
  handleId: `${string}-${string}-output`;
  connectionLimit: number;
};

export const BaseFlowNode = <Data, NodeType extends FlowNodeCategories>({
  id,
  selected,
  inputHandle,
  outputHandle,
  title,
  body,
  extraToolBar,
  minWidth,
  minHeight,
}: BaseFlowNodeProps<Data, NodeType> & {
  inputHandle?: InputHandleType;
  outputHandle?: OutputHandleType;
  title: ReactNode;
  body: ReactNode;
  extraToolBar: ReactNode;
  minWidth: number;
  minHeight: number;
}) => {
  return (
    <Fragment>
      <NodeToolbar isVisible={selected} nodeId={id}>
        <ButtonGroup size="sm">
          <Button color="danger">Delete Node</Button>
          <Button color="danger">Cut Edges</Button>
          {extraToolBar}
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
        />
      )}

      {outputHandle && (
        <CustomHandler
          id={outputHandle.handleId}
          type="source"
          connectionLimit={outputHandle.connectionLimit}
        />
      )}

      <Card className="overflow-hidden">
        <CardHeader>{title}</CardHeader>

        <Divider />

        <CardBody>{body}</CardBody>
      </Card>
    </Fragment>
  );
};
