import { Card, CardHeader } from "@nextui-org/react";
import { FlowNodeCategories, FlowNodeTypes } from "../nodes/node_types";

type NodeSelectSideProps = {};
export const NodeSelectSide = ({}: NodeSelectSideProps) => {
  return (
    <aside className="flex flex-col gap-1 absolute top-5 right-5">
      {Object.keys(FlowNodeTypes).map((k) => (
        <DragableCard key={k} type={k as FlowNodeCategories} />
      ))}
    </aside>
  );
};

const DragableCard = ({ type }: { type: FlowNodeCategories }) => {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("text/plain", type);
    event.dataTransfer.effectAllowed = "move";
  };
  return (
    <Card
      id={type}
      key={type}
      className="cursor-grab"
      onDragStart={onDragStart}
      draggable={true}
    >
      <CardHeader>{type}</CardHeader>
    </Card>
  );
};
