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
      bg: "#F1E4D2",
      text: "#A28F79",
      correct: "#1E3A5F",
      incorrect: "#D32F2F",
      untyped: "#6F8CDC",
      cursor: "#1E3A5F",
      composing: "#0B2240",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: {
      bg: "#181824",
      text: "#41495A",
      correct: "#F2F4F3",
      incorrect: "#FF5370",
      untyped: "#658E9C",
      cursor: "#80CBC4",
      composing: "#FFCB6B",
      },
  },
  {
    id: "light",
    name: "Light",
    colors: {
      bg: "#FAFAFA",
      text: "#B0B0B0",
      correct: "#1F2232",
      incorrect: "#E53935",
      untyped: "#6C7293",
      cursor: "#484B6A",
      composing: "#25283B",
      },
  },
  {
    id: "dark",
    name: "Dark",
    colors: {
      bg: "#121215",
      text: "#4A4A5A",
      correct: "#F7F7F8",
      incorrect: "#FF4A4A",
      untyped: "#8A8B9A",
      cursor: "#F5BB00",
      composing: "#F5BB00",
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
