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
    // Bookmarked-verse highlight + underline (see VerseRow.tsx /
    // index.css's .bookmarkedVerse). Deliberately part of each palette's
    // own `colors` — so a bookmark's highlight can be tuned per-theme like
    // everything else here — but NOT one of ColorPaletteGrid's
    // SWATCH_FIELDS, so it never shows up as a 5th swatch on the palette
    // picker cards. Those cards are only meant to preview the four
    // palette-facing colors a person is actually choosing between; this is
    // just along for the ride on every palette object.
    bookmark: string;
    bookmarkUnderline: string;
  };
}

// Groups palettes for display on the settings page (see ColorPaletteGrid).
// Purely a presentation concern — doesn't affect ThemeContext/ThemeProvider,
// which only ever look palettes up by id. `paletteIds` controls both which
// palettes appear in a category and the order they're shown in.
export interface PaletteCategory {
  id: string;
  nameKey: string;
  paletteIds: string[];
}

export const PALETTE_CATEGORIES: PaletteCategory[] = [
  {
    id: "essentials",
    nameKey: "palette.category.essentials",
    paletteIds: ["original", "light", "dark", "midnight"],
  },
  {
    id: "cafe",
    nameKey: "palette.category.cafe",
    paletteIds: ["matcha", "butter", "coffee", "strawMilk", "apricotjoy"],
  },
  {
    id: "nature",
    nameKey: "palette.category.nature",
    paletteIds: ["azureskies", "pondLily", "dustSand", "spring", "octEven"],
  },
  {
    id: "dreamscape",
    nameKey: "palette.category.dreamscape",
    paletteIds: ["dreamCloud", "purpjade", "funkIDE"],
  },
];

export interface FontOption {
  id: string;
  name: string;
  cssFontFamily: string;
}

// Text size is a continuous scale rather than a fixed set of ids (unlike
// palette/font) — the number the person sees (a %) IS the value we store
// and apply, there's no lookup table to go through. Since every font-size
// in this app is already written in rem (see ThemeContext's root font-size
// effect), one multiplier here scales the whole app in proportion — a verse
// number at 1.5rem and a book title at 3rem both grow/shrink together,
// keeping their relative visual weight instead of flattening it.
export const TEXT_SCALE_MIN = 0.8;
export const TEXT_SCALE_MAX = 1.5;
export const TEXT_SCALE_STEP = 0.05;
export const TEXT_SCALE_DEFAULT = 1;

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
      bookmark: "#f0d7b3",
      bookmarkUnderline: "#9A9A9A",
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
      bookmark: "#80CBC4",
      bookmarkUnderline: "#5C6270",
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
      bookmark: "#484B6A",
      bookmarkUnderline: "#9f9fb6",
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
      bookmark: "#F5BB00",
      bookmarkUnderline: "#5A5A66",
      },
  },  
  {
    id: "matcha",
    name: "Matcha",
    colors: {
      bg: "#44624a",
      text: "#8ba888",
      correct: "#FFEFD5",
      incorrect: "#9F8170",
      untyped: "#03401E",
      cursor: "#8ba888",
      composing: "#8ba888",
      bookmark: "#f3f0c2",
      bookmarkUnderline: "#2E4632",
      },
  },  
  {
    id: "spring",
    name: "Spring",
    colors: {
      bg: "#d7a1a4",
      text: "#c3dfab",
      correct: "#fbeae9",
      incorrect: "#DA2C43",
      untyped: "#BC8F8F",
      cursor: "#808000",
      composing: "#808000",
      bookmark: "#9e595e",
      bookmarkUnderline: "#c5868d",
      },
  },  
  {
    id: "butter",
    name: "Butter",
    colors: {
      bg: "#fff4db",
      text: "#ffdf99",
      correct: "#e2a319",
      incorrect: "#9c3434",
      untyped: "#ffdf99",
      cursor: "#fdc243",
      composing: "#f8cc6c",
      bookmark: "#f2a65a",
      bookmarkUnderline: "#b3881e",
      },
  },
  {
    id: "coffee",
    name: "Coffee",
    colors: {
      bg: "#38220f",
      text: "#967259",
      correct: "#ece0d1",
      incorrect: "#E8AC41",
      untyped: "#634832",
      cursor: "#dbc1ac",
      composing: "#dbc1ac",
      bookmark: "#dbc1ac",
      bookmarkUnderline: "#7a614c",
      },
  },  
  {
    id: "azureskies",
    name: "Azure Skies",
    colors: {
      bg: "#50b8e7",
      text: "#ffffff",
      correct: "#edf7fc",
      incorrect: "#F5DEB3",
      untyped: "#84cdee",
      cursor: "#dcf0fa",
      composing: "#dcf0fa",
      bookmark: "#074a6e",
      bookmarkUnderline: "#3c7fa3",
      },
  },  
  {
    id: "purpjade",
    name: "Purple Jades",
    colors: {
      bg: "#887191",
      text: "#b8b8ff",
      correct: "#fff",
      incorrect: "#702963",
      untyped: "#a094c7",
      cursor: "#b8b8ff",
      composing: "#b8b8ff",
      bookmark: "#4d2072",
      bookmarkUnderline: "#5c4f66",
      },
  },  
  {
    id: "apricotjoy",
    name: "Apricot Joys",
    colors: {
      bg: "#f1ebe9",
      text: "#f9c6a4",
      correct: "#e4700c",
      incorrect: "#98817B",
      untyped: "#fcbc8a",
      cursor: "#ffb16d",
      composing: "#ffb16d",
      bookmark: "#b45d10",
      bookmarkUnderline: "#9C8175",
      },
  },
  {
    id: "octEven",
    name: "October Evening",
    colors: {
      bg: "#BE5B50",
      text: "#8A2D3B",
      correct: "#FBDB93",
      incorrect: "#960606",
      untyped: "#641B2E",
      cursor: "#e4b851",
      composing: "#e4b851",
      bookmark: "#e4b851",
      bookmarkUnderline: "#8f6401",
      },
  },
  {
    id: "dustSand",
    name: "Dusty Sand",
    colors: {
      bg: "#ccbca2",
      text: "#62557e",
      correct: "#c47e48",
      incorrect: "#c5d3c0",
      untyped: "#815b64",
      cursor: "#9385b1",
      composing: "#9385b1",
      bookmark: "#c49f89",
      bookmarkUnderline: "#c99595",
      },
  },
  {
    id: "dreamCloud",
    name: "Dreamy Clouds",
    colors: {
      bg: "#edf2fa",
      text: "#ccdbfd",
      correct: "#98b5f8",
      incorrect: "#f3a6c4",
      untyped: "#c7d8fd",
      cursor: "#6592fc",
      composing: "#6592fc",
      bookmark: "#576292",
      bookmarkUnderline: "#021464",
      },
  },
  {
    id: "strawMilk",
    name: "Strawberry Milk",
    colors: {
      bg: "#f3cad5",
      text: "#f7ebd9",
      correct: "#c94a62",
      incorrect: "#fff",
      untyped: "#e86982",
      cursor: "#9c2940",
      composing: "#9c2940",
      bookmark: "#e08295",
      bookmarkUnderline: "#fff",
      },
  },
  {
    id: "pondLily",
    name: "Pond Lilies",
    colors: {
      bg: "#82cea7",
      text: "#c0e9f2",
      correct: "#41806b",
      incorrect: "#83969c",
      untyped: "#a2d2e2",
      cursor: "#58af92",
      composing: "#58af92",
      bookmark: "#5cabca",
      bookmarkUnderline: "#45359e",
      },
  },
  {
    id: "funkIDE",
    name: "Funky IDE",
    colors: {
      bg: "#131b30",
      text: "#7affca",
      correct: "#fff",
      incorrect: "#c894eb",
      untyped: "#6d97f7",
      cursor: "#bbb8b8",
      composing: "#bbb8b8",
      bookmark: "#22345e",
      bookmarkUnderline: "#dbd02d",
      },
  },

];

export const FONTS: FontOption[] = [
  // 바탕s
  { id: "marubu", name: "Maru Buri", cssFontFamily: '"MaruBuri"' },
  { id: "choilmyung", name: "Chosun Ilbo Myungjo", cssFontFamily: '"ChosunIlboMyungjo"' },

  // 고딕s
  { id: "notosanskr", name: "Noto Sans KR", cssFontFamily: '"Noto Sans KR"' },
  { id: "nanumsqrneo", name: "Nanum Square Neo", cssFontFamily: '"NanumSquareNeo"' },

  // 코딩s
  { id: "d2code", name: "D2Coding", cssFontFamily: '"D2Coding"' },


  // 귀염s
  { id: "onkonkon", name: "Ongleip Konkon", cssFontFamily: '"OngleipKonkon"' },
  { id: "owngleippdh", name: "Ongleip Park Dahyeon", cssFontFamily: '"OngleipParkDahyeon"' },
  { id: "omudaye", name: "Omu Daye", cssFontFamily: '"OmuDaye"' },

  // 픽셀s
  { id: "umdot", name: "Umdot", cssFontFamily: '"Umdot"' },
];
