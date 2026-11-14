import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { VERSE_NUMBERS } from "./passage";
import { PASS_SCORE, estimate, daysUntilContest, useMemory, useMemoryAccountSync, verseState, type LangState } from "./store";
import { fmtMinutes } from "./text";
import "./memory.css";

/** While a typing screen is up on a phone, tracks the part of the screen
 *  that is actually visible above the on-screen keyboard and publishes it
 *  as CSS variables, so the screen can be laid out to fit exactly that
 *  space (see .memFocus in memory.css). iOS Safari doesn't resize the page
 *  for the keyboard - it slides the visual viewport instead - so both its
 *  height and its offset are followed. */
function useFocusViewport(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const vv = window.visualViewport;
    const root = document.documentElement;
    let tallest = 0;
    const apply = () => {
      const height = vv ? vv.height : window.innerHeight;
      tallest = Math.max(tallest, height);
      root.style.setProperty("--mem-vv-height", `${height}px`);
      root.style.setProperty("--mem-vv-top", `${vv ? vv.offsetTop : 0}px`);
      // Noticeably shorter than the tallest we've seen = keyboard is up.
      root.classList.toggle("memKeyboardOpen", height < tallest - 120);
    };
    const reset = () => {
      tallest = 0;
      apply();
    };
    apply();
    root.classList.add("memFocusActive");
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", reset);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", reset);
      root.classList.remove("memFocusActive", "memKeyboardOpen");
      root.style.removeProperty("--mem-vv-height");
      root.style.removeProperty("--mem-vv-top");
    };
  }, [active]);
}

/** Page frame every mode shares: back link, title, one-line how-to.
 *
 *  `focus` marks a screen where the user is typing. On a desktop it
 *  changes nothing. On a phone the page becomes a full-screen, app-style
 *  layout sized to the space above the keyboard: a slim top bar, a
 *  scrolling middle (.memFocusBody) and the input pinned to the bottom
 *  (.memFocusDock) - so the text box is never hidden behind the keyboard
 *  and the page never has to scroll or zoom to reach it. */
export function ModeShell({
  mode,
  focus = false,
  onExitFocus,
  children,
}: {
  mode: string;
  focus?: boolean;
  /** What the top bar's close button does in the phone layout (default: back to the hub). */
  onExitFocus?: () => void;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  useMemoryAccountSync();
  useFocusViewport(focus);
  return (
    <div id="mainBody" className={`memPage${focus ? " memFocus" : ""}`}>
      {focus && (
        <div className="memFocusBar">
          <button
            type="button"
            className="memFocusClose"
            aria-label={t("memory.close")}
            onClick={onExitFocus ?? (() => navigate("/memory"))}
          >
            ✕
          </button>
          <span className="memFocusTitle">{t(`memory.mode.${mode}.name`)}</span>
        </div>
      )}
      <Link to="/memory" className="memBack">
        ← {t("memory.back")}
      </Link>
      <h1 className="memModeTitle">{t(`memory.mode.${mode}.name`)}</h1>
      <p className="memLead">{t(`memory.mode.${mode}.howto`, { pass: PASS_SCORE })}</p>
      {children}
    </div>
  );
}

export function Meter({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="memMeter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className="memMeterFill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Verse chips, each tinted by how well that verse is known. */
export function VersePicker({
  value,
  onChange,
  allowAll = false,
}: {
  value: number | "all";
  onChange: (v: number | "all") => void;
  allowAll?: boolean;
}) {
  const { t } = useLanguage();
  const { ls } = useMemory();
  return (
    <div className="memVersePicker" role="group" aria-label={t("memory.pickVerse")}>
      {VERSE_NUMBERS.map((v) => (
        <button
          key={v}
          type="button"
          className={`memVerseChip${value === v ? " isActive" : ""}`}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
        >
          <span className="memVerseChipFill" style={{ height: `${Math.round(verseState(ls, v).m)}%` }} />
          <span className="memVerseChipLabel">{v}</span>
        </button>
      ))}
      {allowAll && (
        <button
          type="button"
          className={`memVerseChip memVerseChip--all${value === "all" ? " isActive" : ""}`}
          aria-pressed={value === "all"}
          onClick={() => onChange("all")}
        >
          <span className="memVerseChipLabel">{t("memory.all")}</span>
        </button>
      )}
    </div>
  );
}

/** The verse with the words you missed marked. */
export function DiffView({ tokens, marks }: { tokens: string[]; marks: boolean[] }) {
  return (
    <p className="memDiff">
      {tokens.map((w, i) => (
        <span key={i} className={marks[i] ? "memHit" : "memMiss"}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}

/** Free-typing box for a whole verse. Uncontrolled on purpose: Korean IME
 *  composition stays entirely native, and we only read the text on
 *  submit. Enter submits (Shift+Enter for a line break); if a syllable is
 *  still being composed, we wait for the IME to commit it first. */
export function TypeAttempt({
  onSubmit,
  submitLabel,
  placeholder,
}: {
  onSubmit: (text: string) => void;
  submitLabel: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const enterPending = useRef(false);
  const submit = () => {
    const el = ref.current;
    if (!el || el.value.trim() === "") return;
    const text = el.value;
    el.value = "";
    onSubmit(text);
    // Stay in the box: on a phone, losing focus would drop the keyboard
    // and it can't be reopened without another tap.
    el.focus();
  };
  return (
    <div className="memAttempt">
      <textarea
        ref={ref}
        className="memTextarea"
        rows={4}
        autoFocus
        enterKeyHint="done"
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (e.nativeEvent.isComposing) enterPending.current = true;
            else submit();
          }
        }}
        onCompositionEnd={() => {
          if (!enterPending.current) return;
          enterPending.current = false;
          submit();
        }}
      />
      <button
        type="button"
        className="memButton memButton--primary"
        // Keep focus (and the phone keyboard) in the textarea when tapped.
        onPointerDown={(e) => e.preventDefault()}
        onClick={submit}
      >
        {submitLabel}
      </button>
    </div>
  );
}

/** "About N more minutes at your pace" + what that means per day before
 *  the contest. */
export function PaceNote({ ls }: { ls: LangState }) {
  const { t } = useLanguage();
  const [now] = useState(() => Date.now());
  const est = estimate(ls, now);
  const daysLeft = daysUntilContest(now);
  if (est.kind === "none") return <p className="memPace">{t("memory.pace.none")}</p>;
  if (est.kind === "done") return <p className="memPace">{t("memory.pace.done")}</p>;
  return (
    <p className="memPace">
      {t("memory.pace.estimate", { time: fmtMinutes(est.remainingMin, t) })}{" "}
      {est.perDayMin !== null
        ? t("memory.pace.perDay", { days: daysLeft, time: fmtMinutes(est.perDayMin, t) })
        : t("memory.pace.late")}
    </p>
  );
}

const CONFETTI_COLORS = ["var(--color-untyped)", "var(--color-correct)", "var(--color-incorrect)", "#f2b84b", "#8ccf7e"];

/** The celebration shown when a test is passed. */
export function PassPopup({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="memPopupOverlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="memConfetti" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37 + 5) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i % 7) * 0.18}s`,
              animationDuration: `${2.4 + (i % 5) * 0.35}s`,
            }}
          />
        ))}
      </div>
      <div className="memPopupCard" onClick={(e) => e.stopPropagation()}>
        <div className="memPopupSheep" aria-hidden="true">
          🐑
        </div>
        <p className="memPopupTitle">{title}</p>
        <p className="memPopupBody">{body}</p>
        <button type="button" className="memButton memButton--primary" autoFocus onClick={onClose}>
          {t("memory.test.close")}
        </button>
      </div>
    </div>
  );
}
