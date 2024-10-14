import { Button } from "@nextui-org/react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  MarkerType,
  Node,
  useNodesData,
  useReactFlow,
} from "@xyflow/react";
import { X } from "lucide-react";
import { Fragment } from "react/jsx-runtime";
import { BasicFlowNodeStatus } from "../nodes";

export const DefaultFlowEdge = ({ ...edgeProps }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    ...edgeProps,
  });
  const { id, source, target } = edgeProps;

  const sourceStatus = useNodesData<Node<BasicFlowNodeStatus>>(source);
  const targetStatus = useNodesData<Node<BasicFlowNodeStatus>>(target);
  const sourceActive = sourceStatus?.data?.active;
  const targetActive = targetStatus?.data?.active;
  const sourceValid = sourceStatus?.data?.valid;
  const targetValid = targetStatus?.data?.valid;

  const strokeColor = (() => {
    if (sourceActive && targetActive) {
      return "!stroke-success";
    }
    if (sourceActive || (sourceValid && targetValid)) {
      return "!stroke-warning";
    }
    return "!stroke-neutral";
  })();

  const { setEdges } = useReactFlow();
  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };
  return (
    <Fragment>
      <BaseEdge
        path={edgePath}
        id={id}
        markerEnd={MarkerType.ArrowClosed}
        markerStart={MarkerType.Arrow}
        className={strokeColor}
        style={{
          animation: !!sourceValid ? "dashdraw 0.2s linear infinite" : "",
          strokeDasharray: 5,
          strokeWidth: 4,
        }}
      />
      <EdgeLabelRenderer>
        {!targetActive && (
          <Button
            size="sm"
            variant="light"
            color="danger"
            isIconOnly
            onClick={onEdgeClick}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            <X />
          </Button>
        )}
      </EdgeLabelRenderer>
    </Fragment>
  );
};
