export default function TrackOrder() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Track My Order</h1>
      <p className="text-sm text-zinc-500 mb-10">Once your order is shipped, you'll receive a tracking number via WhatsApp and email.</p>

      <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
        <div className="border border-zinc-100 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">How to Track Your Order</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>After dispatch, we'll send your tracking number via WhatsApp/email</li>
            <li>Use the tracking number on the courier partner's website to check status</li>
            <li>Typical delivery: 3–7 business days after dispatch</li>
          </ol>
        </div>

        <div className="bg-zinc-50 border border-zinc-100 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-3">Haven't received your tracking number?</h2>
          <p className="mb-4">If it's been more than 24 hours since your order was confirmed and you haven't received a tracking update, reach out to us directly:</p>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:infosnkrscart@gmail.com"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 underline"
            >
              infosnkrscart@gmail.com
            </a>
            <a
              href="tel:+919410903791"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 underline"
            >
              +91 94109 03791 (WhatsApp / Call)
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
