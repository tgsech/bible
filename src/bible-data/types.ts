export interface BookMeta {
  id: string; // e.g. "genesis" — used in file paths, must be stable
  name: string; // display name in this translation's language, e.g. "Genesis" / "창세기"
  group: string; // dropdown grouping label, e.g. "Old Testament" / "구약성경"
  versesPerChapter: number[]; // index 0 = chapter 1's verse count, etc.
}

export interface TranslationMeta {
  id: string; // e.g. "niv-en" — used in file paths, must be stable
  language: "en" | "ko" | string;
  name: string; // e.g. "New International Version"
  books: BookMeta[];
  // Present only for translations served live from the YouVersion Platform
  // API instead of bundled JSON files (see bible-data/loader.ts and the
  // backend's /api/bible route). When set, this is the YouVersion "Bible
  // version" id to request - find it via `GET /v1/bibles` once you've
  // accepted that version's license in the YouVersion dev dashboard.
  youVersionId?: number;
}

export interface ChapterData {
  verses: string[];
}
