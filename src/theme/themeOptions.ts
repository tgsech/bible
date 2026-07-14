export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    bg: string;
    text: string;
    correct: string;
    incorrect: string;
    untyped: string;
    cursor: string;
    composing: string;
  };
}

export interface FontOption {
  id: string;
  name: string;
  cssFontFamily: string;
}

// Deliberately a small, hand-picked list rather than an open color-builder -
// add more entries here as new palettes get designed. "Original" mirrors the
// app's current default look, so switching to it is a no-op visually.
export const PALETTES: ColorPalette[] = [
  {
    id: "original",
    name: "Original",
    colors: {
      bg: "#f1e4d2",
      text: "#1e3a5f",
      correct: "#000000",
      incorrect: "#d7c7ba",
      untyped: "#6f8cdc",
      cursor: "#000000",
      composing: "#001a47",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: {
      bg: "#242331",
      text: "#658E9C",
      correct: "#F2F4F3",
      incorrect: "#E85D75",
      untyped: "#6f8cdc",
      cursor: "#F2F4F3",
      composing: "#F2F4F3",
      },
  },
  {
    id: "light",
    name: "Light",
    colors: {
      bg: "#fafafa",
      text: "#000000",
      correct: "#484b6a",
      incorrect: "#BF3100",
      untyped: "#484b6a",
      cursor: "#484b6a",
      composing: "#484b6a",
      },
  },
  {
    id: "dark",
    name: "Dark",
    colors: {
      bg: "#121215",
      text: "#f7f7f8",
      correct: "#9394a5",
      incorrect: "#BF3100",
      untyped: "#e4e5f1",
      cursor: "#f7f7f8",
      composing: "#f7f7f8",
      },
  },

];

// The two fonts already declared via @font-face in index.css.
export const FONTS: FontOption[] = [
  { id: "marubu", name: "MaruBuri", cssFontFamily: '"MaruBuri"' },
  { id: "ownglyph", name: "Ownglyph ParkDaHyun", cssFontFamily: '"OngleipParkDahyeon"' },
  { id: "notosanskr", name: "Noto Sans KR", cssFontFamily: '"Noto Sans KR"' },
  { id: "nanumsqrneo", name: "Nanum Square Neo", cssFontFamily: '"NanumSquareNeo"' },
];
