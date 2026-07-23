import { useCallback, useEffect, useRef } from "react";
import { useSession } from "../lib/authClient";
import { api } from "../lib/api";

const GUEST_KEY = "livingwords:guest-reading-progress";
const SAVE_DEBOUNCE_MS = 800;

interface GuestEntry {
  translationId: string;
  bookId: string;
  chapter: number;
  updatedAt: number;
}

type GuestStore = Record<string, GuestEntry>; // key: "translationId:bookId"

const guestKey = (translationId: string, bookId: string) => `${translationId}:${bookId}`;

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
    store[guestKey(entry.translationId, entry.bookId)] = entry;
    localStorage.setItem(GUEST_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable — not fatal, just won't survive a reload
  }
}

function clearGuestStore() {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
}

// Same shape as useProgress (guest localStorage + debounced server save +
// merge-on-login), deliberately kept as a separate hook rather than a mode
// flag on useProgress — reading position hits a different table/endpoint
// (/api/reading-progress, one row per book, chapter-only) and mixing the
// two would mean every call site needs to know which table it's really
// touching.
export function useReadingProgress() {
  const { data: session } = useSession();
  const hasMergedRef = useRef(false);
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!session || hasMergedRef.current) return;
    hasMergedRef.current = true;

    const store = readGuestStore();
    const entries = Object.values(store);
    if (entries.length === 0) return;

    api
      .post("/reading-progress/merge", entries.map(({ updatedAt: _updatedAt, ...rest }) => rest))
      .then(() => clearGuestStore())
      .catch((err) => console.error("Failed to merge guest reading progress", err));
  }, [session]);

  const saveReadingPosition = useCallback(
    (translationId: string, bookId: string, chapter: number) => {
      writeGuestEntry({ translationId, bookId, chapter, updatedAt: Date.now() });
      if (!session) return;

      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(() => {
        api
          .put(`/reading-progress/${translationId}/${bookId}`, { chapter })
          .catch((err) => console.error("Failed to save reading progress", err));
      }, SAVE_DEBOUNCE_MS);
    },
    [session]
  );

  const loadReadingPosition = useCallback(
    async (translationId: string, bookId: string): Promise<number | null> => {
      if (session) {
        try {
          const server = await api.get<{ chapter: number }>(`/reading-progress/${translationId}/${bookId}`);
          if (server) return server.chapter;
        } catch (err) {
          console.error("Failed to load server reading progress", err);
        }
      }
      const guest = readGuestStore()[guestKey(translationId, bookId)];
      return guest ? guest.chapter : null;
    },
    [session]
  );

  return { saveReadingPosition, loadReadingPosition, isLoggedIn: !!session };
}
