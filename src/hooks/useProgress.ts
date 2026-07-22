import { useCallback, useEffect, useRef } from "react";
import { useSession } from "../lib/authClient";
import { api } from "../lib/api";

const GUEST_KEY = "livingwords:guest-progress";
const SAVE_DEBOUNCE_MS = 800;

export interface ChapterPosition {
  verseIndex: number;
  typedSoFar: string;
}

interface GuestEntry extends ChapterPosition {
  translationId: string;
  bookId: string;
  chapter: number;
  updatedAt: number;
}

type GuestStore = Record<string, GuestEntry>; // key: "translationId:bookId:chapter"

const guestKey = (translationId: string, bookId: string, chapter: number) =>
  `${translationId}:${bookId}:${chapter}`;

function readGuestStore(): GuestStore {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeGuestEntry(entry: GuestEntry) {
  try {
    const store = readGuestStore();
    store[guestKey(entry.translationId, entry.bookId, entry.chapter)] = entry;
    localStorage.setItem(GUEST_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable (private browsing, quota) — not fatal,
    // progress just won't survive a reload for this guest
  }
}

function clearGuestStore() {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
}

export function useProgress() {
  const { data: session } = useSession();
  const hasMergedRef = useRef(false);
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  // Fires once, right after a session first appears. Pushes every chapter
  // sitting in localStorage; the backend only applies entries for chapters
  // that don't already have saved progress on the account, so this is safe
  // to fire on every login, not just the very first one.
  useEffect(() => {
    if (!session || hasMergedRef.current) return;
    hasMergedRef.current = true;

    const store = readGuestStore();
    const entries = Object.values(store);
    if (entries.length === 0) return;

    api
      .post("/progress/merge", entries.map(({ updatedAt: _updatedAt, ...rest }) => rest))
      .then(() => clearGuestStore())
      .catch((err) => console.error("Failed to merge guest progress", err));
  }, [session]);

  // Always writes to localStorage immediately (guests never lose their
  // spot even without an account). If logged in, also debounce-saves to
  // the server for this specific chapter — saving Exodus never touches
  // whatever's saved for Genesis, since each chapter is its own row.
  const saveProgress = useCallback(
    (translationId: string, bookId: string, chapter: number, position: ChapterPosition) => {
      writeGuestEntry({ translationId, bookId, chapter, ...position, updatedAt: Date.now() });
      if (!session) return;

      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(() => {
        api
          .put(`/progress/${translationId}/${bookId}/${chapter}`, position)
          .catch((err) => console.error("Failed to save progress", err));
      }, SAVE_DEBOUNCE_MS);
    },
    [session]
  );

  // Saved position for one specific chapter — this is what ReadPage calls
  // on mount to decide whether to resume mid-chapter. Server copy wins
  // when logged in (a second device may have moved further); guest copy
  // otherwise.
  const loadProgress = useCallback(
    async (translationId: string, bookId: string, chapter: number): Promise<ChapterPosition | null> => {
      if (session) {
        try {
          const server = await api.get<ChapterPosition>(`/progress/${translationId}/${bookId}/${chapter}`);
          if (server) return { verseIndex: server.verseIndex, typedSoFar: server.typedSoFar };
        } catch (err) {
          console.error("Failed to load server progress", err);
        }
      }
      const guest = readGuestStore()[guestKey(translationId, bookId, chapter)];
      return guest ? { verseIndex: guest.verseIndex, typedSoFar: guest.typedSoFar } : null;
    },
    [session]
  );

  return { saveProgress, loadProgress, isLoggedIn: !!session };
}
