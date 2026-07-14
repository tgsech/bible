import { ColorPaletteGrid } from "./ColorPaletteGrid";
import { FontPicker } from "./FontPicker";
import "./ThemeShowcase.css";

export function ThemeShowcase() {
  return (
    <section className="themeShowcase">
      <h2 className="themeShowcaseTitle">테마</h2>
      <div className="themeShowcaseColumns">
        <div className="themeShowcaseColumn">
          <h3 className="themeShowcaseSubtitle">Color Sets</h3>
          <ColorPaletteGrid />
        </div>
        <div className="themeShowcaseColumn">
          <h3 className="themeShowcaseSubtitle">Font</h3>
          <FontPicker />
        </div>
      </div>
    </section>
  );
}
