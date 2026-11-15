import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { nextVerse } from "../../memory/passage";
import { PASS_SCORE, recordPractice, useMemory } from "../../memory/store";
import { externalBrowserUrl, useDictation } from "../../memory/speech";
import { gradeAttempt, hintWord, nowMs, tokenize, type Grade } from "../../memory/text";
import { ModeShell, SpeechNote, VersePicker } from "../../memory/ui";
import { Feedback } from "./StudyModes";

// Recite Aloud: no keyboard at all. Tap the mic, say the verse, tap again;
// speech recognition (see memory/speech.ts) turns it into text and it's
// marked the same way a typed answer is.

/** Reciting from nothing proves more than reciting from first letters. */
const CAP_NO_HINT = 90;
const CAP_HINT = 75;

function Round({ verse, hint, onNext }: { verse: number; hint: boolean; onNext: () => void }) {
  const { t } = useLanguage();
  const { lang, passage } = useMemory();
  const text = passage.verses[verse];
  const [heard, setHeard] = useState("");
  const [last, setLast] = useState<{ grade: Grade; typed: string } | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const speech = useDictation(lang, setHeard, (finalText) => {
    if (finalText.trim() === "") return;
    const grade = gradeAttempt(text, finalText);
    recordPractice(
      lang,
      [{ verse, accuracy: grade.score, cap: hint ? CAP_HINT : CAP_NO_HINT }],
      Math.min(nowMs() - startedAt, 5 * 60_000),
    );
    setStartedAt(nowMs());
    setLast({ grade, typed: finalText });
  });

  const passed = last !== null && last.grade.score >= PASS_SCORE;

  if (!speech.supported) {
    const external = externalBrowserUrl();
    return (
      <div className="memCard memResult">
        <p>{t("memory.speech.unsupported")}</p>
        {external && (
          <div className="memActions">
            <a className="memButton memButton--primary" href={external}>
              {t("memory.speech.openExternal")}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="memCard memFlash">
        <p className="memFlashRef">
          {passage.book} 1:{verse}
        </p>
        {hint && (
          <p className="memCue--letters memSpeakHint">
            {tokenize(text)
              .map((w) => hintWord(w, lang))
              .join(" ")}
          </p>
        )}
        <p className={speech.listening ? "memSpeakHeard" : "memFlashPrompt"} aria-live="polite">
          {speech.listening
            ? heard || t("memory.speech.listening")
            : speech.transcribing
              ? t("memory.speech.transcribing")
              : t("memory.speak.prompt")}
        </p>
      </div>

      <div className="memSpeakControls">
        <button
          type="button"
          className={`memMicBig${speech.listening ? " isListening" : ""}`}
          aria-pressed={speech.listening}
          disabled={speech.installing || speech.transcribing}
          onClick={() => {
            if (speech.listening) {
              speech.stop();
            } else {
              setHeard("");
              setLast(null);
              speech.start();
            }
          }}
        >
          <span aria-hidden="true">{speech.listening ? "■" : "🎙️"}</span>
          {speech.listening ? t("memory.speech.stop") : t("memory.speech.start")}
        </button>
        <SpeechNote speech={speech} />
      </div>

      {last && !speech.listening && !speech.transcribing && <Feedback grade={last.grade} typed={last.typed} typedLabel={t("memory.speech.heard")} />}
      {passed && !speech.listening && (
        <div className="memActions">
          <button type="button" className="memButton memButton--primary" onClick={onNext}>
            {t("memory.nextVerse")}
          </button>
        </div>
      )}
    </>
  );
}

export function SpeakMode() {
  const { t } = useLanguage();
  const { lang } = useMemory();
  const [verse, setVerse] = useState(17);
  const [hint, setHint] = useState(false);
  const [round, setRound] = useState(0);
  const go = (v: number) => {
    setVerse(v);
    setRound((r) => r + 1);
  };
  return (
    <ModeShell mode="speak">
      <VersePicker value={verse} onChange={(v) => v !== "all" && go(v)} />
      <div className="memSeg memSpeakHintToggle" role="group" aria-label={t("memory.speak.hintLabel")}>
        <button type="button" className={!hint ? "isActive" : ""} aria-pressed={!hint} onClick={() => setHint(false)}>
          {t("memory.speak.noHint")}
        </button>
        <button type="button" className={hint ? "isActive" : ""} aria-pressed={hint} onClick={() => setHint(true)}>
          {t("memory.speak.withHint")}
        </button>
      </div>
      <Round key={`${lang}-${verse}-${round}`} verse={verse} hint={hint} onNext={() => go(nextVerse(verse))} />
    </ModeShell>
  );
}
