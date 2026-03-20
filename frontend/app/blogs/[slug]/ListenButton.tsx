'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ListenButton({ html }: { html: string }) {
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    setSupported(true);

    function loadVoices() {
      setVoices(window.speechSynthesis.getVoices());
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const pickBestVoice = useCallback((): SpeechSynthesisVoice | undefined => {
    if (voices.length === 0) return undefined;

    // Priority list of high-quality female voices across platforms
    const preferred = [
      // macOS / iOS premium voices
      'Samantha', 'Karen', 'Moira', 'Fiona', 'Victoria', 'Tessa',
      // Google Chrome voices (high quality)
      'Google UK English Female', 'Google US English',
      // Windows
      'Microsoft Zira', 'Microsoft Hazel',
      // Indian English
      'Veena', 'Aditi',
    ];

    for (const name of preferred) {
      const match = voices.find((v) => v.name.includes(name));
      if (match) return match;
    }

    // Fallback: any en-IN or en-US or en-GB voice
    return (
      voices.find((v) => v.lang === 'en-IN') ||
      voices.find((v) => v.lang === 'en-GB') ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en'))
    );
  }, [voices]);

  if (!supported) return null;

  function getPlainText(): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function handlePlay() {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    const text = getPlainText();

    // Chrome has a bug where speech stops after ~15 seconds on long text.
    // Split into chunks and queue them sequentially.
    const chunks = splitIntoChunks(text, 200);
    const voice = pickBestVoice();

    chunks.forEach((chunk, i) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.lang = voice?.lang || 'en-US';
      if (voice) utterance.voice = voice;

      if (i === chunks.length - 1) {
        utterance.onend = () => setPlaying(false);
      }
      utterance.onerror = () => setPlaying(false);

      window.speechSynthesis.speak(utterance);
    });

    setPlaying(true);
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
        playing
          ? 'bg-zinc-900 text-white border-zinc-900'
          : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
      }`}
    >
      {playing ? (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          Stop Listening
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.5V5.5l-5 4H3v5h4l5 4z" />
          </svg>
          Listen to Article
        </>
      )}
    </button>
  );
}

/** Split text into chunks at sentence boundaries to avoid Chrome's 15s cutoff bug */
function splitIntoChunks(text: string, maxWords: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const combined = current + ' ' + sentence;
    if (combined.split(/\s+/).length > maxWords && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = combined;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
