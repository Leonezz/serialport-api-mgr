/**
 * Protocol Editor Types
 *
 * Shared types for all Protocol Editor components
 */

import type {
  Protocol,
  FramingConfig,
  MessageStructure,
  MessageElement,
  CommandTemplate,
} from "../../lib/protocolTypes";
import type { Device } from "../../types";

// Tab definitions
export type EditorTab = "general" | "framing" | "structures" | "commands";

export interface TabDefinition {
  id: EditorTab;
  label: string;
  icon: React.ElementType;
}

// Props for tab components
export interface TabProps {
  editState: Protocol;
  onChange: <K extends keyof Protocol>(key: K, value: Protocol[K]) => void;
}

// Props for GeneralTab
export type GeneralTabProps = TabProps;

// Props for FramingTab
export type FramingTabProps = TabProps;

// Props for StructuresTab
export interface StructuresTabProps extends TabProps {
  onAddStructure: () => void;
  onDeleteStructure: (id: string) => void;
}

// Props for CommandsTab
export interface CommandsTabProps extends TabProps {
  onAddCommand: () => void;
  onEditCommand: (cmd: CommandTemplate) => void;
  onDeleteCommand: (id: string) => void;
  onAddToDevice: (cmd: CommandTemplate) => void;
  linkedDevices: Device[];
}

// Props for ElementEditModal
export interface ElementEditModalProps {
  isNew: boolean;
  editState: MessageElement;
  structure: MessageStructure;
  onClose: () => void;
  onSave: (element: MessageElement) => void;
}

// Props for StructureEditModal
export interface StructureEditModalProps {
  editState: MessageStructure;
  onClose: () => void;
  onSave: (structure: MessageStructure) => void;
}

// Props for CommandEditModal
export interface CommandEditModalProps {
  editState: CommandTemplate;
  structures: MessageStructure[];
  onClose: () => void;
  onSave: (command: CommandTemplate) => void;
}

// Framing config change handler
export type FramingChangeHandler = (updates: Partial<FramingConfig>) => void;
