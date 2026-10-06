'use client';

import { useEffect, useRef } from 'react';

interface Props {
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}

export default function DetailPane({ onClose, label, children }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    if (mq.matches) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 xl:static xl:z-auto xl:self-start xl:min-w-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm xl:hidden" onClick={() => onCloseRef.current()} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="absolute inset-y-0 right-0 w-full sm:max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl overflow-y-auto animate-slide-in-right xl:static xl:inset-auto xl:w-auto xl:max-w-none xl:rounded-xl xl:border xl:shadow-none xl:overflow-visible xl:animate-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {children}
      </div>
    </div>
  );
}
