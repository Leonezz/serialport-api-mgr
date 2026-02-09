import { useEffect, useRef, useState } from "react";

/**
 * Throttles a value, emitting at most once per `intervalMs`.
 * Unlike debounce, this fires at the throttle interval while values keep changing,
 * ensuring the UI stays updated during continuous streaming.
 */
export function useThrottle<T>(value: T, intervalMs: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastUpdated.current;
    const delay = elapsed >= intervalMs ? 0 : intervalMs - elapsed;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setThrottledValue(value);
      lastUpdated.current = Date.now();
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [value, intervalMs]);

  return throttledValue;
}
