import "./Tabs.css";

export interface TabDef {
  id: string;
  label: string;
}

interface Props {
  tabs: TabDef[];
  activeId: string;
  onChange: (id: string) => void;
}

/**
 * Simple underline-style tab bar (bottom border on the container, active
 * tab inverted like the reference history page's Overview/Log toggle).
 * Purely presentational — the parent owns which panel is shown.
 */
export function Tabs({ tabs, activeId, onChange }: Props) {
  return (
    <div className="tabBar" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeId}
          className={`tabButton${tab.id === activeId ? " tabButton--active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
