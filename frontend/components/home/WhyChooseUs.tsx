const REASONS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    heading: '100% Authentic',
    sub: 'Every pair verified by our team before dispatch. Zero fakes, guaranteed.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
      </svg>
    ),
    heading: 'Best Prices in India',
    sub: 'Direct from trusted sellers. No inflated MRP, no middleman markup.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    heading: 'Ships in 24 Hours',
    sub: 'Order today, wear it tomorrow. Pan-India tracked delivery on every order.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    heading: 'UPI Payments',
    sub: 'Pay instantly via UPI — Google Pay, PhonePe, Paytm and more. Fast & secure.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-zinc-50 py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-400 mb-3">
            Why you&apos;ll always
          </p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
            Choose <span className="text-zinc-900 underline decoration-zinc-300 underline-offset-4">SNKRS CART</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-zinc-200 border border-zinc-200">
          {REASONS.map((reason) => (
            <div key={reason.heading} className="flex flex-col items-center text-center px-6 py-10 gap-5 bg-white hover:bg-zinc-50 transition-colors duration-200">
              {/* Icon circle */}
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                {reason.icon}
              </div>

              {/* Text */}
              <div>
                <p className="text-sm font-bold text-zinc-900 mb-1.5 tracking-tight">{reason.heading}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{reason.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
