import type { TranslationMeta } from "../../types";

// NOTE: this is a demo with only Genesis 1-2 filled in. To add the rest of the
// book, add "03.json", "04.json"... under books/genesis/, and extend
// versesPerChapter to match (index 0 = chapter 1's verse count).
// Add more books the same way: a new folder under books/, plus an entry here.
export const meta: TranslationMeta = {
  id: "niv-en",
  language: "en",
  name: "New International Version",
  books: [
    {
      id: "genesis",
      name: "Genesis",
      versesPerChapter: [31, 25],
    },
  ],
};
