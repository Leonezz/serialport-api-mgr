import React from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Link, useNavigate } from "react-router-dom";
import { SerialSequence } from "../../types";
import {
  Play,
  Plus,
  Pencil,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge, EmptyState, IconButton } from "../ui";
import type { TFunction } from "i18next";

interface SequenceSectionProps {
  filteredSequences: SerialSequence[];
  selectedDeviceId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRunSequence: (seq: SerialSequence) => void;
  onEditSequence: (seq: SerialSequence) => void;
  onCreateSequence: () => void;
  t: TFunction;
}

const SequenceSection: React.FC<SequenceSectionProps> = ({
  filteredSequences,
  selectedDeviceId,
  isCollapsed,
  onToggleCollapse,
  onRunSequence,
  onEditSequence,
  onCreateSequence,
  t,
}) => {
  const [animateRef] = useAutoAnimate();
  const navigate = useNavigate();

  return (
    <>
      <div
        className="h-8 flex items-center justify-between px-3 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border-default"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
          <span className="text-label-sm font-semibold text-text-secondary uppercase tracking-wider">
            {t("sidebar.sequences")}
          </span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0">
            {filteredSequences.length}
          </Badge>
        </div>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            to="/sequences"
            className="inline-flex items-center justify-center rounded-radius-sm transition-colors h-6 w-6 p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open Sequence Library"
            title="Open Sequence Library"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <IconButton
            variant="ghost"
            size="xs"
            onClick={onCreateSequence}
            aria-label="Create Sequence"
            title="Create Sequence"
          >
            <Plus className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>
      {!isCollapsed && (
        <div className="px-3 py-2">
          {filteredSequences.length === 0 ? (
            <EmptyState
              variant="sequences"
              title={
                selectedDeviceId ? "No sequences for this device" : undefined
              }
              className="py-4"
              onAction={onCreateSequence}
            />
          ) : (
            <div ref={animateRef} className="flex flex-col gap-1.5">
              {filteredSequences.map((seq) => (
                <div
                  key={seq.id}
                  className="group flex flex-col gap-1 p-2 rounded-radius-sm hover:bg-bg-hover transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-body-sm truncate">
                      {seq.name}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton
                        variant="primary"
                        size="xs"
                        onClick={() => onRunSequence(seq)}
                        aria-label="Run Sequence"
                        title="Run Sequence"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="xs"
                        onClick={() => onEditSequence(seq)}
                        aria-label="Quick Edit"
                        title="Quick Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="xs"
                        onClick={() => navigate(`/sequences/${seq.id}/edit`)}
                        aria-label="Open Full Editor"
                        title="Open Full Editor"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </IconButton>
                    </div>
                  </div>
                  <div className="text-body-xs text-text-muted">
                    {seq.steps.length} step
                    {seq.steps.length !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SequenceSection;
