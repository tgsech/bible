import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const READ_MODE_KEY = "livingwords:read-mode";

interface ReadModeContextValue {
  readMode: boolean;
  setReadMode: (value: boolean) => void;
}

const ReadModeContext = createContext<ReadModeContextValue | null>(null);

function readStored(): boolean {
  try {
    return localStorage.getItem(READ_MODE_KEY) === "true";
  } catch {
    return false; // localStorage can throw in some locked-down contexts
  }
}

// Global preference, not per-chapter - flipping it (now from the sidebar,
// from anywhere in the app) changes how every chapter renders from here on,
// same as the theme/font pickers. Lives in a context rather than a plain
// hook specifically so the sidebar's toggle and ReadPage's own rendering
// share one value instead of drifting between two independent
// localStorage-backed useState instances.
export function ReadModeProvider({ children }: { children: ReactNode }) {
  const [readMode, setReadModeState] = useState(readStored);

  const setReadMode = useCallback((value: boolean) => {
    setReadModeState(value);
    try {
      localStorage.setItem(READ_MODE_KEY, String(value));
    } catch {
      /* ignore - preference just won't survive a reload */
    }
  }, []);

  return <ReadModeContext.Provider value={{ readMode, setReadMode }}>{children}</ReadModeContext.Provider>;
}

export function useReadMode() {
  const ctx = useContext(ReadModeContext);
  if (!ctx) throw new Error("useReadMode must be used within a ReadModeProvider");
  return ctx;
}
