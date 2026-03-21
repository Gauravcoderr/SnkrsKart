import { cn } from '@/lib/utils';

interface BadgeProps {
  variant: 'new' | 'sale' | 'soldout' | 'discount' | 'comingsoon';
  label?: string;
  className?: string;
}

export default function Badge({ variant, label, className }: BadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase';

  const variants = {
    new: 'bg-emerald-500 text-white',
    sale: 'bg-red-500 text-white',
    soldout: 'bg-zinc-400 text-white',
    discount: 'bg-zinc-900 text-white',
    comingsoon: 'bg-indigo-500 text-white ring-2 ring-indigo-300 ring-offset-1 animate-pulse',
  };

  const defaultLabels = { new: 'New', sale: 'Sale', soldout: 'Sold Out', discount: '', comingsoon: 'Coming Soon' };

  return (
    <span className={cn(base, variants[variant], className)}>
      {label ?? defaultLabels[variant]}
    </span>
  );
}
