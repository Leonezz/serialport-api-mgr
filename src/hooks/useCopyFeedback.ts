import { useCopyToClipboard } from "usehooks-ts";
import { useEffect, useState, useCallback, useRef } from "react";

export function useCopyFeedback(resetMs = 2000) {
  const [, copyFn] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyFn(text);
      if (ok) {
        setCopied(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), resetMs);
      }
      return ok;
    },
    [copyFn, resetMs],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { copied, copy } as const;
}
