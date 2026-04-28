import { FitSummary } from '@/types';

interface FitIndicatorProps {
  fitSummary: FitSummary;
}

export default function FitIndicator({ fitSummary }: FitIndicatorProps) {
  if (fitSummary.total < 3) return null;

  // Weighted position 0–100: small=0, true=50, large=100
  const position = Math.round(
    (fitSummary.small * 0 + fitSummary.true * 50 + fitSummary.large * 100) / fitSummary.total
  );

  const label =
    position < 30 ? 'Runs Small' :
    position > 70 ? 'Runs Large' :
    'True to Size';

  const labelColor =
    position < 30 ? 'text-amber-600' :
    position > 70 ? 'text-blue-600' :
    'text-emerald-600';

  return (
    <div className="mt-4 p-4 bg-zinc-50 border border-zinc-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">How It Fits</p>
        <p className={`text-[10px] font-bold tracking-widest uppercase ${labelColor}`}>
          {label}
        </p>
      </div>

      <div className="relative h-2 bg-zinc-200 rounded-full mb-2">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-white shadow-md transition-all"
          style={{ left: `calc(${position}% - 7px)` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-zinc-400">
        <span>Runs Small</span>
        <span>True to Size</span>
        <span>Runs Large</span>
      </div>

      <p className="text-[10px] text-zinc-400 mt-2 text-center">
        Based on {fitSummary.total} buyer{fitSummary.total !== 1 ? 's' : ''}
        {' · '}
        {fitSummary.small} small · {fitSummary.true} true · {fitSummary.large} large
      </p>
    </div>
  );
}
