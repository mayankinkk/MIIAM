"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultLite {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionEventLite {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLite>>;
  resultIndex: number;
}
interface SpeechRecognitionErrorEventLite {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLite) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLite) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognitionLike };
    webkitSpeechRecognition?: { new (): SpeechRecognitionLike };
  }
}

interface Props {
  onResult: (text: string) => void;
  language?: string;
  placeholder?: string;
}

const SPEECH_LANG: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
};

export default function PrintVoiceSearch({ onResult, language = "en", placeholder }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const Ctor = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    setSupported(!!Ctor);
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = SPEECH_LANG[language] || "en-IN";
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const text = last[0]?.transcript || "";
      setTranscript(text);
      if (last[0]?.confidence === 1 || text.length > 5) onResult(text);
    };
    rec.onerror = (e) => {
      setError(typeof e?.error === "string" ? e.error : "voice error");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => { rec.abort(); };
  }, [language, onResult]);

  if (!supported) return null;

  const handleToggle = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      setTranscript("");
      setError(null);
      try { rec.start(); setListening(true); } catch (e) { setError((e as Error).message); }
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={listening ? "Stop voice search" : "Start voice search"}
      aria-pressed={listening}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
        listening ? "bg-rose-100 border-rose-300 text-rose-700" : "bg-[var(--color-surface-container-lowest)] border-[var(--color-border-subtle)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-subtle)]"
      }`}
    >
      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
        {listening ? "mic_off" : "mic"}
      </span>
      {listening ? "Listening…" : placeholder || "Voice search"}
      {transcript && <span className="text-[var(--color-outline)] italic max-w-[160px] truncate">"{transcript}"</span>}
      {error && <span className="text-rose-500 text-[10px]">({error})</span>}
    </button>
  );
}
