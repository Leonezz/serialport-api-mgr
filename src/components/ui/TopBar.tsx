import * as React from "react";
import { Menu, ChevronDown, Settings, HelpCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

/**
 * TopBar Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 8.2):
 * - Height: 48px
 * - Background: bg.surface
 * - Border Bottom: 1px border.default
 * - Padding: 0 16px
 * - Content: Menu icon, App title, Session dropdown, Settings/Help icons
 */

export interface TopBarProps {
  /** App title */
  title?: string;
  /** Current session name */
  sessionName?: string;
  /** Session options for dropdown */
  sessions?: { id: string; name: string }[];
  /** Called when session changes */
  onSessionChange?: (sessionId: string) => void;
  /** Called when menu button clicked (mobile) */
  onMenuClick?: () => void;
  /** Called when settings clicked */
  onSettingsClick?: () => void;
  /** Called when help clicked */
  onHelpClick?: () => void;
  /** Show menu button (for mobile) */
  showMenuButton?: boolean;
  /** Left content slot */
  leftContent?: React.ReactNode;
  /** Center content slot */
  centerContent?: React.ReactNode;
  /** Right content slot */
  rightContent?: React.ReactNode;
  /** Additional className */
  className?: string;
}

const TopBar: React.FC<TopBarProps> = ({
  title = "SerialMan AI",
  sessionName,
  sessions = [],
  onSessionChange,
  onMenuClick,
  onSettingsClick,
  onHelpClick,
  showMenuButton = false,
  leftContent,
  centerContent,
  rightContent,
  className,
}) => {
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] =
    React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsSessionDropdownOpen(false);
      }
    };
    if (isSessionDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSessionDropdownOpen]);

  return (
    <header
      className={cn(
        "h-12 px-4 flex items-center justify-between",
        "bg-bg-surface border-b border-border-default",
        "shrink-0",
        className,
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {leftContent ?? (
          <h1 className="text-heading-lg text-text-primary">{title}</h1>
        )}
      </div>

      {/* Center Section - Session Dropdown */}
      <div className="flex items-center">
        {centerContent ??
          (sessionName && sessions.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-radius-sm",
                  "text-sm font-medium text-text-primary",
                  "bg-bg-muted hover:bg-bg-hover transition-colors",
                  "border border-border-default",
                )}
                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
              >
                <span>Session: {sessionName}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isSessionDropdownOpen && "rotate-180",
                  )}
                />
              </button>

              {isSessionDropdownOpen && (
                <div
                  className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 mt-1",
                    "min-w-[200px] py-1",
                    "bg-bg-surface border border-border-default rounded-radius-md",
                    "shadow-lg z-50",
                  )}
                >
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm",
                        "hover:bg-bg-hover transition-colors",
                        session.name === sessionName
                          ? "text-accent-primary font-medium"
                          : "text-text-primary",
                      )}
                      onClick={() => {
                        onSessionChange?.(session.id);
                        setIsSessionDropdownOpen(false);
                      }}
                    >
                      {session.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        {rightContent ?? (
          <>
            {onSettingsClick && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onSettingsClick}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
            {onHelpClick && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onHelpClick}
                aria-label="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
};

TopBar.displayName = "TopBar";

export { TopBar };
