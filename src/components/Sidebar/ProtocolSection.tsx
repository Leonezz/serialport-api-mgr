import React from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Layers,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Protocol } from "../../lib/protocolTypes";
import { IconButton } from "../ui/IconButton";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";

interface ProtocolSectionProps {
  protocols: Protocol[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCreateProtocol: () => void;
}

const ProtocolSection: React.FC<ProtocolSectionProps> = ({
  protocols,
  isCollapsed,
  onToggleCollapse,
  onCreateProtocol,
}) => (
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
          Protocols
        </span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0">
          {protocols.length}
        </Badge>
      </div>
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          to="/protocols"
          className="inline-flex items-center justify-center rounded-radius-sm transition-colors h-6 w-6 p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Open Protocol Library"
          title="Open Protocol Library"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
        <IconButton
          variant="ghost"
          size="xs"
          onClick={onCreateProtocol}
          aria-label="Create Protocol"
          title="Create Protocol"
        >
          <Plus className="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </div>
    {!isCollapsed && (
      <div className="px-3 py-2 flex flex-col gap-1">
        {protocols.map((protocol) => (
          <Link
            key={protocol.id}
            to={`/protocols/${protocol.id}/edit`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-radius-sm text-body-sm hover:bg-bg-hover transition-colors"
          >
            <Layers className="w-4 h-4 text-text-muted" />
            <span className="truncate">{protocol.name}</span>
          </Link>
        ))}
        {protocols.length === 0 && (
          <EmptyState
            variant="protocols"
            className="py-4"
            onAction={onCreateProtocol}
          />
        )}
      </div>
    )}
  </>
);

export default ProtocolSection;
