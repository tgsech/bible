import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { PALETTES, FONTS, type ColorPalette, type FontOption } from "./themeOptions";
import { api } from "../lib/api";
import { useSession } from "../lib/authClient";

interface ThemeContextValue {
  palette: ColorPalette;
  font: FontOption;
  setPaletteId: (id: string) => void;
  setFontId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const PALETTE_STORAGE_KEY = "theme:paletteId";
const FONT_STORAGE_KEY = "theme:fontId";

interface ThemeSettings {
  themeId: string | null;
  fontId: string | null;
}

// localStorage is what makes this work for guests (and gives everyone an
// instant, no-network initial paint instead of a flash of default theme
// while a logged-in user's settings are still in flight). Reading it
// synchronously in useState's initializer, rather than in an effect, is
// what avoids that flash.
function readStored(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback; // localStorage can throw in some locked-down contexts
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore — worst case, the choice just doesn't survive a reload
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [paletteId, setPaletteIdState] = useState(() => readStored(PALETTE_STORAGE_KEY, PALETTES[0].id));
  const [fontId, setFontIdState] = useState(() => readStored(FONT_STORAGE_KEY, FONTS[0].id));

  // Guards the one-time "load whatever the backend has, sync a guest's
  // local choice up on first login" exchange below so it runs once per
  // login rather than once per render.
  const syncedForUserId = useRef<string | null>(null);

  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0];

  // Setting a palette/font always updates local state + localStorage
  // (instant, works offline, works for guests), and additionally pushes to
  // the backend when logged in so it follows the person to other devices.
  // The backend doesn't validate the id against a known set (see
  // routes/profile.ts) so there's nothing to await or handle here beyond a
  // console warning if the request itself fails.
  function setPaletteId(id: string) {
    setPaletteIdState(id);
    writeStored(PALETTE_STORAGE_KEY, id);
    if (session) {
      api.put("/profile/settings", { themeId: id }).catch((err) => {
        console.error("Couldn't sync theme to your account:", err);
      });
    }
  }

  function setFontId(id: string) {
    setFontIdState(id);
    writeStored(FONT_STORAGE_KEY, id);
    if (session) {
      api.put("/profile/settings", { fontId: id }).catch((err) => {
        console.error("Couldn't sync font to your account:", err);
      });
    }
  }

  // On login: the backend's saved theme/font wins if it has one (that's
  // the "follow me across devices" case). If it doesn't — first time this
  // account has ever logged in anywhere — push up whatever was picked
  // locally as a guest, so it's there next time they sign in elsewhere.
  useEffect(() => {
    if (!session || syncedForUserId.current === session.user.id) return;
    syncedForUserId.current = session.user.id;

    api
      .get<ThemeSettings>("/profile/settings")
      .then((settings) => {
        if (!settings) return;
        const patch: { themeId?: string; fontId?: string } = {};

        if (settings.themeId && PALETTES.some((p) => p.id === settings.themeId)) {
          setPaletteIdState(settings.themeId);
          writeStored(PALETTE_STORAGE_KEY, settings.themeId);
        } else if (!settings.themeId) {
          patch.themeId = paletteId;
        }

        if (settings.fontId && FONTS.some((f) => f.id === settings.fontId)) {
          setFontIdState(settings.fontId);
          writeStored(FONT_STORAGE_KEY, settings.fontId);
        } else if (!settings.fontId) {
          patch.fontId = fontId;
        }

        if (Object.keys(patch).length > 0) {
          api.put("/profile/settings", patch).catch(() => {
            // best-effort — next explicit theme/font change will retry this
          });
        }
      })
      .catch((err) => console.error("Couldn't load your saved theme:", err));
    // Deliberately only re-runs when the logged-in user changes (via the
    // ref guard above) — paletteId/fontId are read here but shouldn't
    // re-trigger this exchange on every theme change, that's what the
    // setters' own backend push is for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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
