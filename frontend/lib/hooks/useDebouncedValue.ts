import { useEffect, useState } from 'react';

export const SEARCH_DEBOUNCE_MS = 400;
export const LOCAL_SEARCH_DEBOUNCE_MS = 250;

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useDebouncedSearch(value: string, delay = SEARCH_DEBOUNCE_MS): string {
  const trimmed = value.trim();
  const debounced = useDebouncedValue(trimmed, delay);
  return trimmed ? debounced : '';
}
