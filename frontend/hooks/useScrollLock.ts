'use client';

import { useEffect } from 'react';

// Ref-counted so multiple overlapping overlays don't fight each other:
// last one to close re-enables scroll, not the first.
let lockCount = 0;

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lockCount++;
    document.body.style.overflow = 'hidden';
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) document.body.style.overflow = '';
    };
  }, [locked]);
}
