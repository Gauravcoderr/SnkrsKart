'use client';

import { useState, useRef, useEffect } from 'react';

export default function ListenButton({ html }: { html: string }) {
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = 'en-IN';

    // Pick a female voice — prefer Indian English female, then any English female
    const voices = window.speechSynthesis.getVoices();
    const isFemale = (v: SpeechSynthesisVoice) =>
      /female|woman|zira|samantha|karen|moira|fiona|veena|rishi|aditi/i.test(v.name) ||
      (!(/male|david|daniel|james|fred|alex|rishi/i.test(v.name)));
    const femaleIndian = voices.find((v) => v.lang === 'en-IN' && isFemale(v));
    const femaleEnglish = voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      || voices.find((v) => v.lang.startsWith('en') && /samantha|karen|zira|moira|fiona|veena|victoria|susan/i.test(v.name))
      || voices.find((v) => v.lang === 'en-US' && isFemale(v))
      || voices.find((v) => v.lang.startsWith('en') && isFemale(v));
    const pickedVoice = femaleIndian || femaleEnglish || voices.find((v) => v.lang === 'en-IN') || voices.find((v) => v.lang.startsWith('en'));
    if (pickedVoice) utterance.voice = pickedVoice;

    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
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
