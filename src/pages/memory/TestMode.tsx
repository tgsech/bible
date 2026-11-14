import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { VERSE_NUMBERS } from "../../memory/passage";
import { PASS_SCORE, recordTest, useMemory } from "../../memory/store";
import { gradeAttempt, nowMs, shuffle, type Grade } from "../../memory/text";
import { DiffView, Meter, ModeShell, PaceNote, PassPopup, TypeAttempt } from "../../memory/ui";

// The unaided test: a verse reference and an empty box, nothing else.
// Marks come only at the end, like the real thing.

type Kind = "full" | "random" | "quick";

interface Answer {
  verse: number;
  typed: string;
  grade: Grade;
}

export function TestMode() {
  const { t } = useLanguage();
  const { lang, ls, passage } = useMemory();
  const [kind, setKind] = useState<Kind | null>(null);
  const [verses, setVerses] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [overall, setOverall] = useState<number | null>(null);
  const [popup, setPopup] = useState(false);
  const [startedAt, setStartedAt] = useState(0);

  const begin = (k: Kind) => {
    const all = [...VERSE_NUMBERS];
    setKind(k);
    setVerses(k === "full" ? all : k === "random" ? shuffle(all) : shuffle(all).slice(0, 3));
    setAnswers([]);
    setOverall(null);
    setStartedAt(nowMs());
  };

  const submit = (typed: string) => {
    const verse = verses[answers.length];
    const next = [...answers, { verse, typed, grade: gradeAttempt(passage.verses[verse], typed) }];
    setAnswers(next);
    if (next.length === verses.length && kind) {
      const score = recordTest(
        lang,
        next.map((a) => ({ verse: a.verse, score: a.grade.score })),
        Math.min(nowMs() - startedAt, 45 * 60_000),
        kind,
      );
      setOverall(score);
      setPopup(score >= PASS_SCORE);
    }
  };

  const passed = overall !== null && overall >= PASS_SCORE;

  return (
    <ModeShell mode="test" focus={kind !== null && overall === null} onExitFocus={() => setKind(null)}>
      {kind === null && (
        <div className="memModeGrid">
          {(["full", "random", "quick"] as Kind[]).map((k) => (
            <button key={k} type="button" className="memModeCard memModeCard--test" onClick={() => begin(k)}>
              <span className="memModeName">{t(`memory.test.${k}`)}</span>
              <span className="memModeDesc">{t(`memory.test.${k}Desc`)}</span>
            </button>
          ))}
        </div>
      )}

      {kind !== null && overall === null && (
        <>
          <div className="memFocusBody">
          <div className="memTestProgress">
            <Meter value={(answers.length / verses.length) * 100} />
            <span>
              {answers.length + 1} / {verses.length}
            </span>
          </div>
          <div className="memCard memFlash">
            <p className="memFlashRef">
              {passage.book} 1:{verses[answers.length]}
            </p>
            <p className="memFlashPrompt">{t("memory.test.noAid")}</p>
          </div>
          </div>
          <div className="memFocusDock">
          <TypeAttempt
            onSubmit={submit}
            submitLabel={answers.length + 1 === verses.length ? t("memory.test.finish") : t("memory.test.submitNext")}
            placeholder={t("memory.typePlaceholder")}
          />
          </div>
        </>
      )}

      {overall !== null && (
        <>
          <div className={`memCard memResult${passed ? " isPass" : ""}`}>
            <p className="memResultEmoji" aria-hidden="true">
              {passed ? "🐑" : "🌱"}
            </p>
            <h2>{passed ? t("memory.test.pass") : t("memory.test.fail", { n: PASS_SCORE })}</h2>
            <p className="memResultScore">{overall}%</p>
            <PaceNote ls={ls} />
            <div className="memActions">
              <button type="button" className="memButton memButton--primary" onClick={() => setKind(null)}>
                {t("memory.retry")}
              </button>
              <Link to="/memory" className="memButton">
                {t("memory.back")}
              </Link>
            </div>
          </div>
          <ul className="memTestRows">
            {[...answers]
              .sort((a, b) => a.verse - b.verse)
              .map((a) => (
                <li key={a.verse} className="memCard">
                  <div className="memTestRowHead">
                    <strong>
                      {passage.book} 1:{a.verse}
                    </strong>
                    <Meter value={a.grade.score} />
                    <span>{a.grade.score}%</span>
                  </div>
                  <DiffView tokens={a.grade.tokens} marks={a.grade.marks} />
                  {a.grade.score < 100 && (
                    <p className="memTyped">
                      {t("memory.yourAnswer")}: {a.typed}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        </>
      )}

      {popup && (
        <PassPopup
          title={t("memory.test.popupTitle")}
          body={kind === "quick" ? t("memory.test.popupQuickBody") : t("memory.test.popupBody")}
          onClose={() => setPopup(false)}
        />
      )}
    </ModeShell>
  );
}
