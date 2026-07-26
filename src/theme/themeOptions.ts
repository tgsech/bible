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
      },
  },  
  {
    id: "spring",
    name: "Spring",
    colors: {
      bg: "#d7a1a4",
      text: "#8d9c80",
      correct: "#fbeae9",
      incorrect: "#DA2C43",
      untyped: "#BC8F8F",
      cursor: "#808000",
      composing: "#808000",
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

  // 귀염s
  { id: "onkonkon", name: "Ongleip Konkon", cssFontFamily: '"OngleipKonkon"' },
  { id: "owngleippdh", name: "Ongleip Park Dahyeon", cssFontFamily: '"OngleipParkDahyeon"' },

  // 픽셀s
  { id: "umdot", name: "Umdot", cssFontFamily: '"Umdot"' },
];
