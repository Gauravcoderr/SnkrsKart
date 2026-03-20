export default function Returns() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Returns & Exchanges</h1>
      <p className="text-sm text-zinc-500 mb-10">We want you to love your purchase. If something isn't right, we'll make it right.</p>

      <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Return Policy</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Returns accepted within <strong className="text-zinc-900">7 days</strong> of delivery</li>
            <li>Item must be unworn, in original condition with all tags and box intact</li>
            <li>Customised or sale items are not eligible for return</li>
            <li>Return shipping cost is borne by the customer unless the item is defective or incorrect</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Exchange Policy</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Exchanges accepted within <strong className="text-zinc-900">7 days</strong> of delivery, subject to stock availability</li>
            <li>Size exchanges are processed at no extra cost (shipping both ways covered by us)</li>
            <li>Contact us first before sending anything back</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Defective / Wrong Item</h2>
          <p>If you receive a defective or incorrect item, we will arrange a free pickup and send a replacement or issue a full refund. Please share photos of the issue within 48 hours of delivery.</p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Refund Process</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Refunds are processed within <strong className="text-zinc-900">5–7 business days</strong> after we receive and inspect the return</li>
            <li>Refunds are issued to the original payment method</li>
            <li>You will be notified via email once the refund is processed</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">How to Initiate a Return</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Email us at <a href="mailto:infosnkrscart@gmail.com" className="text-zinc-900 underline">infosnkrscart@gmail.com</a> with your order details and reason</li>
            <li>Our team will respond within 24 hours with instructions</li>
            <li>Pack the item securely in its original box</li>
            <li>Ship it to the address provided by our team</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
