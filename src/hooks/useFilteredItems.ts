import { useMemo } from "react";

/**
 * useFilteredItems Hook
 *
 * Filters an array of items by a search query across specified keys.
 * Returns items that match the query in any of the specified keys.
 *
 * @example
 * // Filter by single key
 * const filtered = useFilteredItems(commands, query, ["name"]);
 *
 * @example
 * // Filter by multiple keys
 * const filtered = useFilteredItems(commands, query, ["name", "description", "group"]);
 *
 * @example
 * // With custom match function
 * const filtered = useFilteredItems(commands, query, ["name"], {
 *   matchFn: (value, query) => value.startsWith(query)
 * });
 */

export interface FilterOptions {
  /** Case-insensitive matching (default: true) */
  caseInsensitive?: boolean;
  /** Custom match function */
  matchFn?: (value: string, query: string) => boolean;
  /** Trim whitespace from query (default: true) */
  trimQuery?: boolean;
}

export function useFilteredItems<T>(
  items: T[],
  query: string,
  searchKeys: (keyof T)[],
  options: FilterOptions = {},
): T[] {
  const { caseInsensitive = true, matchFn, trimQuery = true } = options;

  return useMemo(() => {
    const searchQuery = trimQuery ? query.trim() : query;

    if (!searchQuery) {
      return items;
    }

    const normalizedQuery = caseInsensitive
      ? searchQuery.toLowerCase()
      : searchQuery;

    return items.filter((item) => {
      return searchKeys.some((key) => {
        const value = item[key];
        if (value == null) return false;

        const stringValue = String(value);
        const normalizedValue = caseInsensitive
          ? stringValue.toLowerCase()
          : stringValue;

        if (matchFn) {
          return matchFn(normalizedValue, normalizedQuery);
        }

        return normalizedValue.includes(normalizedQuery);
      });
    });
  }, [items, query, searchKeys, caseInsensitive, matchFn, trimQuery]);
}

export default useFilteredItems;
