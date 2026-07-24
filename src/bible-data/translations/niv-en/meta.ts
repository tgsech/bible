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
// All 66 books are listed below; chapter/verse counts sourced from
// NIV2011.bdb (structural counts only, not the licensed text itself).
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
      id: "exodus",
      name: "Exodus",
      group: "Old Testament",
      versesPerChapter: chapterCounts.exodus,
    },
    {
      id: "leviticus",
      name: "Leviticus",
      group: "Old Testament",
      versesPerChapter: chapterCounts.leviticus,
    },
    {
      id: "numbers",
      name: "Numbers",
      group: "Old Testament",
      versesPerChapter: chapterCounts.numbers,
    },
    {
      id: "deuteronomy",
      name: "Deuteronomy",
      group: "Old Testament",
      versesPerChapter: chapterCounts.deuteronomy,
    },
    {
      id: "joshua",
      name: "Joshua",
      group: "Old Testament",
      versesPerChapter: chapterCounts.joshua,
    },
    {
      id: "judges",
      name: "Judges",
      group: "Old Testament",
      versesPerChapter: chapterCounts.judges,
    },
    {
      id: "ruth",
      name: "Ruth",
      group: "Old Testament",
      versesPerChapter: chapterCounts.ruth,
    },
    {
      id: "1samuel",
      name: "1 Samuel",
      group: "Old Testament",
      versesPerChapter: chapterCounts["1samuel"],
    },
    {
      id: "2samuel",
      name: "2 Samuel",
      group: "Old Testament",
      versesPerChapter: chapterCounts["2samuel"],
    },
    {
      id: "1kings",
      name: "1 Kings",
      group: "Old Testament",
      versesPerChapter: chapterCounts["1kings"],
    },
    {
      id: "2kings",
      name: "2 Kings",
      group: "Old Testament",
      versesPerChapter: chapterCounts["2kings"],
    },
    {
      id: "1chronicles",
      name: "1 Chronicles",
      group: "Old Testament",
      versesPerChapter: chapterCounts["1chronicles"],
    },
    {
      id: "2chronicles",
      name: "2 Chronicles",
      group: "Old Testament",
      versesPerChapter: chapterCounts["2chronicles"],
    },
    {
      id: "ezra",
      name: "Ezra",
      group: "Old Testament",
      versesPerChapter: chapterCounts.ezra,
    },
    {
      id: "nehemiah",
      name: "Nehemiah",
      group: "Old Testament",
      versesPerChapter: chapterCounts.nehemiah,
    },
    {
      id: "esther",
      name: "Esther",
      group: "Old Testament",
      versesPerChapter: chapterCounts.esther,
    },
    {
      id: "job",
      name: "Job",
      group: "Old Testament",
      versesPerChapter: chapterCounts.job,
    },
    {
      id: "psalms",
      name: "Psalms",
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
      id: "ecclesiastes",
      name: "Ecclesiastes",
      group: "Old Testament",
      versesPerChapter: chapterCounts.ecclesiastes,
    },
    {
      id: "songofsongs",
      name: "Song of Songs",
      group: "Old Testament",
      versesPerChapter: chapterCounts.songofsongs,
    },
    {
      id: "isaiah",
      name: "Isaiah",
      group: "Old Testament",
      versesPerChapter: chapterCounts.isaiah,
    },
    {
      id: "jeremiah",
      name: "Jeremiah",
      group: "Old Testament",
      versesPerChapter: chapterCounts.jeremiah,
    },
    {
      id: "lamentations",
      name: "Lamentations",
      group: "Old Testament",
      versesPerChapter: chapterCounts.lamentations,
    },
    {
      id: "ezekiel",
      name: "Ezekiel",
      group: "Old Testament",
      versesPerChapter: chapterCounts.ezekiel,
    },
    {
      id: "daniel",
      name: "Daniel",
      group: "Old Testament",
      versesPerChapter: chapterCounts.daniel,
    },
    {
      id: "hosea",
      name: "Hosea",
      group: "Old Testament",
      versesPerChapter: chapterCounts.hosea,
    },
    {
      id: "joel",
      name: "Joel",
      group: "Old Testament",
      versesPerChapter: chapterCounts.joel,
    },
    {
      id: "amos",
      name: "Amos",
      group: "Old Testament",
      versesPerChapter: chapterCounts.amos,
    },
    {
      id: "obadiah",
      name: "Obadiah",
      group: "Old Testament",
      versesPerChapter: chapterCounts.obadiah,
    },
    {
      id: "jonah",
      name: "Jonah",
      group: "Old Testament",
      versesPerChapter: chapterCounts.jonah,
    },
    {
      id: "micah",
      name: "Micah",
      group: "Old Testament",
      versesPerChapter: chapterCounts.micah,
    },
    {
      id: "nahum",
      name: "Nahum",
      group: "Old Testament",
      versesPerChapter: chapterCounts.nahum,
    },
    {
      id: "habakkuk",
      name: "Habakkuk",
      group: "Old Testament",
      versesPerChapter: chapterCounts.habakkuk,
    },
    {
      id: "zephaniah",
      name: "Zephaniah",
      group: "Old Testament",
      versesPerChapter: chapterCounts.zephaniah,
    },
    {
      id: "haggai",
      name: "Haggai",
      group: "Old Testament",
      versesPerChapter: chapterCounts.haggai,
    },
    {
      id: "zechariah",
      name: "Zechariah",
      group: "Old Testament",
      versesPerChapter: chapterCounts.zechariah,
    },
    {
      id: "malachi",
      name: "Malachi",
      group: "Old Testament",
      versesPerChapter: chapterCounts.malachi,
    },
    {
      id: "matthew",
      name: "Matthew",
      group: "New Testament",
      versesPerChapter: chapterCounts.matthew,
    },
    {
      id: "mark",
      name: "Mark",
      group: "New Testament",
      versesPerChapter: chapterCounts.mark,
    },
    {
      id: "luke",
      name: "Luke",
      group: "New Testament",
      versesPerChapter: chapterCounts.luke,
    },
    {
      id: "john",
      name: "John",
      group: "New Testament",
      versesPerChapter: chapterCounts.john,
    },
    {
      id: "acts",
      name: "Acts",
      group: "New Testament",
      versesPerChapter: chapterCounts.acts,
    },
    {
      id: "romans",
      name: "Romans",
      group: "New Testament",
      versesPerChapter: chapterCounts.romans,
    },
    {
      id: "1corinthians",
      name: "1 Corinthians",
      group: "New Testament",
      versesPerChapter: chapterCounts["1corinthians"],
    },
    {
      id: "2corinthians",
      name: "2 Corinthians",
      group: "New Testament",
      versesPerChapter: chapterCounts["2corinthians"],
    },
    {
      id: "galatians",
      name: "Galatians",
      group: "New Testament",
      versesPerChapter: chapterCounts.galatians,
    },
    {
      id: "ephesians",
      name: "Ephesians",
      group: "New Testament",
      versesPerChapter: chapterCounts.ephesians,
    },
    {
      id: "philippians",
      name: "Philippians",
      group: "New Testament",
      versesPerChapter: chapterCounts.philippians,
    },
    {
      id: "colossians",
      name: "Colossians",
      group: "New Testament",
      versesPerChapter: chapterCounts.colossians,
    },
    {
      id: "1thessalonians",
      name: "1 Thessalonians",
      group: "New Testament",
      versesPerChapter: chapterCounts["1thessalonians"],
    },
    {
      id: "2thessalonians",
      name: "2 Thessalonians",
      group: "New Testament",
      versesPerChapter: chapterCounts["2thessalonians"],
    },
    {
      id: "1timothy",
      name: "1 Timothy",
      group: "New Testament",
      versesPerChapter: chapterCounts["1timothy"],
    },
    {
      id: "2timothy",
      name: "2 Timothy",
      group: "New Testament",
      versesPerChapter: chapterCounts["2timothy"],
    },
    {
      id: "titus",
      name: "Titus",
      group: "New Testament",
      versesPerChapter: chapterCounts.titus,
    },
    {
      id: "philemon",
      name: "Philemon",
      group: "New Testament",
      versesPerChapter: chapterCounts.philemon,
    },
    {
      id: "hebrews",
      name: "Hebrews",
      group: "New Testament",
      versesPerChapter: chapterCounts.hebrews,
    },
    {
      id: "james",
      name: "James",
      group: "New Testament",
      versesPerChapter: chapterCounts.james,
    },
    {
      id: "1peter",
      name: "1 Peter",
      group: "New Testament",
      versesPerChapter: chapterCounts["1peter"],
    },
    {
      id: "2peter",
      name: "2 Peter",
      group: "New Testament",
      versesPerChapter: chapterCounts["2peter"],
    },
    {
      id: "1john",
      name: "1 John",
      group: "New Testament",
      versesPerChapter: chapterCounts["1john"],
    },
    {
      id: "2john",
      name: "2 John",
      group: "New Testament",
      versesPerChapter: chapterCounts["2john"],
    },
    {
      id: "3john",
      name: "3 John",
      group: "New Testament",
      versesPerChapter: chapterCounts["3john"],
    },
    {
      id: "jude",
      name: "Jude",
      group: "New Testament",
      versesPerChapter: chapterCounts.jude,
    },
    {
      id: "revelation",
      name: "Revelation",
      group: "New Testament",
      versesPerChapter: chapterCounts.revelation,
    },
  ],
};
