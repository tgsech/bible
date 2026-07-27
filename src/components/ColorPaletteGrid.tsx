import { PALETTE_CATEGORIES, PALETTES, type ColorPalette } from "../theme/themeOptions";
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

function PaletteCard({ p, isSelected, onSelect }: { p: ColorPalette; isSelected: boolean; onSelect: () => void }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      className={`paletteCard${isSelected ? " paletteCard--selected" : ""}`}
      style={{ backgroundColor: p.colors.bg }}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className="paletteName" style={{ color: p.colors.correct }}>
        {p.name}
      </span>
      <div className="paletteSwatches">
        {SWATCH_FIELDS.map(({ key, labelKey }) => (
          <div key={key} className="paletteSwatch">
            <span className="paletteSwatchCircle" style={{ backgroundColor: p.colors[key] }} />
            <span className="paletteSwatchLabel" style={{ color: p.colors.correct }}>
              {t(labelKey)}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}

export function ColorPaletteGrid() {
  const { palette, setPaletteId } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="paletteCategories">
      {PALETTE_CATEGORIES.map((category) => {
        const palettesInCategory = category.paletteIds
          .map((id) => PALETTES.find((p) => p.id === id))
          .filter((p): p is ColorPalette => Boolean(p));

        if (palettesInCategory.length === 0) return null;

        return (
          <div key={category.id} className="paletteCategory">
            <h4 className="paletteCategoryTitle">{t(category.nameKey)}</h4>
            <div className="paletteCarousel">
              {palettesInCategory.map((p) => (
                <PaletteCard key={p.id} p={p} isSelected={p.id === palette.id} onSelect={() => setPaletteId(p.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
