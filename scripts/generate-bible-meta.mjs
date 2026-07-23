// Generates public/bible-meta.json — the single source of truth for "how
// many chapters does this translation have right now", consumed by the
// backend's leaderboard ("finished the whole Bible" board) over HTTP.
//
// For bundled translations, this deliberately does NOT read meta.ts's
// `versesPerChapter` arrays. Those can drift from what chapter files
// actually exist (someone adds a chapter file and forgets to extend the
// array, or vice versa). Counting the actual `books/<book>/*.json` files on
// disk is the same thing loader.ts's `import.meta.glob` picks up, so this
// can never be out of sync with what the app can actually load and serve.
//
// API-backed translations (see niv-en/meta.ts's `youVersionId`) have no
// `books/` directory at all - there's nothing on disk to count. For those,
// `chapter-counts.json` sitting next to meta.ts is the actual single
// source of truth (meta.ts imports the same file), so this script reads it
// directly instead. It's plain JSON rather than meta.ts itself because this
// script runs under plain `node`, which can't import a .ts file.
//
// Runs automatically before `dev` and `build` (see package.json's
// `predev`/`prebuild` scripts) — nobody needs to remember to run this by
// hand when a chapter or book is added.
import { readdirSync, statSync, existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const translationsDir = join(__dirname, "..", "src", "bible-data", "translations");
const outPath = join(__dirname, "..", "public", "bible-meta.json");

function isDir(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

const entries = [];

for (const translationId of readdirSync(translationsDir)) {
  const booksDir = join(translationsDir, translationId, "books");

  if (isDir(booksDir)) {
    let totalChapters = 0;
    for (const bookId of readdirSync(booksDir)) {
      const bookDir = join(booksDir, bookId);
      if (!isDir(bookDir)) continue;
      totalChapters += readdirSync(bookDir).filter((f) => f.endsWith(".json")).length;
    }
    entries.push({ id: translationId, totalChapters });
    continue;
  }

  const countsPath = join(translationsDir, translationId, "chapter-counts.json");
  if (!existsSync(countsPath)) continue; // not a translation dir at all

  const counts = JSON.parse(readFileSync(countsPath, "utf-8"));
  const totalChapters = Object.values(counts).reduce((sum, perChapter) => sum + perChapter.length, 0);
  entries.push({ id: translationId, totalChapters });
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(entries, null, 2) + "\n");

console.log(
  `Wrote ${outPath}:`,
  entries.map((e) => `${e.id}=${e.totalChapters}`).join(", ")
);
