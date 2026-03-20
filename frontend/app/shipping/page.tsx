const shippingInfo = [
  {
    region: 'Within India',
    time: '3–7 Business Days',
    cost: 'Free on all orders',
    note: 'Pan-India delivery via trusted courier partners',
  },
  {
    region: 'Uttarakhand (Local)',
    time: '1–3 Business Days',
    cost: 'Free',
    note: 'Faster delivery to Pauri Garhwal and nearby areas',
  },
];

export default function ShippingInfo() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Shipping Info</h1>
      <p className="text-sm text-zinc-500 mb-10">We ship all orders across India with free delivery. Here's what to expect.</p>

      <div className="space-y-4 mb-10">
        {shippingInfo.map((s) => (
          <div key={s.region} className="border border-zinc-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-1">{s.region}</h2>
                <p className="text-xs text-zinc-500">{s.note}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-zinc-900">{s.time}</p>
                <p className="text-xs text-emerald-600 font-semibold">{s.cost}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">How Shipping Works</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Submit a purchase inquiry on the product page</li>
            <li>Our team confirms your order within 24 hours via call/WhatsApp</li>
            <li>Payment is collected and the order is dispatched</li>
            <li>You receive a tracking number once shipped</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Important Notes</h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>All orders are shipped in secure, tamper-proof packaging</li>
            <li>Delivery times are estimates and may vary during peak seasons</li>
            <li>We are not responsible for delays caused by courier partners or natural events</li>
            <li>Signature may be required upon delivery</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Questions?</h2>
          <p>Contact us at <a href="mailto:infosnkrscart@gmail.com" className="text-zinc-900 underline">infosnkrscart@gmail.com</a> or WhatsApp us at <a href="tel:+919410903791" className="text-zinc-900 underline">+91 94109 03791</a>.</p>
        </section>
      </div>
    </main>
  );
}
