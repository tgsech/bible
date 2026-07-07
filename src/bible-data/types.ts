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
}

export interface ChapterData {
  verses: string[];
}
