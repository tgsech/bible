import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ERROR_SOUND_OPTIONS, COMPLETION_SOUND_OPTIONS, findSoundOption, playSound } from "./sounds";
import { api } from "../lib/api";
import { useSession } from "../lib/authClient";

interface SoundContextValue {
  soundsEnabled: boolean;
  errorSoundId: string | null;
  completionSoundId: string | null;
  setSoundsEnabled: (value: boolean) => void;
  setErrorSoundId: (id: string | null) => void;
  setCompletionSoundId: (id: string | null) => void;
  // Fires the currently-chosen sound directly, ignoring soundsEnabled -
  // used for the settings page's "preview" buttons, where clicking preview
  // is itself an explicit request to hear it even if sounds are off.
  previewError: () => void;
  previewCompletion: () => void;
  // Fires the currently-chosen sound only if soundsEnabled - used at the
  // actual moments a mistake/completion happens during typing.
  playError: () => void;
  playCompletion: () => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

const SOUNDS_ENABLED_KEY = "sound:enabled";
const ERROR_SOUND_KEY = "sound:errorId";
const COMPLETION_SOUND_KEY = "sound:completionId";

// Same localStorage-first approach as EnvironmentContext: instant, works
// offline, works for guests, and additionally synced to the backend when
// logged in so these three follow the person to other devices (see the
// login-sync effect in the provider below).
function readStoredBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "true";
  } catch {
    return fallback;
  }
}

function readStoredString(key: string): string | null {
  try {
    return localStorage.getItem(key) || null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore — worst case the choice just doesn't survive a reload
  }
}

interface SoundSettings {
  soundsEnabled: boolean | null;
  errorSoundId: string | null;
  completionSoundId: string | null;
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [soundsEnabled, setSoundsEnabledState] = useState(() => readStoredBool(SOUNDS_ENABLED_KEY, true));
  const [errorSoundId, setErrorSoundIdState] = useState<string | null>(
    () => readStoredString(ERROR_SOUND_KEY) ?? ERROR_SOUND_OPTIONS[0]?.id ?? null
  );
  const [completionSoundId, setCompletionSoundIdState] = useState<string | null>(
    () => readStoredString(COMPLETION_SOUND_KEY) ?? COMPLETION_SOUND_OPTIONS[0]?.id ?? null
  );

  // Guards the one-time "load whatever the backend has, sync a guest's
  // local choice up on first login" exchange below so it runs once per
  // login rather than once per render - same pattern as EnvironmentContext's
  // syncedForUserId.
  const syncedForUserId = useRef<string | null>(null);

  // Setting a toggle/pick always updates local state + localStorage
  // (instant, works offline, works for guests), and additionally pushes to
  // the backend when logged in so it follows the person to other devices.
  function setSoundsEnabled(value: boolean) {
    setSoundsEnabledState(value);
    writeStored(SOUNDS_ENABLED_KEY, String(value));
    if (session) {
      api.put("/profile/settings", { soundsEnabled: value }).catch((err) => {
        console.error("Couldn't sync sound setting to your account:", err);
      });
    }
  }
  function setErrorSoundId(id: string | null) {
    setErrorSoundIdState(id);
    writeStored(ERROR_SOUND_KEY, id ?? "");
    if (session) {
      api.put("/profile/settings", { errorSoundId: id }).catch((err) => {
        console.error("Couldn't sync error sound to your account:", err);
      });
    }
  }
  function setCompletionSoundId(id: string | null) {
    setCompletionSoundIdState(id);
    writeStored(COMPLETION_SOUND_KEY, id ?? "");
    if (session) {
      api.put("/profile/settings", { completionSoundId: id }).catch((err) => {
        console.error("Couldn't sync completion sound to your account:", err);
      });
    }
  }

  // On login: the backend's saved choice wins if it's ever been set (the
  // "follow me across devices" case). If it hasn't - first time this
  // account has ever logged in anywhere - push up whatever was picked
  // locally as a guest, so it's there next time they sign in elsewhere.
  // Same pattern as EnvironmentContext's login-sync effect.
  useEffect(() => {
    if (!session || syncedForUserId.current === session.user.id) return;
    syncedForUserId.current = session.user.id;

    api
      .get<SoundSettings>("/profile/settings")
      .then((settings) => {
        if (!settings) return;
        const patch: { soundsEnabled?: boolean; errorSoundId?: string | null; completionSoundId?: string | null } = {};

        if (typeof settings.soundsEnabled === "boolean") {
          setSoundsEnabledState(settings.soundsEnabled);
          writeStored(SOUNDS_ENABLED_KEY, String(settings.soundsEnabled));
        } else {
          patch.soundsEnabled = soundsEnabled;
        }

        if (typeof settings.errorSoundId === "string") {
          setErrorSoundIdState(settings.errorSoundId);
          writeStored(ERROR_SOUND_KEY, settings.errorSoundId);
        } else {
          patch.errorSoundId = errorSoundId;
        }

        if (typeof settings.completionSoundId === "string") {
          setCompletionSoundIdState(settings.completionSoundId);
          writeStored(COMPLETION_SOUND_KEY, settings.completionSoundId);
        } else {
          patch.completionSoundId = completionSoundId;
        }

        if (Object.keys(patch).length > 0) {
          api.put("/profile/settings", patch).catch(() => {
            // best-effort — next explicit change will retry this
          });
        }
      })
      .catch((err) => console.error("Couldn't load your saved sound settings:", err));
    // Deliberately only re-runs when the logged-in user changes (via the
    // ref guard above) — same reasoning as EnvironmentContext's effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function previewError() {
    const option = findSoundOption(ERROR_SOUND_OPTIONS, errorSoundId);
    if (option) playSound(option.url);
  }
  function previewCompletion() {
    const option = findSoundOption(COMPLETION_SOUND_OPTIONS, completionSoundId);
    if (option) playSound(option.url);
  }
  function playError() {
    if (soundsEnabled) previewError();
  }
  function playCompletion() {
    if (soundsEnabled) previewCompletion();
  }

  return (
    <SoundContext.Provider
      value={{
        soundsEnabled,
        errorSoundId,
        completionSoundId,
        setSoundsEnabled,
        setErrorSoundId,
        setCompletionSoundId,
        previewError,
        previewCompletion,
        playError,
        playCompletion,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within a SoundProvider");
  return ctx;
}
