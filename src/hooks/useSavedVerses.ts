import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "../lib/authClient";
import { api } from "../lib/api";

// Mirrors the backend's MAX_PUBLIC_SAVED_VERSES (routes/saved-verses.ts).
// Duplicated rather than imported since frontend/backend are separate
// packages with no shared module - the backend's PATCH /:id/public is the
// value that's actually enforced (see that file's comment); this constant
// only drives the frontend's own instant "3/3 used" feedback so someone
// isn't surprised by a 409 after tapping a toggle that looked available.
export const MAX_PUBLIC_SAVED_VERSES = 3;

export interface SavedVerse {
  id: string;
  translationId: string;
  bookId: string;
  chapter: number;
  verse: number; // 1-indexed, matches VerseRow's (index + 1)
  note: string | null;
  showOnPublicProfile: boolean;
  createdAt: string;
}

function bookmarkKey(translationId: string, bookId: string, chapter: number, verse: number): string {
  return `${translationId}:${bookId}:${chapter}:${verse}`;
}

/**
 * Bookmarking requires an account, same as progress - for guests every
 * lookup/action here is a no-op (isLoggedIn: false, findBookmark always
 * null) rather than falling back to a local guest store, per the product
 * decision that tap-to-bookmark should just silently do nothing when
 * signed out.
 */
export function useSavedVerses() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const [verses, setVerses] = useState<SavedVerse[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    if (!isLoggedIn) {
      setVerses([]);
      setLoaded(true);
      return;
    }
    api
      .get<SavedVerse[]>("/saved-verses")
      .then((rows) => setVerses(rows ?? []))
      .catch((err) => console.error("Failed to load bookmarked verses", err))
      .finally(() => setLoaded(true));
  }, [isLoggedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byKey = useMemo(() => {
    const map = new Map<string, SavedVerse>();
    for (const v of verses) {
      map.set(bookmarkKey(v.translationId, v.bookId, v.chapter, v.verse), v);
    }
    return map;
  }, [verses]);

  const findBookmark = useCallback(
    (translationId: string, bookId: string, chapter: number, verse: number): SavedVerse | null =>
      byKey.get(bookmarkKey(translationId, bookId, chapter, verse)) ?? null,
    [byKey]
  );

  const addBookmark = useCallback(
    async (translationId: string, bookId: string, chapter: number, verse: number) => {
      const row = await api.post<SavedVerse>("/saved-verses", { translationId, bookId, chapter, verse });
      if (row) setVerses((prev) => [row, ...prev]);
      return row;
    },
    []
  );

  const removeBookmark = useCallback(async (id: string) => {
    await api.delete(`/saved-verses/${id}`);
    setVerses((prev) => prev.filter((v) => v.id !== id));
  }, []);

  // Throws on a 409 (already at MAX_PUBLIC_SAVED_VERSES) - callers should
  // catch and surface that, since the frontend's own count check below is
  // only a best-effort mirror of the real server-side cap (see this file's
  // top comment).
  const togglePublic = useCallback(async (id: string, showOnPublicProfile: boolean) => {
    const row = await api.patch<SavedVerse>(`/saved-verses/${id}/public`, { showOnPublicProfile });
    if (row) setVerses((prev) => prev.map((v) => (v.id === id ? row : v)));
    return row;
  }, []);

  const featuredCount = useMemo(() => verses.filter((v) => v.showOnPublicProfile).length, [verses]);

  return {
    verses,
    loaded,
    isLoggedIn,
    findBookmark,
    addBookmark,
    removeBookmark,
    togglePublic,
    featuredCount,
    refresh,
  };
}
