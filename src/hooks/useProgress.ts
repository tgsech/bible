import { useCallback, useEffect, useRef } from "react";
import { useSession } from "../lib/authClient";
import { api } from "../lib/api";

const GUEST_KEY = "livingwords:guest-progress";
const SAVE_DEBOUNCE_MS = 800;

export interface ChapterPosition {
  verseIndex: number;
  typedSoFar: string;
  // Live wpm/accuracy baseline for this chapter as of this save - see
  // progress.ts's elapsedMs/correctKeystrokes/totalKeystrokes columns and
  // useTypingSession's baseElapsedMs. Optional so call sites that don't
  // care about the live-stat baseline (there are none left after this
  // change, but future callers might) aren't forced to supply it.
  elapsedMs?: number;
  correctKeystrokes?: number;
  totalKeystrokes?: number;
}

export interface LatestPosition {
  translationId: string;
  bookId: string;
  chapter: number;
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
  const { data: session, isPending: sessionPending } = useSession();
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
          if (server) {
            return {
              verseIndex: server.verseIndex,
              typedSoFar: server.typedSoFar,
              elapsedMs: server.elapsedMs,
              correctKeystrokes: server.correctKeystrokes,
              totalKeystrokes: server.totalKeystrokes,
            };
          }
        } catch (err) {
          console.error("Failed to load server progress", err);
        }
      }
      const guest = readGuestStore()[guestKey(translationId, bookId, chapter)];
      return guest
        ? {
            verseIndex: guest.verseIndex,
            typedSoFar: guest.typedSoFar,
            elapsedMs: guest.elapsedMs,
            correctKeystrokes: guest.correctKeystrokes,
            totalKeystrokes: guest.totalKeystrokes,
          }
        : null;
    },
    [session]
  );

  // Most recent "currently typing" position across every book - what the
  // sidebar's TYPE ENGINE shortcut jumps to. Server's /progress/latest wins
  // when logged in; for guests, the freshest entry in localStorage by
  // updatedAt. Returns null if this person has never typed anything yet.
  const getLatestProgress = useCallback(async (): Promise<LatestPosition | null> => {
    if (session) {
      try {
        const row = await api.get<LatestPosition>("/progress/latest");
        if (row) return row;
      } catch (err) {
        console.error("Failed to load latest progress", err);
      }
      return null;
    }

    const store = readGuestStore();
    const entries = Object.values(store);
    if (entries.length === 0) return null;

    const latest = entries.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a));
    return {
      translationId: latest.translationId,
      bookId: latest.bookId,
      chapter: latest.chapter,
      verseIndex: latest.verseIndex,
      typedSoFar: latest.typedSoFar,
    };
  }, [session]);

  // Exposed so callers that hydrate once-per-chapter (ReadPage) can hold
  // off calling loadProgress until this resolves. While it's true, `session`
  // is `null` regardless of whether the person is actually logged in - if
  // loadProgress ran during that window it would wrongly treat a logged-in
  // person as a guest, possibly returning null (if this specific device's
  // localStorage has no entry for that chapter) and resetting real,
  // server-side progress back to blank.
  return { saveProgress, loadProgress, getLatestProgress, isLoggedIn: !!session, sessionPending };
}
