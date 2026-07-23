// Generates public/bible-meta.json — the single source of truth for "how
// many chapters does this translation have right now", consumed by the
// backend's leaderboard ("finished the whole Bible" board) over HTTP.
//
// Deliberately does NOT read meta.ts's `versesPerChapter` arrays. Those can
// drift from what chapter files actually exist (someone adds a chapter file
// and forgets to extend the array, or vice versa). Counting the actual
// `books/<book>/*.json` files on disk is the same thing loader.ts's
// `import.meta.glob` picks up, so this can never be out of sync with what
// the app can actually load and serve.
//
// Runs automatically before `dev` and `build` (see package.json's
// `predev`/`prebuild` scripts) — nobody needs to remember to run this by
// hand when a chapter or book is added.
import { readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
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
  if (!isDir(booksDir)) continue;

  let totalChapters = 0;
  for (const bookId of readdirSync(booksDir)) {
    const bookDir = join(booksDir, bookId);
    if (!isDir(bookDir)) continue;
    totalChapters += readdirSync(bookDir).filter((f) => f.endsWith(".json")).length;
  }

  entries.push({ id: translationId, totalChapters });
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(entries, null, 2) + "\n");

console.log(
  `Wrote ${outPath}:`,
  entries.map((e) => `${e.id}=${e.totalChapters}`).join(", ")
);
