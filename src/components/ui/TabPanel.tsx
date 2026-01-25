import * as React from "react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { TabBar, TabContent, TabItem } from "./TabBar";

/**
 * TabPanel Component
 *
 * A higher-level component that combines TabBar and TabContent
 * for a complete tab-based UI with minimal boilerplate.
 */

export interface Tab extends TabItem {
  content: React.ReactNode;
}

export interface TabPanelProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  tabBarClassName?: string;
  contentClassName?: string;
  /** Full width tabs */
  fullWidth?: boolean;
}

/**
 * Controlled or uncontrolled TabPanel
 *
 * @example
 * // Uncontrolled (manages its own state)
 * <TabPanel
 *   tabs={[
 *     { id: "general", label: "General", icon: <Settings />, content: <GeneralTab /> },
 *     { id: "advanced", label: "Advanced", content: <AdvancedTab /> },
 *   ]}
 *   defaultTab="general"
 * />
 *
 * @example
 * // Controlled (parent manages state)
 * <TabPanel
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 */
const TabPanel: React.FC<TabPanelProps> = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  className,
  tabBarClassName,
  contentClassName,
  fullWidth = false,
}) => {
  // Uncontrolled state
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.id || "",
  );

  // Use controlled or uncontrolled
  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab;

  const handleTabChange = (tabId: string) => {
    if (!isControlled) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  // Extract TabItem props for TabBar (without content)
  const tabItems: TabItem[] = tabs.map(({ content, ...item }) => item);

  return (
    <div className={cn("flex flex-col", className)}>
      <TabBar
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className={tabBarClassName}
        fullWidth={fullWidth}
      />
      <div className={cn("flex-1", contentClassName)}>
        {tabs.map((tab) => (
          <TabContent key={tab.id} tabId={tab.id} activeTab={activeTab}>
            {tab.content}
          </TabContent>
        ))}
      </div>
    </div>
  );
};

TabPanel.displayName = "TabPanel";

export { TabPanel };

// Re-export TabBar and TabContent for direct usage when needed
export { TabBar, TabContent } from "./TabBar";
export type { TabItem, TabBarProps, TabContentProps } from "./TabBar";
