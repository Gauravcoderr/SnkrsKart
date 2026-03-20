export default function Returns() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Returns & Exchanges</h1>
      <p className="text-sm text-zinc-500 mb-10">At SNKRS CART, we stand behind every product we sell.</p>

      <div className="bg-zinc-900 text-white p-6 mb-10">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-2">Our Promise to You</h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Every sneaker you receive from SNKRS CART is 100% authentic and personally verified by us before dispatch. We show you the exact pair — real photos, real product — so you know exactly what you're getting.
        </p>
      </div>

      <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">No Return Policy</h2>
          <p>
            Because all products are verified authentic and you are shown the actual pair before purchase is finalised, we do not accept returns or exchanges. All sales are final once confirmed.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Wrong or Defective Item</h2>
          <p>
            In the rare event that you receive an item different from what was confirmed, or if the product arrives damaged, we will resolve it immediately — either by replacement or full refund. Please contact us within <strong className="text-zinc-900">48 hours</strong> of delivery with photos of the issue.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Before You Purchase</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>We share real photos of the actual pair with you before finalising</li>
            <li>Confirm your size carefully — size exchanges are not possible</li>
            <li>Ask us any questions before completing the purchase</li>
            <li>Once payment is made and order is dispatched, it cannot be cancelled</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Contact Us</h2>
          <p>Have a concern? Reach out before purchasing and we'll answer everything.</p>
          <div className="mt-3 space-y-1">
            <a href="mailto:infosnkrscart@gmail.com" className="block text-zinc-900 font-semibold underline">infosnkrscart@gmail.com</a>
            <a href="tel:+919410903791" className="block text-zinc-900 font-semibold underline">+91 94109 03791 (WhatsApp / Call)</a>
          </div>
        </section>
      </div>
    </main>
  );
}
