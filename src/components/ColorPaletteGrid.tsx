import { PALETTES } from "../theme/themeOptions";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";
import "./ColorPaletteGrid.css";

// Order matters here: these are the swatches shown on every palette card,
// in display order, each paired with its translation key and the palette
// color key it pulls from.
const SWATCH_FIELDS: { key: "text" | "correct" | "incorrect" | "untyped"; labelKey: string }[] = [
  { key: "text", labelKey: "palette.text" },
  { key: "correct", labelKey: "palette.correct" },
  { key: "incorrect", labelKey: "palette.incorrect" },
  { key: "untyped", labelKey: "palette.untyped" },
];

export function ColorPaletteGrid() {
  const { palette, setPaletteId } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="paletteGrid">
      {PALETTES.map((p) => {
        const isSelected = p.id === palette.id;
        return (
          <button
            key={p.id}
            type="button"
            className={`paletteCard${isSelected ? " paletteCard--selected" : ""}`}
            style={{ backgroundColor: p.colors.bg }}
            onClick={() => setPaletteId(p.id)}
            aria-pressed={isSelected}
          >
            <span className="paletteName" style={{ color: p.colors.text }}>
              {p.name}
            </span>
            <div className="paletteSwatches">
              {SWATCH_FIELDS.map(({ key, labelKey }) => (
                <div key={key} className="paletteSwatch">
                  <span className="paletteSwatchCircle" style={{ backgroundColor: p.colors[key] }} />
                  <span className="paletteSwatchLabel" style={{ color: p.colors.text }}>
                    {t(labelKey)}
                  </span>
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
