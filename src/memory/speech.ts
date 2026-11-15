// Speech-to-text for reciting a verse out loud, built on the browser's own
// SpeechRecognition (Web Speech API).
//
// Privacy: this file never touches the audio. The browser listens and
// hands back text only, so there is no recording for us to store or
// delete - and the transcript itself is only kept long enough to grade it.
//
// Where the listening happens depends on the browser:
//  - If it offers on-device recognition for the language
//    (SpeechRecognition.available / processLocally), we require it, after
//    a one-time language-pack download if needed. Nothing leaves the phone.
//  - Otherwise the browser uses its vendor's speech service (Chrome ->
//    Google, Safari -> Apple). We can't change that, so the UI says so.
//  - Some browsers have no working speech recognition (Firefox, and the
//    in-app browsers of KakaoTalk and similar apps - see inAppBrowser).
//    The mic simply isn't offered there.

import { useCallback, useEffect, useRef, useState } from "react";
import type { PassageLang } from "./passage";

interface RecResult {
  0: { transcript: string };
}
interface RecEvent {
  results: ArrayLike<RecResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  processLocally?: boolean;
  onstart: (() => void) | null;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface RecognitionCtor {
  new (): Recognition;
  available?: (options: { langs: string[]; processLocally: boolean }) => Promise<string>;
  install?: (options: { langs: string[]; processLocally: boolean }) => Promise<boolean>;
}

const LANG_TAG: Record<PassageLang, string> = { ko: "ko-KR", en: "en-US" };
/** Safety net so a forgotten mic doesn't listen forever. */
const MAX_LISTEN_MS = 120_000;

/** True inside another app's built-in browser (KakaoTalk, Naver, Line,
 *  Instagram, Facebook, or any plain Android/iOS webview).
 *
 *  These expose SpeechRecognition but can't actually use the microphone
 *  for it, and asking takes the whole in-app browser down with it (seen
 *  in KakaoTalk: the window just closes). So in them we never touch the
 *  speech API at all and treat it as unsupported. */
export function inAppBrowser(): boolean {
  const ua = navigator.userAgent;
  if (/KAKAOTALK|NAVER\(inapp|DaumApps|Line\/|Instagram|FBAN|FBAV|FB_IAB|; wv\)/i.test(ua)) return true;
  // iOS: every real browser's UA carries a "Safari/" token; an app's
  // embedded webview does not.
  return /iPhone|iPad|iPod/.test(ua) && !/Safari\//.test(ua);
}

/** A link that reopens the current page in the phone's real browser, for
 *  the in-app browsers that offer a way to do that (KakaoTalk). */
export function externalBrowserUrl(): string | null {
  if (!/KAKAOTALK/i.test(navigator.userAgent)) return null;
  return `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
}

/* ---------- crash guard ----------
   In some browsers a speech call doesn't fail politely - it kills the tab
   ("탭이 중지된 상태입니다" in Samsung Internet, a closed window in
   KakaoTalk). Code can't catch that, but it can notice it afterwards: a
   marker is written just before each risky call and removed as soon as
   the page is still alive after it. If the marker is still there when the
   site next loads, the last call took the tab down, so speech is switched
   off in this browser (for a week, in case a browser update fixes it). */

const GUARD_KEY = "livingwords:speech-guard";
const BROKEN_FOR_MS = 7 * 86_400_000;

function readGuard(): string | null {
  try {
    return localStorage.getItem(GUARD_KEY);
  } catch {
    return null;
  }
}

function writeGuard(value: string | null) {
  try {
    if (value === null) localStorage.removeItem(GUARD_KEY);
    else localStorage.setItem(GUARD_KEY, value);
  } catch {
    /* storage blocked - the guard just can't help here */
  }
}

// Runs once per page load.
if (readGuard() === "pending") writeGuard(`broken:${Date.now()}`);
// Leaving the page normally mid-call is not a crash.
window.addEventListener("pagehide", () => {
  if (readGuard() === "pending") writeGuard(null);
});

function speechBroken(): boolean {
  const guard = readGuard();
  if (!guard?.startsWith("broken:")) return false;
  if (Date.now() - Number(guard.slice(7)) < BROKEN_FOR_MS) return true;
  writeGuard(null);
  return false;
}

/** Marks a risky call as in flight; call the returned function once the
 *  page has clearly survived it. Also clears itself after a few seconds. */
function riskyCall(): () => void {
  writeGuard("pending");
  const done = () => {
    if (readGuard() === "pending") writeGuard(null);
  };
  setTimeout(done, 4000);
  return done;
}

/** The on-device check (SpeechRecognition.available) is only trusted in
 *  Google Chrome itself. Other Chromium browsers (Samsung Internet, app
 *  webviews) expose the method without anything behind it, and calling it
 *  is what crashed their tabs. */
function isGoogleChrome(): boolean {
  const data = (navigator as unknown as { userAgentData?: { brands?: { brand: string }[] } }).userAgentData;
  return data?.brands?.some((b) => b.brand === "Google Chrome") ?? false;
}

function getCtor(): RecognitionCtor | null {
  if (inAppBrowser() || speechBroken()) return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** "local": on-device, ready. "downloadable": on-device after a language
 *  pack download. "cloud": only the browser vendor's service. */
export type SpeechEngine = "local" | "downloadable" | "cloud";
export type SpeechError = "denied" | "failed" | null;

export interface Dictation {
  supported: boolean;
  engine: SpeechEngine | null;
  listening: boolean;
  /** True while the on-device language pack is downloading. */
  installing: boolean;
  error: SpeechError;
  /** Must be called from a tap/click. */
  start: () => void;
  stop: () => void;
}

/**
 * Speak-to-text. `onText` gets the transcript so far every time it grows;
 * `onDone` gets the final transcript once, when listening ends.
 */
export function useDictation(
  lang: PassageLang,
  onText: (text: string) => void,
  onDone: (text: string) => void,
): Dictation {
  const [supported] = useState(() => getCtor() !== null);
  const [engine, setEngine] = useState<SpeechEngine | null>(null);
  const [listening, setListening] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<SpeechError>(null);

  const recRef = useRef<Recognition | null>(null);
  const wantRef = useRef(false);
  const engineRef = useRef<SpeechEngine>("cloud");
  const handlers = useRef({ onText, onDone });
  useEffect(() => {
    handlers.current = { onText, onDone };
  });

  // Find out up front whether on-device recognition exists for this
  // language, so start() can stay synchronous inside the user's tap
  // (iOS Safari refuses to start listening outside one).
  useEffect(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    let cancelled = false;
    const decide = (status: string) => {
      if (cancelled) return;
      const next: SpeechEngine =
        status === "available" ? "local" : status === "downloadable" || status === "downloading" ? "downloadable" : "cloud";
      engineRef.current = next;
      setEngine(next);
    };
    if (!Ctor.available || !isGoogleChrome()) {
      decide("unavailable");
    } else {
      const survived = riskyCall();
      Ctor.available({ langs: [LANG_TAG[lang]], processLocally: true })
        .then(decide, () => decide("unavailable"))
        .finally(survived);
    }
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Leaving the page stops the mic.
  useEffect(
    () => () => {
      wantRef.current = false;
      recRef.current?.abort();
    },
    [],
  );

  const listen = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    const startedAt = Date.now();
    let committed = "";

    const session = () => {
      const rec = new Ctor();
      recRef.current = rec;
      rec.lang = LANG_TAG[lang];
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      // Android Chrome repeats earlier words in continuous mode, so there
      // we take one utterance at a time and restart after each pause.
      rec.continuous = !/Android/i.test(navigator.userAgent);
      if (engineRef.current === "local") rec.processLocally = true;

      let sessionText = "";
      const survived = riskyCall();
      rec.onstart = survived;
      rec.onresult = (e) => {
        survived();
        // Everything heard this session, finalized or not: some browsers
        // (iOS Safari) never mark results final.
        sessionText = Array.from(e.results, (r) => r[0].transcript.trim())
          .filter(Boolean)
          .join(" ");
        handlers.current.onText([committed, sessionText].filter(Boolean).join(" "));
      };
      rec.onerror = (e) => {
        survived();
        if (e.error === "no-speech" || e.error === "aborted") return;
        wantRef.current = false;
        setError(e.error === "not-allowed" || e.error === "service-not-allowed" ? "denied" : "failed");
      };
      rec.onend = () => {
        survived();
        committed = [committed, sessionText].filter(Boolean).join(" ");
        if (wantRef.current && Date.now() - startedAt < MAX_LISTEN_MS) {
          session();
          return;
        }
        wantRef.current = false;
        recRef.current = null;
        setListening(false);
        handlers.current.onDone(committed);
      };
      try {
        rec.start();
      } catch {
        survived();
        wantRef.current = false;
        setListening(false);
        setError("failed");
      }
    };

    wantRef.current = true;
    setError(null);
    setListening(true);
    session();
  }, [lang]);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || wantRef.current || installing) return;
    if (engineRef.current === "downloadable" && Ctor.install) {
      // One-time language pack download, then the user taps again to
      // speak (a download can outlast the tap that started it).
      setInstalling(true);
      setError(null);
      Ctor.install({ langs: [LANG_TAG[lang]], processLocally: true })
        .then(
          (ok) => (ok ? "local" : "cloud"),
          () => "cloud" as const,
        )
        .then((next) => {
          engineRef.current = next as SpeechEngine;
          setEngine(next as SpeechEngine);
          setInstalling(false);
        });
      return;
    }
    listen();
  }, [lang, installing, listen]);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
  }, []);

  return { supported, engine, listening, installing, error, start, stop };
}
