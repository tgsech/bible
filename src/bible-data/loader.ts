import type { ChapterData } from "./types";
import { meta as nivEn } from "./translations/niv-en/meta";
import { USFM_BY_BOOK_ID } from "./usfmBookIds";

// Vite turns every matched file into its own lazily-loaded chunk.
// Nothing here is downloaded until a specific chapter is requested,
// so adding more books/translations never grows the initial bundle.
const chapterModules = import.meta.glob<{ default: ChapterData }>(
  "./translations/*/books/*/*.json"
);

const cache = new Map<string, ChapterData>();

function chapterPath(translationId: string, bookId: string, chapter: number) {
  const padded = String(chapter).padStart(2, "0");
  return `./translations/${translationId}/books/${bookId}/${padded}.json`;
}

// Translations with a `youVersionId` (see niv-en/meta.ts) have no bundled
// chapter files at all - their text is fetched live from the YouVersion
// Platform, through our own backend so the app key never reaches the
// browser. This keeps loadChapter's contract identical either way: callers
// (useChapter, ReadPage, the whole typing engine) just get back a
// Promise<ChapterData> and never need to know which path was taken.
const API_TRANSLATIONS: Record<string, true> = {
  [nivEn.id]: true,
};

const API_BASE = `${import.meta.env.VITE_API_URL ?? "http://localhost:8787"}/api`;

async function loadChapterFromApi(
  translationId: string,
  bookId: string,
  chapter: number
): Promise<ChapterData> {
  const usfm = USFM_BY_BOOK_ID[bookId];
  if (!usfm) {
    throw new Error(`No USFM code mapped for book "${bookId}" (see usfmBookIds.ts)`);
  }

  const res = await fetch(`${API_BASE}/bible/${translationId}/${usfm}/${chapter}`);
  if (!res.ok) {
    throw new Error(
      `Failed to load ${translationId} / ${bookId} / chapter ${chapter} (${res.status})`
    );
  }
  return res.json();
}

export async function loadChapter(
  translationId: string,
  bookId: string,
  chapter: number
): Promise<ChapterData> {
  const cacheKey = `${translationId}:${bookId}:${chapter}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (API_TRANSLATIONS[translationId]) {
    const data = await loadChapterFromApi(translationId, bookId, chapter);
    cache.set(cacheKey, data);
    return data;
  }

  const path = chapterPath(translationId, bookId, chapter);
  const importer = chapterModules[path];
  if (!importer) {
    throw new Error(
      `No chapter file found for ${translationId} / ${bookId} / chapter ${chapter} (expected ${path})`
    );
  }

  const mod = await importer();
  cache.set(cacheKey, mod.default);
  return mod.default;
}
