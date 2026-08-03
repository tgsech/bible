import { createContext, useContext, useState, type ReactNode } from "react";
import { ERROR_SOUND_OPTIONS, COMPLETION_SOUND_OPTIONS, findSoundOption, playSound } from "./sounds";

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

// Local-only for now (no backend field exists yet for these) - same
// localStorage-first approach as EnvironmentContext, just without the
// account-sync step, so this at least survives a reload and works for
// guests immediately.
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

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundsEnabled, setSoundsEnabledState] = useState(() => readStoredBool(SOUNDS_ENABLED_KEY, true));
  const [errorSoundId, setErrorSoundIdState] = useState<string | null>(
    () => readStoredString(ERROR_SOUND_KEY) ?? ERROR_SOUND_OPTIONS[0]?.id ?? null
  );
  const [completionSoundId, setCompletionSoundIdState] = useState<string | null>(
    () => readStoredString(COMPLETION_SOUND_KEY) ?? COMPLETION_SOUND_OPTIONS[0]?.id ?? null
  );

  function setSoundsEnabled(value: boolean) {
    setSoundsEnabledState(value);
    writeStored(SOUNDS_ENABLED_KEY, String(value));
  }
  function setErrorSoundId(id: string | null) {
    setErrorSoundIdState(id);
    writeStored(ERROR_SOUND_KEY, id ?? "");
  }
  function setCompletionSoundId(id: string | null) {
    setCompletionSoundIdState(id);
    writeStored(COMPLETION_SOUND_KEY, id ?? "");
  }

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
