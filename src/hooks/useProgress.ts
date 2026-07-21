import { useCallback, useEffect, useRef } from "react";
import { useSession } from "../lib/authClient";
import { api } from "../lib/api";

const GUEST_KEY = "livingwords:guest-progress";
const SAVE_DEBOUNCE_MS = 800;

interface ProgressPosition {
  translationId: string;
  bookId: string;
  chapter: number;
  verseIndex: number;
}

function readGuestProgress(): ProgressPosition | null {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // localStorage unavailable (private browsing, quota, etc.)
  }
}

function writeGuestProgress(position: ProgressPosition) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(position));
  } catch {
    // not fatal — progress just won't survive a reload for this guest
  }
}

export function useProgress() {
  const { data: session } = useSession();
  const hasMergedRef = useRef(false);
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  // Runs once, the moment a session first appears (i.e. right after
  // sign-in). Sends whatever was sitting in localStorage; the backend only
  // applies it if the account has no saved progress yet, so this is safe
  // to fire unconditionally on every login, not just the first one.
  useEffect(() => {
    if (!session || hasMergedRef.current) return;
    hasMergedRef.current = true;

    const guest = readGuestProgress();
    if (guest) {
      api.post("/progress/merge", guest).catch((err) => {
        console.error("Failed to merge guest progress", err);
      });
    }
  }, [session]);

  // Always writes to localStorage immediately (so guests never lose their
  // spot), and — only if logged in — also debounces a save to the server so
  // rapid verse-by-verse advances don't fire a request each time.
  const saveProgress = useCallback(
    (position: ProgressPosition) => {
      writeGuestProgress(position);
      if (!session) return;

      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(() => {
        api.put("/progress", position).catch((err) => {
          console.error("Failed to save progress", err);
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [session]
  );

  // For a future "continue where you left off" on the landing page: prefers
  // the server's copy when logged in, falls back to the guest copy
  // otherwise. Not wired into any UI yet — safe to call whenever that lands.
  const loadProgress = useCallback(async (): Promise<ProgressPosition | null> => {
    if (session) {
      try {
        const serverProgress = await api.get<ProgressPosition>("/progress");
        if (serverProgress) return serverProgress;
      } catch (err) {
        console.error("Failed to load server progress", err);
      }
    }
    return readGuestProgress();
  }, [session]);

  return { saveProgress, loadProgress, isLoggedIn: !!session };
}
