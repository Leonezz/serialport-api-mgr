import { useEffect, useRef, useState } from "react";

/**
 * Throttles a value, emitting at most once per `intervalMs`.
 * Unlike debounce, this fires at the throttle interval while values keep changing,
 * ensuring the UI stays updated during continuous streaming.
 *
 * Fires as soon as possible when the interval has elapsed (via setTimeout(0))
 * and captures the final pending value (trailing-edge).
 */
export function useThrottle<T>(value: T, intervalMs: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingValue = useRef(value);

  useEffect(() => {
    pendingValue.current = value;
    const now = Date.now();
    const elapsed = now - lastUpdated.current;

    // If a timer is already pending, it will pick up the latest pendingValue
    if (timeoutRef.current !== undefined) return;

    const delay = elapsed >= intervalMs ? 0 : intervalMs - elapsed;

    timeoutRef.current = setTimeout(() => {
      setThrottledValue(pendingValue.current);
      lastUpdated.current = Date.now();
      timeoutRef.current = undefined;
    }, delay);
  }, [value, intervalMs]);

  // Cleanup only on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return throttledValue;
}
