import Link from 'next/link';

export const metadata = {
  title: 'About Us — SNKRS CART',
  description: 'Born in the hills of Pauri Garhwal. Legit sneakers, real passion — since 2020.',
};

export default function AboutPage() {
  return (
    <main className="bg-zinc-950 text-white min-h-screen">

      {/* Hero */}
      <section className="border-b border-zinc-800 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-500 mb-4">
            Est. 2020 · Pauri Garhwal, Uttarakhand
          </p>
          <h1
            className="font-black uppercase leading-none tracking-tighter text-white mb-6"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)' }}
          >
            BUILT ON
            <br />
            <span className="text-zinc-600">PASSION.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl leading-relaxed">
            We didn't start in a warehouse. We started in the hills — a couple of sneakerheads
            from Pauri Garhwal who couldn't stop obsessing over kicks.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-zinc-500 mb-6">Our Story</p>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-6">
              From the mountains<br />to your doorstep.
            </h2>
            <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
              <p>
                SNKRS CART was founded in 2020 out of a simple frustration — getting legit, premium
                sneakers in the hills of Uttarakhand was nearly impossible. Fakes were everywhere.
                Good stuff was out of reach.
              </p>
              <p>
                So we fixed it ourselves. What started as a passion project between friends became
                a curated destination for sneaker lovers who refuse to compromise on authenticity.
              </p>
              <p>
                Every pair we carry is verified. Every drop is real. Because we're collectors
                first — and we know what it means to get burned by a bad pair.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { year: '2020', label: 'Founded', desc: 'Started as a passion project in Pauri Garhwal.' },
              { year: '2021', label: 'First Drop', desc: 'Our first curated collection — sold out in days.' },
              { year: '2023', label: 'Going Digital', desc: 'Launched the SNKRS CART online store.' },
              { year: '2025', label: 'Today', desc: 'Hundreds of happy sneakerheads across India.' },
            ].map(({ year, label, desc }) => (
              <div key={year} className="flex gap-6 items-start">
                <span className="text-xs font-mono text-zinc-600 pt-0.5 w-10 shrink-0">{year}</span>
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                  <p className="text-sm text-zinc-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-zinc-500 mb-10">What we stand for</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { title: '100% Legit', body: 'Every sneaker is verified for authenticity before it reaches you. No fakes. Ever.' },
              { title: 'Real Passion', body: 'We\'re collectors who turned obsession into a business. This isn\'t just retail — it\'s love.' },
              { title: 'From the Hills', body: 'Rooted in Pauri Garhwal, Uttarakhand. Proving that sneaker culture has no boundaries.' },
            ].map(({ title, body }) => (
              <div key={title} className="border border-zinc-800 p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-3">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-zinc-500 mb-6">Get in touch</p>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-10">Contact Us</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <a
              href="mailto:infosnkrscart@gmail.com"
              className="group flex items-start gap-4 border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                <svg className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-600 mb-1">Email</p>
                <p className="text-sm text-white font-medium">infosnkrscart@gmail.com</p>
                <p className="text-xs text-zinc-500 mt-1">Click to send us a message</p>
              </div>
            </a>

            <a
              href="tel:+919410903791"
              className="group flex items-start gap-4 border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                <svg className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-600 mb-1">Phone / WhatsApp</p>
                <p className="text-sm text-white font-medium">+91 94109 03791</p>
                <p className="text-xs text-zinc-500 mt-1">Mon – Sat, 10am – 7pm IST</p>
              </div>
            </a>

            <div className="flex items-start gap-4 border border-zinc-800 p-6 sm:col-span-2">
              <div className="mt-0.5 shrink-0">
                <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-600 mb-1">Based in</p>
                <p className="text-sm text-white font-medium">Pauri Garhwal, Uttarakhand, India</p>
                <p className="text-xs text-zinc-500 mt-1">Shipping across India · All sneakers dispatched within 1–2 business days</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-zinc-100 transition-colors"
            >
              Shop the Collection
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
