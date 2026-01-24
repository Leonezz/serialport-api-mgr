/**
 * SortableList Component
 *
 * A reusable drag-and-drop sortable list using @dnd-kit.
 * Supports vertical reordering with visual feedback.
 *
 * Design System (FIGMA-DESIGN.md 12.3):
 * - Grab cursor on hover over handle
 * - Dragging item becomes semi-transparent
 * - Blue drop indicator line shows insertion point
 */

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "../../lib/utils";

interface SortableListProps<T> {
  items: T[];
  getItemId: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (
    item: T,
    index: number,
    dragHandleProps: DragHandleProps,
  ) => React.ReactNode;
  className?: string;
}

export interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
}

interface SortableItemProps {
  id: string;
  children: (dragHandleProps: DragHandleProps) => React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "opacity-50 z-50")}
    >
      {children({ attributes, listeners, isDragging })}
    </div>
  );
};

export function SortableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => getItemId(item) === active.id);
      const newIndex = items.findIndex((item) => getItemId(item) === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  const itemIds = items.map(getItemId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableItem key={getItemId(item)} id={getItemId(item)}>
              {(dragHandleProps) => renderItem(item, index, dragHandleProps)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * DragHandle Component
 *
 * A visual drag handle with grip icon.
 * Use within renderItem to provide the drag affordance.
 */
interface DragHandleComponentProps extends DragHandleProps {
  className?: string;
}

export const DragHandle: React.FC<DragHandleComponentProps> = ({
  attributes,
  listeners,
  isDragging,
  className,
}) => {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center p-1 rounded-radius-sm cursor-grab touch-none",
        "text-text-muted hover:text-text-secondary hover:bg-bg-hover",
        "transition-colors",
        isDragging && "cursor-grabbing",
        className,
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );
};

export default SortableList;
