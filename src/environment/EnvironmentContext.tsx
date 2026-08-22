import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { useSession } from "../lib/authClient";

interface EnvironmentContextValue {
  // When true, a fully-typed verse does NOT auto-clear to the next one -
  // the person has to explicitly press Space or Enter (and only once the
  // verse is error-free) to move on. See useTypingSession.handleInput.
  // Defaults to true for anyone who hasn't explicitly set it.
  manualAdvance: boolean;
  // When true, the active verse behaves like a real text field: clicking a
  // character moves the caret there, and arrow keys navigate/edit
  // mid-string instead of only appending/backspacing at the end. See
  // VerseRow.tsx / ReadPage.tsx.
  wordProcessorMode: boolean;
  setManualAdvance: (value: boolean) => void;
  setWordProcessorMode: (value: boolean) => void;
}

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

const MANUAL_ADVANCE_STORAGE_KEY = "environment:manualAdvance";
const WORD_PROCESSOR_STORAGE_KEY = "environment:wordProcessorMode";

// localStorage is what makes this work for guests (and gives everyone an
// instant, no-network initial paint instead of a flash of default behavior
// while a logged-in user's settings are still in flight). Reading it
// synchronously in useState's initializer, rather than in an effect, is
// what avoids that flash - same reasoning as ThemeContext's readStored.
// defaultValue covers "this person has never touched the toggle" (no key
// in storage yet) - distinct from an explicit "false" they chose earlier,
// which always wins over the default.
function readStoredBool(key: string, defaultValue: boolean): boolean {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === "true";
  } catch {
    return defaultValue; // localStorage can throw in some locked-down contexts
  }
}

function writeStoredBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore — worst case, the choice just doesn't survive a reload
  }
}

interface EnvironmentSettings {
  manualAdvance: boolean | null;
  wordProcessorMode: boolean | null;
}

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  // manualAdvance defaults to true (auto-clear is off by default) -
  // wordProcessorMode still defaults to false.
  const [manualAdvance, setManualAdvanceState] = useState(() => readStoredBool(MANUAL_ADVANCE_STORAGE_KEY, true));
  const [wordProcessorMode, setWordProcessorModeState] = useState(() =>
    readStoredBool(WORD_PROCESSOR_STORAGE_KEY, false)
  );

  // Guards the one-time "load whatever the backend has, sync a guest's
  // local choice up on first login" exchange below so it runs once per
  // login rather than once per render - same pattern as ThemeContext's
  // syncedForUserId.
  const syncedForUserId = useRef<string | null>(null);

  // Setting a toggle always updates local state + localStorage (instant,
  // works offline, works for guests), and additionally pushes to the
  // backend when logged in so it follows the person to other devices. Both
  // fields are validated as plain booleans server-side (see
  // routes/profile.ts) so there's nothing to await or handle here beyond a
  // console warning if the request itself fails.
  function setManualAdvance(value: boolean) {
    setManualAdvanceState(value);
    writeStoredBool(MANUAL_ADVANCE_STORAGE_KEY, value);
    if (session) {
      api.put("/profile/settings", { manualAdvance: value }).catch((err) => {
        console.error("Couldn't sync manual advance to your account:", err);
      });
    }
  }

  function setWordProcessorMode(value: boolean) {
    setWordProcessorModeState(value);
    writeStoredBool(WORD_PROCESSOR_STORAGE_KEY, value);
    if (session) {
      api.put("/profile/settings", { wordProcessorMode: value }).catch((err) => {
        console.error("Couldn't sync word processor mode to your account:", err);
      });
    }
  }

  // On login: the backend's saved toggle wins if it's ever been set (that's
  // the "follow me across devices" case). If it hasn't - first time this
  // account has ever logged in anywhere - push up whatever was picked
  // locally as a guest, so it's there next time they sign in elsewhere.
  useEffect(() => {
    if (!session || syncedForUserId.current === session.user.id) return;
    syncedForUserId.current = session.user.id;

    api
      .get<EnvironmentSettings>("/profile/settings")
      .then((settings) => {
        if (!settings) return;
        const patch: { manualAdvance?: boolean; wordProcessorMode?: boolean } = {};

        if (typeof settings.manualAdvance === "boolean") {
          setManualAdvanceState(settings.manualAdvance);
          writeStoredBool(MANUAL_ADVANCE_STORAGE_KEY, settings.manualAdvance);
        } else {
          patch.manualAdvance = manualAdvance;
        }

        if (typeof settings.wordProcessorMode === "boolean") {
          setWordProcessorModeState(settings.wordProcessorMode);
          writeStoredBool(WORD_PROCESSOR_STORAGE_KEY, settings.wordProcessorMode);
        } else {
          patch.wordProcessorMode = wordProcessorMode;
        }

        if (Object.keys(patch).length > 0) {
          api.put("/profile/settings", patch).catch(() => {
            // best-effort — next explicit toggle change will retry this
          });
        }
      })
      .catch((err) => console.error("Couldn't load your saved environment settings:", err));
    // Deliberately only re-runs when the logged-in user changes (via the
    // ref guard above) — manualAdvance/wordProcessorMode are read here but
    // shouldn't re-trigger this exchange on every change, that's what the
    // setters' own backend push is for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <EnvironmentContext.Provider
      value={{ manualAdvance, wordProcessorMode, setManualAdvance, setWordProcessorMode }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const ctx = useContext(EnvironmentContext);
  if (!ctx) throw new Error("useEnvironment must be used within an EnvironmentProvider");
  return ctx;
}
