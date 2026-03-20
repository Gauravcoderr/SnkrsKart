export default function MarqueeStrip() {
  const text =
    'SNKRS CART: 100% AUTHENTIC SNEAKERS • TRUSTED SELLER • SECURE PACKAGING • PAN INDIA SHIPPING • NO FAKES • NO COMPROMISE • ';

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
