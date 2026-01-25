import { useState, useCallback } from "react";

/**
 * useFormTabs Hook
 *
 * Manages tab state for forms and editors with support for
 * controlled/uncontrolled modes and tab change callbacks.
 *
 * @example
 * // Simple usage
 * const { activeTab, setActiveTab, tabs } = useFormTabs(["basic", "advanced"]);
 *
 * @example
 * // With default tab
 * const { activeTab, setActiveTab } = useFormTabs(["basic", "params", "scripts"], "params");
 *
 * @example
 * // With change callback
 * const { activeTab, setActiveTab } = useFormTabs(tabs, "basic", {
 *   onTabChange: (newTab, prevTab) => console.log(`Changed from ${prevTab} to ${newTab}`)
 * });
 */

export interface UseFormTabsOptions<T extends string> {
  /** Callback when tab changes */
  onTabChange?: (newTab: T, prevTab: T) => void;
  /** Validate if tab can be changed (return false to prevent) */
  canChangeTab?: (newTab: T, prevTab: T) => boolean;
}

export interface UseFormTabsResult<T extends string> {
  /** Currently active tab */
  activeTab: T;
  /** Set the active tab */
  setActiveTab: (tab: T) => void;
  /** Available tabs */
  tabs: readonly T[];
  /** Check if a specific tab is active */
  isActive: (tab: T) => boolean;
  /** Go to next tab (wraps around) */
  nextTab: () => void;
  /** Go to previous tab (wraps around) */
  prevTab: () => void;
  /** Get tab index */
  getTabIndex: (tab: T) => number;
}

export function useFormTabs<T extends string>(
  tabs: readonly T[],
  defaultTab?: T,
  options: UseFormTabsOptions<T> = {},
): UseFormTabsResult<T> {
  const { onTabChange, canChangeTab } = options;

  const [activeTab, setActiveTabState] = useState<T>(defaultTab || tabs[0]);

  const setActiveTab = useCallback(
    (newTab: T) => {
      if (newTab === activeTab) return;

      if (canChangeTab && !canChangeTab(newTab, activeTab)) {
        return;
      }

      const prevTab = activeTab;
      setActiveTabState(newTab);
      onTabChange?.(newTab, prevTab);
    },
    [activeTab, canChangeTab, onTabChange],
  );

  const isActive = useCallback((tab: T) => tab === activeTab, [activeTab]);

  const getTabIndex = useCallback((tab: T) => tabs.indexOf(tab), [tabs]);

  const nextTab = useCallback(() => {
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex]);
  }, [activeTab, tabs, setActiveTab]);

  const prevTab = useCallback(() => {
    const currentIndex = tabs.indexOf(activeTab);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[prevIndex]);
  }, [activeTab, tabs, setActiveTab]);

  return {
    activeTab,
    setActiveTab,
    tabs,
    isActive,
    nextTab,
    prevTab,
    getTabIndex,
  };
}

export default useFormTabs;
