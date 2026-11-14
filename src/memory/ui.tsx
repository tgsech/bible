import { useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { VERSE_NUMBERS } from "./passage";
import { PASS_SCORE, estimate, daysUntilContest, useMemory, useMemoryAccountSync, verseState, type LangState } from "./store";
import { fmtMinutes } from "./text";
import "./memory.css";

/** Page frame every mode shares: back link, title, one-line how-to. */
export function ModeShell({ mode, children }: { mode: string; children: ReactNode }) {
  const { t } = useLanguage();
  useMemoryAccountSync();
  return (
    <div id="mainBody" className="memPage">
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
  };
  return (
    <div className="memAttempt">
      <textarea
        ref={ref}
        className="memTextarea"
        rows={4}
        autoFocus
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
      <button type="button" className="memButton memButton--primary" onClick={submit}>
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
