import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PALETTES, FONTS, type ColorPalette, type FontOption } from "./themeOptions";

interface ThemeContextValue {
  palette: ColorPalette;
  font: FontOption;
  setPaletteId: (id: string) => void;
  setFontId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [paletteId, setPaletteId] = useState(PALETTES[0].id);
  const [fontId, setFontId] = useState(FONTS[0].id);

  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0];

  // Writing to :root means every component that already reads these
  // variables (VerseRow's coloring, every themed .css file) picks up the
  // change with no per-component wiring.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--color-bg", palette.colors.bg);
    root.setProperty("--color-text", palette.colors.text);
    root.setProperty("--color-correct", palette.colors.correct);
    root.setProperty("--color-incorrect", palette.colors.incorrect);
    root.setProperty("--color-untyped", palette.colors.untyped);
    root.setProperty("--color-cursor", palette.colors.cursor);
    root.setProperty("--color-composing", palette.colors.composing);
  }, [palette]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-body", font.cssFontFamily);
  }, [font]);

  return (
    <ThemeContext.Provider value={{ palette, font, setPaletteId, setFontId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
