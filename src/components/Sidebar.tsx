import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { authClient, useSession } from "../lib/authClient";
import { useProgress } from "../hooks/useProgress";
import { useReadMode } from "../hooks/useReadMode";
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
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
              <span className="sidebarLabel">PROFILE</span>
            </NavLink>
            {session && (
              <button
                type="button"
                className="sidebarSignOut"
                onClick={() => authClient.signOut()}
                title="Sign out"
              >
                Sign out
              </button>
            )}
          </div>

          <NavLink to="/" end className={navClass}>
            <span className="sidebarLabel">HOME</span>
          </NavLink>
          <NavLink to="/leaderboard" className={navClass}>
            <span className="sidebarLabel">LEADERBOARD</span>
          </NavLink>
          <NavLink to="/directory" className={navClass}>
            <span className="sidebarLabel">LIVWORDERS</span>
          </NavLink>
          <button type="button" className="sidebarLink" onClick={handleTypeEngine}>
            <span className="sidebarLabel">TYPE ENGINE</span>
          </button>
          <NavLink to="/memory" className={navClass}>
            <span className="sidebarLabel">MEM TOOL</span>
          </NavLink>
          <NavLink to="/about" className={navClass}>
            <span className="sidebarLabel">ABOUT</span>
          </NavLink>
        </div>

        <button
          type="button"
          className="sidebarModeToggle"
          onClick={() => setReadMode(!readMode)}
          aria-pressed={readMode}
        >
          <span className="sidebarLabel">{readMode ? "READING" : "TYPING"}</span>
        </button>

        <div className="sidebarBottom">
          <NavLink to="/settings" className={navClass}>
            <span className="sidebarLabel">SETTINGS</span>
          </NavLink>
          <div className="sidebarBrand">
            <span className="sidebarLabel">LIVINGWORDS</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
