import { useMemo } from "react";

/**
 * useGroupedItems Hook
 *
 * Groups an array of items by a specified key or function.
 * Returns a Map with group names as keys and arrays of items as values.
 *
 * @example
 * // Group by string key
 * const grouped = useGroupedItems(commands, "group");
 *
 * @example
 * // Group by function
 * const grouped = useGroupedItems(commands, (cmd) => cmd.deviceId || "ungrouped");
 *
 * @example
 * // With custom ungrouped label
 * const grouped = useGroupedItems(commands, "group", "Other");
 */

export interface GroupedResult<T> {
  name: string;
  items: T[];
}

export function useGroupedItems<T>(
  items: T[],
  groupBy: keyof T | ((item: T) => string | undefined),
  ungroupedLabel: string = "Ungrouped",
): GroupedResult<T>[] {
  return useMemo(() => {
    const groups = new Map<string, T[]>();

    items.forEach((item) => {
      const groupKey =
        typeof groupBy === "function"
          ? groupBy(item) || ungroupedLabel
          : (item[groupBy] as string | undefined) || ungroupedLabel;

      const existing = groups.get(groupKey);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(groupKey, [item]);
      }
    });

    // Convert to array and sort (ungrouped last)
    const result: GroupedResult<T>[] = [];
    groups.forEach((groupItems, name) => {
      result.push({ name, items: groupItems });
    });

    return result.sort((a, b) => {
      if (a.name === ungroupedLabel) return 1;
      if (b.name === ungroupedLabel) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [items, groupBy, ungroupedLabel]);
}

export default useGroupedItems;
