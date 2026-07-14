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
];

// The two fonts already declared via @font-face in index.css.
export const FONTS: FontOption[] = [
  { id: "marubu", name: "MaruBuri", cssFontFamily: '"MaruBuri"' },
  { id: "ownglyph", name: "Ownglyph ParkDaHyun", cssFontFamily: '"OngleipParkDahyeon"' },
];
