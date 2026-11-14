import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { nextVerse } from "../../memory/passage";
import { PASS_SCORE, recordPractice, useMemory } from "../../memory/store";
import { gradeAttempt, hintWord, seededOrder, tokenize, type Grade } from "../../memory/text";
import { DiffView, ModeShell, TypeAttempt, VersePicker } from "../../memory/ui";

// Two typed study modes that share one loop: show a partial cue, type the
// whole verse, get marked, repeat.
//  - Vanishing Words: the cue is the verse itself with more words blanked
//    out each stage (vanishing cues + retrieval practice).
//  - First Letters: the cue is only the first letter of every word.

/** Fraction of words hidden at each Vanishing Words stage. */
const STAGES = [0, 0.3, 0.55, 0.8, 1];
/** Most mastery each stage can prove - copying a visible verse proves little. */
const STAGE_CAP = [25, 40, 55, 70, 90];
const LETTERS_CAP = 75;

export function Feedback({ grade, typed, typedLabel }: { grade: Grade; typed: string; typedLabel?: string }) {
  const { t } = useLanguage();
  const passed = grade.score >= PASS_SCORE;
  return (
    <div
      className={`memCard memFeedback${passed ? " isPass" : ""}`}
      aria-live="polite"
      // Bring each new result into view (it can be below the fold of the
      // short space above a phone keyboard).
      ref={(el) => el?.scrollIntoView({ block: "nearest" })}
    >
      <p className="memFeedbackHead">
        <strong>{grade.score}%</strong> {passed ? t("memory.study.pass") : t("memory.study.fail")}
      </p>
      <DiffView tokens={grade.tokens} marks={grade.marks} />
      {grade.score < 100 && (
        <p className="memTyped">
          {typedLabel ?? t("memory.yourAnswer")}: {typed}
        </p>
      )}
    </div>
  );
}

function VanishRound({ verse, onNext }: { verse: number; onNext: () => void }) {
  const { t } = useLanguage();
  const { lang, passage } = useMemory();
  const text = passage.verses[verse];
  const [tokens] = useState(() => tokenize(text));
  const [order] = useState(() => seededOrder(tokens.length, verse));
  const [stage, setStage] = useState(0);
  const [last, setLast] = useState<{ grade: Grade; typed: string } | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);

  const hiddenCount = Math.ceil(STAGES[stage] * tokens.length);
  const hidden = new Set(order.slice(0, hiddenCount));

  const submit = (typed: string) => {
    const grade = gradeAttempt(text, typed);
    recordPractice(lang, [{ verse, accuracy: grade.score, cap: STAGE_CAP[stage] }], Math.min(Date.now() - startedAt, 5 * 60_000));
    setStartedAt(Date.now());
    setLast({ grade, typed });
    if (grade.score >= PASS_SCORE) {
      if (stage === STAGES.length - 1) setFinished(true);
      else setStage(stage + 1);
    }
  };

  return (
    <>
      <div className="memFocusBody">
      <div className="memStageDots" aria-label={t("memory.vanish.stage", { n: stage + 1, total: STAGES.length })}>
        {STAGES.map((_, i) => (
          <span key={i} className={i < stage || finished ? "isDone" : i === stage ? "isNow" : ""} />
        ))}
        <span className="memStageLabel">{t("memory.vanish.stage", { n: Math.min(stage + 1, STAGES.length), total: STAGES.length })}</span>
      </div>
      {!finished && (
        <>
          <div className="memCard memCue">
            <span className="memRainBuiltRef">
              {passage.book} 1:{verse}
            </span>{" "}
            {tokens.map((w, i) =>
              hidden.has(i) ? (
                <span key={i} className="memBlank" style={{ width: `${Math.max(1.5, Array.from(w).length * (lang === "ko" ? 1 : 0.6))}em` }} />
              ) : (
                <span key={i}>{w} </span>
              ),
            )}
          </div>
        </>
      )}
      {last && <Feedback grade={last.grade} typed={last.typed} />}
      {finished && (
        <div className="memCard memResult">
          <p className="memResultEmoji" aria-hidden="true">
            ✨
          </p>
          <h2>{t("memory.vanish.complete")}</h2>
          <div className="memActions">
            <button type="button" className="memButton memButton--primary" autoFocus onClick={onNext}>
              {t("memory.nextVerse")}
            </button>
          </div>
        </div>
      )}
      </div>
      {!finished && (
        <div className="memFocusDock">
          <TypeAttempt lang={lang} onSubmit={submit} submitLabel={t("memory.submit")} placeholder={t("memory.typePlaceholder")} />
        </div>
      )}
    </>
  );
}

function LettersRound({ verse, onNext }: { verse: number; onNext: () => void }) {
  const { t } = useLanguage();
  const { lang, passage } = useMemory();
  const text = passage.verses[verse];
  const [last, setLast] = useState<{ grade: Grade; typed: string } | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const passed = last !== null && last.grade.score >= PASS_SCORE;

  const submit = (typed: string) => {
    const grade = gradeAttempt(text, typed);
    recordPractice(lang, [{ verse, accuracy: grade.score, cap: LETTERS_CAP }], Math.min(Date.now() - startedAt, 5 * 60_000));
    setStartedAt(Date.now());
    setLast({ grade, typed });
  };

  return (
    <>
      <div className="memFocusBody">
      <div className="memCard memCue memCue--letters">
        <span className="memRainBuiltRef">
          {passage.book} 1:{verse}
        </span>{" "}
        {tokenize(text)
          .map((w) => hintWord(w, lang))
          .join(" ")}
      </div>
      {last && <Feedback grade={last.grade} typed={last.typed} />}
      {passed && (
        <div className="memActions">
          <button type="button" className="memButton memButton--primary" autoFocus onClick={onNext}>
            {t("memory.nextVerse")}
          </button>
          <button type="button" className="memButton" onClick={() => setLast(null)}>
            {t("memory.retry")}
          </button>
        </div>
      )}
      </div>
      {!passed && (
        <div className="memFocusDock">
          <TypeAttempt lang={lang} onSubmit={submit} submitLabel={t("memory.submit")} placeholder={t("memory.typePlaceholder")} />
        </div>
      )}
    </>
  );
}

function StudyMode({ mode }: { mode: "vanish" | "letters" }) {
  const { lang } = useMemory();
  const [verse, setVerse] = useState(17);
  const [round, setRound] = useState(0);
  const go = (v: number) => {
    setVerse(v);
    setRound((r) => r + 1);
  };
  const RoundView = mode === "vanish" ? VanishRound : LettersRound;
  return (
    <ModeShell mode={mode} focus>
      <VersePicker value={verse} onChange={(v) => v !== "all" && go(v)} />
      <RoundView key={`${lang}-${verse}-${round}`} verse={verse} onNext={() => go(nextVerse(verse))} />
    </ModeShell>
  );
}

export function VanishMode() {
  return <StudyMode mode="vanish" />;
}

export function LettersMode() {
  return <StudyMode mode="letters" />;
}
