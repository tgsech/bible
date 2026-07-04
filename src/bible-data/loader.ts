import type { ChapterData } from "./types";

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

export async function loadChapter(
  translationId: string,
  bookId: string,
  chapter: number
): Promise<ChapterData> {
  const cacheKey = `${translationId}:${bookId}:${chapter}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

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
