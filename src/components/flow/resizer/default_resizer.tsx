import { NodeResizeControl } from "@xyflow/react";
import { MoveDiagonal2 } from "lucide-react";

type DefaultResizerProps = {
  minWidth: number;
  minHeight: number;
  visible: boolean;
};
export const DefaultResizer = ({
  minWidth,
  minHeight,
  visible,
}: DefaultResizerProps) => {
  return (
    <NodeResizeControl
      className={`bg-transparent border-none ${visible ? "visible" : "hidden"}`}
      minWidth={minWidth}
      minHeight={minHeight}
    >
      <MoveDiagonal2 className=" absolute -right-5 -bottom-5" />
    </NodeResizeControl>
  );
};
