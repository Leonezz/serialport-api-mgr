import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * TabBar Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 6.1):
 * - Variant: underline (default)
 * - Tab Item: padding 12px 16px, body.md font, 44px height
 * - States: Active (text.primary + 2px underline), Inactive (text.secondary), Hover (text.primary)
 */

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  /** Full width tabs */
  fullWidth?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
  fullWidth = false,
}) => {
  return (
    <div
      className={cn("flex border-b border-border-default", className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            className={cn(
              "relative h-11 px-4 py-3 text-sm font-normal transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              fullWidth && "flex-1",
              isActive
                ? "text-text-primary"
                : "text-text-secondary hover:text-text-primary",
              tab.disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
            {/* Active underline */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
};

TabBar.displayName = "TabBar";

/**
 * TabContent Component
 * Helper to render tab content conditionally
 */
export interface TabContentProps {
  tabId: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

const TabContent: React.FC<TabContentProps> = ({
  tabId,
  activeTab,
  children,
  className,
}) => {
  if (tabId !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      className={cn("animate-in fade-in-0 duration-200", className)}
    >
      {children}
    </div>
  );
};

TabContent.displayName = "TabContent";

export { TabBar, TabContent };
