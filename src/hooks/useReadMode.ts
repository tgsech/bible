import { useCallback, useState } from "react";

const READ_MODE_KEY = "livingwords:read-mode";

// Global preference, not per-chapter — flipping it changes how every
// chapter renders from here on, same as the theme/font pickers. Kept as a
// tiny standalone hook rather than routed through ThemeContext since it's
// behavioral (typing vs. read-only) rather than visual.
export function useReadMode() {
  const [readMode, setReadModeState] = useState(() => {
    try {
      return localStorage.getItem(READ_MODE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const setReadMode = useCallback((value: boolean) => {
    setReadModeState(value);
    try {
      localStorage.setItem(READ_MODE_KEY, String(value));
    } catch {
      /* ignore — preference just won't survive a reload */
    }
  }, []);

  return { readMode, setReadMode };
}
