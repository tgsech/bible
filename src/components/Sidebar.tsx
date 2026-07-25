import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { authClient, useSession } from "../lib/authClient";
import { useProgress } from "../hooks/useProgress";
import { useReadMode } from "../hooks/useReadMode";
import { useLanguage } from "../i18n/LanguageContext";
import "./Sidebar.css";

const COLLAPSED_KEY = "livingwords:sidebar-collapsed";
const DEFAULT_TYPE_ENGINE_PATH = "/read/krv-ko/genesis/1";

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function navClass({ isActive }: { isActive: boolean }) {
  return `sidebarLink${isActive ? " sidebarLink--active" : ""}`;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const { data: session } = useSession();
  const { getLatestProgress } = useProgress();
  const { readMode, setReadMode } = useReadMode();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, String(next));
      } catch {
        /* ignore - just won't survive a reload */
      }
      return next;
    });
  };

  // Jumps straight to whatever chapter this person was last typing in,
  // across every book/translation - defaulting to Genesis 1 in KRV for
  // anyone (guest or brand-new account) with no saved position yet.
  const handleTypeEngine = async () => {
    const latest = await getLatestProgress();
    navigate(latest ? `/read/${latest.translationId}/${latest.bookId}/${latest.chapter}` : DEFAULT_TYPE_ENGINE_PATH);
  };

  return (
    <nav className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <button
        type="button"
        className="sidebarToggle"
        onClick={toggleCollapsed}
        aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        aria-expanded={!collapsed}
      >
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div className="sidebarContent">
        <div className="sidebarGroup">
          <div className="sidebarProfileItem">
            <NavLink to="/profile" className={navClass}>
              <span className="sidebarLabel">{t("sidebar.profile")}</span>
            </NavLink>
            {session && (
              <button
                type="button"
                className="sidebarSignOut"
                onClick={() => authClient.signOut()}
                title={t("sidebar.signOut")}
              >
                {t("sidebar.signOut")}
              </button>
            )}
          </div>

          <NavLink to="/" end className={navClass}>
            <span className="sidebarLabel">{t("sidebar.home")}</span>
          </NavLink>
          <NavLink to="/leaderboard" className={navClass}>
            <span className="sidebarLabel">{t("sidebar.leaderboard")}</span>
          </NavLink>
          <NavLink to="/directory" className={navClass}>
            <span className="sidebarLabel">{t("sidebar.livworders")}</span>
          </NavLink>
          <button type="button" className="sidebarLink" onClick={handleTypeEngine}>
            <span className="sidebarLabel">{t("sidebar.typeEngine")}</span>
          </button>
          <NavLink to="/memory" className={navClass}>
            <span className="sidebarLabel">{t("sidebar.memTool")}</span>
          </NavLink>
          <NavLink to="/about" className={navClass}>
            <span className="sidebarLabel">{t("sidebar.about")}</span>
          </NavLink>
        </div>

        <button
          type="button"
          className="sidebarModeToggle"
          onClick={() => setReadMode(!readMode)}
          aria-pressed={readMode}
        >
          <span className="sidebarLabel">{readMode ? t("sidebar.reading") : t("sidebar.typing")}</span>
        </button>

        <div className="sidebarBottom">
          <div className="sidebarLangToggle" role="group" aria-label={t("sidebar.langToggleLabel")}>
            <button
              type="button"
              className={`sidebarLangOption${lang === "en" ? " sidebarLangOption--active" : ""}`}
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              {t("sidebar.langEnglish")}
            </button>
            <button
              type="button"
              className={`sidebarLangOption${lang === "ko" ? " sidebarLangOption--active" : ""}`}
              onClick={() => setLang("ko")}
              aria-pressed={lang === "ko"}
            >
              {t("sidebar.langKorean")}
            </button>
          </div>

          <NavLink to="/settings" className={navClass}>
            <span className="sidebarLabel">{t("sidebar.settings")}</span>
          </NavLink>
          <div className="sidebarBrand">
            <span className="sidebarLabel">{t("sidebar.brand")}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
