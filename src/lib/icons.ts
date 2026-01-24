/**
 * Centralized Icon Constants
 *
 * Based on FIGMA-DESIGN.md Chapter 4 - Icons Specification
 *
 * This file provides a single source of truth for all icons used in the application.
 * Import icons from this file instead of directly from lucide-react to ensure consistency.
 */

import {
  // Entity Type Icons (4.1) - 20px, stroke width 1.5
  PlugZap,
  FileCode2,
  TerminalSquare,
  Workflow,
  Folder,
  Monitor,

  // Action Icons (4.2) - 16px
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Play,
  Square,
  Pause,
  Settings,
  Menu,
  MoreVertical,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Copy,

  // Status Indicator Icons (4.3)
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  AlertCircle,

  // Additional commonly used icons
  Loader2,
  Send,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Link2,
  Sliders,
  Clock,
  Coins,
  Bot,
  Paperclip,
  FileText,
  Cpu,
  Activity,
  Wifi,
  Usb,
  Binary,
  ScanLine,
  Layers,
  ListVideo,
  FileClock,
  Home,
  Zap,
  ArrowDownToLine,
  ArrowDownCircle,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
  Heart,
  Bookmark,
  Tag,
  Hash,

  // Type export
  type LucideIcon,
} from "lucide-react";

// =============================================================================
// ENTITY TYPE ICONS (Section 4.1)
// Size: 20px, Stroke Width: 1.5
// =============================================================================

export const EntityIcons = {
  device: PlugZap,
  protocol: FileCode2,
  command: TerminalSquare,
  sequence: Workflow,
  folder: Folder,
  session: Monitor,
} as const;

export type EntityType = keyof typeof EntityIcons;

// =============================================================================
// ACTION ICONS (Section 4.2)
// Size: 16px
// =============================================================================

export const ActionIcons = {
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  save: Check,
  cancel: X,
  run: Play,
  stop: Square,
  pause: Pause,
  settings: Settings,
  menu: Menu,
  more: MoreVertical,
  dragHandle: GripVertical,
  expand: ChevronDown,
  collapse: ChevronRight,
  close: X,
  search: Search,
  filter: Filter,
  export: Download,
  import: Upload,
  refresh: RefreshCw,
  clear: Trash2,
  copy: Copy,
} as const;

// =============================================================================
// STATUS INDICATOR ICONS (Section 4.3)
// =============================================================================

export const StatusIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  alert: AlertCircle,
} as const;

// =============================================================================
// NAVIGATION ICONS
// =============================================================================

export const NavigationIcons = {
  back: ArrowLeft,
  forward: ArrowRight,
  up: ArrowUp,
  down: ArrowDown,
  home: Home,
  external: ExternalLink,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
} as const;

// =============================================================================
// UI ICONS
// =============================================================================

export const UIIcons = {
  loader: Loader2,
  send: Send,
  link: Link2,
  sliders: Sliders,
  clock: Clock,
  coins: Coins,
  bot: Bot,
  attachment: Paperclip,
  file: FileText,
  cpu: Cpu,
  activity: Activity,
  wifi: Wifi,
  usb: Usb,
  binary: Binary,
  scan: ScanLine,
  layers: Layers,
  listVideo: ListVideo,
  history: FileClock,
  zap: Zap,
  download: ArrowDownToLine,
  downloadCircle: ArrowDownCircle,
  reset: RotateCcw,
  maximize: Maximize2,
  minimize: Minimize2,
  visible: Eye,
  hidden: EyeOff,
  lock: Lock,
  unlock: Unlock,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  tag: Tag,
  hash: Hash,
} as const;

// =============================================================================
// RE-EXPORTS for direct usage
// =============================================================================

// Entity Icons
export {
  PlugZap as DeviceIcon,
  FileCode2 as ProtocolIcon,
  TerminalSquare as CommandIcon,
  Workflow as SequenceIcon,
  Folder as FolderIcon,
  Monitor as SessionIcon,
};

// Action Icons
export {
  Plus as AddIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Check as SaveIcon,
  X as CloseIcon,
  Play as RunIcon,
  Square as StopIcon,
  Pause as PauseIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  MoreVertical as MoreIcon,
  GripVertical as DragHandleIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  RefreshCw as RefreshIcon,
  Copy as CopyIcon,
};

// Status Icons
export {
  CheckCircle as SuccessIcon,
  AlertTriangle as WarningIcon,
  XCircle as ErrorIcon,
  Info as InfoIcon,
};

// Type export
export type { LucideIcon };

// =============================================================================
// ICON SIZE CONSTANTS
// =============================================================================

export const IconSizes = {
  /** Entity type icons - 20px */
  entity: "w-5 h-5",
  /** Action icons - 16px */
  action: "w-4 h-4",
  /** Small icons - 14px */
  sm: "w-3.5 h-3.5",
  /** Extra small icons - 12px */
  xs: "w-3 h-3",
  /** Large icons - 24px */
  lg: "w-6 h-6",
  /** Extra large icons - 32px */
  xl: "w-8 h-8",
} as const;

// =============================================================================
// ICON STROKE WIDTH
// =============================================================================

export const IconStrokeWidth = {
  /** Default stroke width */
  default: 1.5,
  /** Thin stroke */
  thin: 1,
  /** Bold stroke */
  bold: 2,
} as const;
