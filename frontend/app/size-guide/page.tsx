const mensData = [
  { uk: 6, us: 7, eu: 40, cm: 25 },
  { uk: 6.5, us: 7.5, eu: 40.5, cm: 25.4 },
  { uk: 7, us: 8, eu: 41, cm: 25.9 },
  { uk: 7.5, us: 8.5, eu: 42, cm: 26.4 },
  { uk: 8, us: 9, eu: 42.5, cm: 26.7 },
  { uk: 8.5, us: 9.5, eu: 43, cm: 27.1 },
  { uk: 9, us: 10, eu: 44, cm: 27.6 },
  { uk: 9.5, us: 10.5, eu: 44.5, cm: 28 },
  { uk: 10, us: 11, eu: 45, cm: 28.4 },
  { uk: 10.5, us: 11.5, eu: 45.5, cm: 28.9 },
  { uk: 11, us: 12, eu: 46, cm: 29.3 },
  { uk: 12, us: 13, eu: 47.5, cm: 30.2 },
];

const womensData = [
  { uk: 3, us: 5.5, eu: 36, cm: 22.4 },
  { uk: 3.5, us: 6, eu: 36.5, cm: 22.9 },
  { uk: 4, us: 6.5, eu: 37.5, cm: 23.4 },
  { uk: 4.5, us: 7, eu: 38, cm: 23.8 },
  { uk: 5, us: 7.5, eu: 38.5, cm: 24.2 },
  { uk: 5.5, us: 8, eu: 39, cm: 24.6 },
  { uk: 6, us: 8.5, eu: 40, cm: 25 },
  { uk: 6.5, us: 9, eu: 40.5, cm: 25.4 },
  { uk: 7, us: 9.5, eu: 41, cm: 25.9 },
  { uk: 7.5, us: 10, eu: 42, cm: 26.4 },
  { uk: 8, us: 10.5, eu: 42.5, cm: 26.7 },
];

export default function SizeGuide() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Size Guide</h1>
      <p className="text-sm text-zinc-500 mb-10">All sizes on SNKRS CART are listed in UK sizing. Use the charts below to find your perfect fit.</p>

      {/* How to measure */}
      <div className="bg-zinc-50 border border-zinc-100 p-6 mb-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-3">How to Measure Your Foot</h2>
        <ol className="text-sm text-zinc-600 space-y-1.5 list-decimal list-inside">
          <li>Place your foot on a flat surface with your heel against a wall</li>
          <li>Mark the tip of your longest toe and measure the distance from the wall</li>
          <li>Use the measurement in centimetres to find your size below</li>
          <li>If between sizes, we recommend sizing up</li>
        </ol>
      </div>

      {/* Men's table */}
      <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-4">Men's Sizes</h2>
      <div className="overflow-x-auto mb-10">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {['UK', 'US', 'EU', 'CM'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold tracking-widest uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mensData.map((row, i) => (
              <tr key={row.uk} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                <td className="px-4 py-2.5 font-semibold text-zinc-900">{row.uk}</td>
                <td className="px-4 py-2.5 text-zinc-600">{row.us}</td>
                <td className="px-4 py-2.5 text-zinc-600">{row.eu}</td>
                <td className="px-4 py-2.5 text-zinc-600">{row.cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Women's table */}
      <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-4">Women's Sizes</h2>
      <div className="overflow-x-auto mb-10">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-zinc-900 text-white">
              {['UK', 'US', 'EU', 'CM'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold tracking-widest uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {womensData.map((row, i) => (
              <tr key={row.uk} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                <td className="px-4 py-2.5 font-semibold text-zinc-900">{row.uk}</td>
                <td className="px-4 py-2.5 text-zinc-600">{row.us}</td>
                <td className="px-4 py-2.5 text-zinc-600">{row.eu}</td>
                <td className="px-4 py-2.5 text-zinc-600">{row.cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-zinc-100 pt-6 text-xs text-zinc-400">
        Size charts are based on standard Nike/Jordan sizing. Fit may vary slightly by model. When in doubt, contact us at <a href="mailto:infosnkrscart@gmail.com" className="underline text-zinc-600">infosnkrscart@gmail.com</a>.
      </div>
    </main>
  );
}
