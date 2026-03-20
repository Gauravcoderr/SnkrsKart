export default function MarqueeStrip() {
  const text =
    'FREE SHIPPING ON ORDERS ABOVE ₹3,000 · JUST DROPPED: ADIDAS SAMBA OG · NEW IN: NEW BALANCE 550 · ASICS GEL-KAYANO 14 IS BACK · SHOP NIKE DUNK LOW → ';

  return (
    <div className="bg-zinc-900 text-white py-2.5 overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee">
        {/* Duplicate text for seamless loop */}
        <span className="text-[11px] font-semibold tracking-widest uppercase mx-8 shrink-0">
          {text}
        </span>
        <span className="text-[11px] font-semibold tracking-widest uppercase mx-8 shrink-0">
          {text}
        </span>
      </div>
    </div>
  );
}
