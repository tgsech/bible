// Speech-to-text for reciting a verse out loud. Two engines:
//
// 1. Whisper, through this site's backend (POST /api/transcribe). The most
//    accurate, so it is used whenever it's available. The recording is held
//    in memory, sent once, and dropped as soon as the text comes back -
//    neither this page nor the server saves it. It can be unavailable (no
//    backend in local dev, the day's free allowance used up, a daily cap
//    reached); then the mic falls back to engine 2.
//
// 2. The browser's own SpeechRecognition (Web Speech API). Here this file
//    never touches the audio: the browser listens and hands back text.
//
// Where engine 2 listens depends on the browser:
//  - If it offers on-device recognition for the language
//    (SpeechRecognition.available / processLocally), we require it, after
//    a one-time language-pack download if needed. Nothing leaves the phone.
//  - Otherwise the browser uses its vendor's speech service (Chrome ->
//    Google, Safari -> Apple). We can't change that, so the UI says so.
//  - Some browsers have no working speech recognition (Firefox, and the
//    in-app browsers of KakaoTalk and similar apps - see inAppBrowser).
//    The mic simply isn't offered there.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { API_URL } from "../lib/api";
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

/* ---------- Whisper (engine 1) ---------- */

/** A forgotten mic shouldn't spend the shared allowance. */
const WHISPER_MAX_MS = 45_000;
const WHISPER_RATE = 16_000;

function canRecord(): boolean {
  return (
    !inAppBrowser() &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

// null = not asked yet. Shared by every mic on the page, and asked once
// per page load.
let whisperOk: boolean | null = null;
let whisperAsked = false;
const whisperListeners = new Set<() => void>();

function setWhisper(ok: boolean) {
  whisperOk = ok;
  whisperListeners.forEach((fn) => fn());
}

function askWhisper() {
  if (whisperAsked) return;
  whisperAsked = true;
  if (!canRecord()) {
    setWhisper(false);
    return;
  }
  fetch(`${API_URL}/api/transcribe`, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : { available: false }))
    .then(
      (body: { available?: boolean }) => setWhisper(body.available === true),
      () => setWhisper(false),
    );
}

function subscribeWhisper(fn: () => void) {
  whisperListeners.add(fn);
  return () => {
    whisperListeners.delete(fn);
  };
}

/** Re-encodes a recording as 16 kHz mono WAV: the one format every
 *  speech model reads, whatever container this browser records in. */
async function toWav(recording: Blob): Promise<Blob> {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctx = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctx) throw new Error("no AudioContext");
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(await recording.arrayBuffer());
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * WHISPER_RATE)), WHISPER_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const samples = (await offline.startRendering()).getChannelData(0);

    const view = new DataView(new ArrayBuffer(44 + samples.length * 2));
    const ascii = (at: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i));
    };
    ascii(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    ascii(8, "WAVEfmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, WHISPER_RATE, true);
    view.setUint32(28, WHISPER_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    ascii(36, "data");
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([view], { type: "audio/wav" });
  } finally {
    void ctx.close();
  }
}

/** Sends a recording to the backend and returns the text. Throws when
 *  Whisper can't be used right now. */
async function transcribe(recording: Blob, lang: PassageLang): Promise<string> {
  // If this browser can't re-encode, send what it recorded as is.
  const audio = await toWav(recording).catch(() => recording);
  const res = await fetch(`${API_URL}/api/transcribe?lang=${lang}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": audio.type || "application/octet-stream" },
    body: audio,
  });
  if (!res.ok) throw new Error(`transcribe ${res.status}`);
  const body = (await res.json()) as { text?: string };
  return body.text ?? "";
}

/** "whisper": this site's backend. "local": on-device, ready.
 *  "downloadable": on-device after a language pack download. "cloud": only
 *  the browser vendor's service. */
export type SpeechEngine = "whisper" | "local" | "downloadable" | "cloud";
/** "fallback": Whisper just became unavailable; the next tap uses the
 *  browser's recognition instead. */
export type SpeechError = "denied" | "failed" | "fallback" | null;

export interface Dictation {
  supported: boolean;
  engine: SpeechEngine | null;
  listening: boolean;
  /** True while the on-device language pack is downloading. */
  installing: boolean;
  /** True after a Whisper recording stops, until its text arrives. */
  transcribing: boolean;
  error: SpeechError;
  /** Must be called from a tap/click. */
  start: () => void;
  stop: () => void;
}

/**
 * Speak-to-text. `onText` gets the transcript so far every time it grows
 * (browser engines only - Whisper answers once, at the end); `onDone` gets
 * the final transcript once, when listening ends.
 */
export function useDictation(
  lang: PassageLang,
  onText: (text: string) => void,
  onDone: (text: string) => void,
): Dictation {
  const [hasBrowserEngine] = useState(() => getCtor() !== null);
  const [couldRecord] = useState(canRecord);
  const whisper = useSyncExternalStore(subscribeWhisper, () => whisperOk);
  useEffect(askWhisper, []);
  const supported = hasBrowserEngine || whisper === true || (whisper === null && couldRecord);

  const [browserEngine, setEngine] = useState<SpeechEngine | null>(null);
  const engine = whisper === true ? "whisper" : browserEngine;
  const [listening, setListening] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<SpeechError>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const aliveRef = useRef(true);

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

  // Leaving the page stops the mic (and throws away a recording in
  // progress rather than sending it).
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      wantRef.current = false;
      recRef.current?.abort();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    };
  }, []);

  const record = useCallback(() => {
    wantRef.current = true;
    setError(null);
    setListening(true);

    const fail = (kind: SpeechError) => {
      wantRef.current = false;
      if (!aliveRef.current) return;
      setListening(false);
      setTranscribing(false);
      setError(kind);
    };

    navigator.mediaDevices
      .getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        const release = () => stream.getTracks().forEach((track) => track.stop());
        // Stop was tapped (or the page left) before the mic opened.
        if (!wantRef.current || !aliveRef.current) {
          release();
          if (aliveRef.current) setListening(false);
          return;
        }
        const rec = new MediaRecorder(stream);
        recorderRef.current = rec;
        const chunks: Blob[] = [];
        const startedAt = Date.now();
        const timer = setTimeout(() => rec.state === "recording" && rec.stop(), WHISPER_MAX_MS);
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        rec.onstop = () => {
          clearTimeout(timer);
          release();
          recorderRef.current = null;
          wantRef.current = false;
          if (!aliveRef.current) return;
          setListening(false);
          // A tap-tap with nothing said isn't worth a request.
          if (chunks.length === 0 || Date.now() - startedAt < 500) {
            handlers.current.onDone("");
            return;
          }
          setTranscribing(true);
          transcribe(new Blob(chunks, { type: rec.mimeType }), lang).then(
            (text) => {
              if (!aliveRef.current) return;
              setTranscribing(false);
              if (text === "") setError("failed");
              handlers.current.onDone(text);
            },
            () => {
              // Whisper is out for now (cap, allowance, network): use the
              // browser's recognition for the rest of this visit.
              setWhisper(false);
              fail(getCtor() ? "fallback" : "failed");
            },
          );
        };
        rec.start();
      })
      .catch((err: unknown) => {
        const name = (err as { name?: string } | null)?.name;
        if (name === "NotAllowedError" || name === "SecurityError") {
          fail("denied");
          return;
        }
        // No usable microphone through this path; let the browser try.
        setWhisper(false);
        fail(getCtor() ? "fallback" : "failed");
      });
  }, [lang]);

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
    if (wantRef.current || installing || transcribing) return;
    if (whisperOk === true) {
      record();
      return;
    }
    const Ctor = getCtor();
    if (!Ctor) return;
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
  }, [lang, installing, transcribing, listen, record]);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  return { supported, engine, listening, installing, transcribing, error, start, stop };
}
