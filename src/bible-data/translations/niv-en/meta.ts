import type { TranslationMeta } from "../../types";
import chapterCounts from "./chapter-counts.json";

// NIV text itself is no longer bundled here - it's fetched live from the
// YouVersion Platform API via the backend's /api/bible route (see
// bible-data/loader.ts). `youVersionId` is what marks this translation as
// API-backed rather than static-file-backed; replace the placeholder below
// with your NIV Bible version id (look it up via `GET /v1/bibles` once
// you've accepted its license in the YouVersion dev dashboard).
//
// `versesPerChapter` counts still live here (sourced from
// chapter-counts.json) because they're just structural verse-numbering
// facts, not the licensed text - same as before, just pulled from a plain
// JSON sidecar so scripts/generate-bible-meta.mjs (plain Node, can't import
// this .ts file) can read the same numbers without duplicating them.
//
// To add more books: add their counts to chapter-counts.json and an entry
// here, same pattern as krv-ko's meta.ts.
export const meta: TranslationMeta = {
  id: "niv-en",
  language: "en",
  name: "New International Version",
  youVersionId: 111, 
  books: [
    {
      id: "genesis",
      name: "Genesis",
      group: "Old Testament",
      versesPerChapter: chapterCounts.genesis,
    },
    {
      id: "psalms",
      name: "Psalm",
      group: "Old Testament",
      versesPerChapter: chapterCounts.psalms,
    },
    {
      id: "proverbs",
      name: "Proverbs",
      group: "Old Testament",
      versesPerChapter: chapterCounts.proverbs,
    },
    {
      id: "john",
      name: "John",
      group: "New Testament",
      versesPerChapter: chapterCounts.john,
    },
  ],
};
