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
      group: "구약성경",
      versesPerChapter: [31, 25],
    },
    {
      id: "psalms",
      name: "시편",
      group: "구약성경",
      versesPerChapter: [6, 12, 8],
    },

    {
      id: "eccles",
      name: "전도서",
      group: "구약성경",
      versesPerChapter: [18, 26, 22, 16, 20],
    },


  ],
};
