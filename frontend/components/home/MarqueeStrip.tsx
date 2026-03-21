import { MARQUEE_TEXT } from '@/lib/constants';

export default function MarqueeStrip() {
  return (
    <div className="bg-zinc-900 text-white py-2.5 overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee">
        <span className="text-[11px] font-semibold tracking-widest uppercase mx-8 shrink-0">
          {MARQUEE_TEXT}
        </span>
        <span className="text-[11px] font-semibold tracking-widest uppercase mx-8 shrink-0">
          {MARQUEE_TEXT}
        </span>
      </div>
    </div>
  );
}
