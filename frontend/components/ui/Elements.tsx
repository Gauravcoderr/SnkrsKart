import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from './Icons';

/**
 * Reusable form element primitives.
 * Pass `className` to override the default light-theme styling (e.g. for dark admin forms).
 */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white placeholder:text-zinc-400',
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'appearance-none w-full border border-zinc-200 bg-white text-sm text-zinc-900 px-3 py-2 pr-8 focus:outline-none focus:border-zinc-900 transition-colors cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
    </div>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors resize-none bg-white placeholder:text-zinc-400',
        className,
      )}
      {...props}
    />
  );
}
