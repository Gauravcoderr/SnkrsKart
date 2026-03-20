'use client';

import { useRef, KeyboardEvent, ClipboardEvent } from 'react';

interface Props {
  value: string[];
  onChange: (otp: string[]) => void;
  onComplete: (code: string) => void;
}

export default function OtpInput({ value, onChange, onComplete }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);

    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (digit && index === 5) {
      const code = next.join('');
      if (code.length === 6) onComplete(code);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const next = [...value];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      next[i] = pasted[i];
    }
    onChange(next);

    if (pasted.length === 6) {
      onComplete(next.join(''));
    } else {
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          autoFocus={i === 0}
          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black bg-zinc-100 border-2 border-zinc-200 rounded-xl focus:border-zinc-900 focus:bg-white outline-none transition-all"
        />
      ))}
    </div>
  );
}
