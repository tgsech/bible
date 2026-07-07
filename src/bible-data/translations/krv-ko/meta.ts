import type { TranslationMeta } from "../../types";

// NOTE: demo with only Genesis 1 (full) and 2 (2 verses only, incomplete) filled in.
// Same extension pattern as niv-en/meta.ts applies here.
export const meta: TranslationMeta = {
  id: "krv-ko",
  language: "ko",
  name: "개역한글",
  books: [
    {
      id: "genesis",
      name: "창세기",
      versesPerChapter: [31, 2],
    },
    {
      id: "psalms",
      name: "시편",
      versesPerChapter: [6, 12],
    },

  ],
};
