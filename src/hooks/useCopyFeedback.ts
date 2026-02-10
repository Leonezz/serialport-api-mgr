import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Wraps clipboard copy with a self-resetting "copied" flag for UI feedback.
 *
 * @param resetMs - Duration in ms before `copied` resets to false (default: 2000)
 * @returns `copied` - true for `resetMs` after a successful copy
 * @returns `copy` - async function accepting text, returns true on success
 */
export function useCopyFeedback(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        console.warn("[useCopyFeedback] Clipboard write failed");
        return false;
      }
    },
    [resetMs],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { copied, copy } as const;
}
