import Link from 'next/link';

const WA_LINK =
  'https://wa.me/919410903791?text=Hi%2C%20I%20have%20a%20question%20about%20your%20sneakers';

export default function WhatsAppCTA() {
  return (
    <section className="bg-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 mb-2">
            Got Questions?{' '}
            <span style={{ color: '#25D366' }}>We Are A Tap Away!</span>
          </h2>
          <p className="text-sm text-zinc-500 max-w-md">
            Chat with our sneaker experts on WhatsApp for instant answers on sizing, authenticity &amp; deals.
          </p>
        </div>

        <Link
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm text-white whitespace-nowrap shrink-0 shadow-md hover:opacity-90 active:scale-95 transition-all duration-150"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Chat on WhatsApp
        </Link>
      </div>
    </section>
  );
}
