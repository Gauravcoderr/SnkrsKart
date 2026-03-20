'use client';

import * as Dialog from '@radix-ui/react-dialog';

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  gender: 'men' | 'women' | 'unisex' | 'kids';
}

const MEN_SIZES = [
  { uk: '6',    us: '7',    eu: '40',   cm: '25' },
  { uk: '6.5',  us: '7.5',  eu: '40.5', cm: '25.5' },
  { uk: '7',    us: '8',    eu: '41',   cm: '26' },
  { uk: '7.5',  us: '8.5',  eu: '42',   cm: '26.5' },
  { uk: '8',    us: '9',    eu: '42.5', cm: '27' },
  { uk: '8.5',  us: '9.5',  eu: '43',   cm: '27.5' },
  { uk: '9',    us: '10',   eu: '44',   cm: '28' },
  { uk: '9.5',  us: '10.5', eu: '44.5', cm: '28.5' },
  { uk: '10',   us: '11',   eu: '45',   cm: '29' },
  { uk: '10.5', us: '11.5', eu: '45.5', cm: '29.5' },
  { uk: '11',   us: '12',   eu: '46',   cm: '30' },
  { uk: '12',   us: '13',   eu: '47.5', cm: '31' },
];

const WOMEN_SIZES = [
  { uk: '3',   us: '5.5',  eu: '36',   cm: '22.5' },
  { uk: '3.5', us: '6',    eu: '36.5', cm: '23' },
  { uk: '4',   us: '6.5',  eu: '37.5', cm: '23.5' },
  { uk: '4.5', us: '7',    eu: '38',   cm: '24' },
  { uk: '5',   us: '7.5',  eu: '38.5', cm: '24.5' },
  { uk: '5.5', us: '8',    eu: '39',   cm: '25' },
  { uk: '6',   us: '8.5',  eu: '40',   cm: '25.5' },
  { uk: '6.5', us: '9',    eu: '40.5', cm: '26' },
  { uk: '7',   us: '9.5',  eu: '41',   cm: '26.5' },
  { uk: '7.5', us: '10',   eu: '42',   cm: '27' },
  { uk: '8',   us: '10.5', eu: '42.5', cm: '27.5' },
];

const KIDS_SIZES = [
  { uk: '1',   us: '1.5Y', eu: '33',   cm: '20' },
  { uk: '1.5', us: '2Y',   eu: '33.5', cm: '20.5' },
  { uk: '2',   us: '2.5Y', eu: '34',   cm: '21' },
  { uk: '2.5', us: '3Y',   eu: '35',   cm: '21.5' },
  { uk: '3',   us: '3.5Y', eu: '35.5', cm: '22' },
  { uk: '3.5', us: '4Y',   eu: '36',   cm: '22.5' },
  { uk: '4',   us: '4.5Y', eu: '36.5', cm: '23' },
  { uk: '4.5', us: '5Y',   eu: '37.5', cm: '23.5' },
  { uk: '5',   us: '5.5Y', eu: '38',   cm: '24' },
  { uk: '5.5', us: '6Y',   eu: '38.5', cm: '24.5' },
];

function getSizes(gender: string) {
  switch (gender) {
    case 'women': return WOMEN_SIZES;
    case 'kids':  return KIDS_SIZES;
    default:      return MEN_SIZES;
  }
}

function getLabel(gender: string) {
  switch (gender) {
    case 'women': return "Women's";
    case 'kids':  return "Kids'";
    case 'unisex': return "Unisex (Men's)";
    default:      return "Men's";
  }
}

export default function SizeGuideModal({ open, onClose, gender }: SizeGuideModalProps) {
  const sizes = getSizes(gender);
  const label = getLabel(gender);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] focus:outline-none max-h-[85vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
            <div>
              <Dialog.Title asChild>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">Size Guide</p>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p className="text-sm font-bold text-zinc-900 mt-0.5">{label} Sneaker Sizes</p>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Size table */}
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-900 text-white">
                <tr>
                  <th className="py-3 px-4 text-left text-[10px] font-bold tracking-widest uppercase">UK</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold tracking-widest uppercase">US</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold tracking-widest uppercase">EU</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold tracking-widest uppercase">CM</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((row, i) => (
                  <tr key={row.uk} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                    <td className="py-2.5 px-4 font-semibold text-zinc-900">{row.uk}</td>
                    <td className="py-2.5 px-4 text-zinc-600">{row.us}</td>
                    <td className="py-2.5 px-4 text-zinc-600">{row.eu}</td>
                    <td className="py-2.5 px-4 text-zinc-600">{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer tip */}
          <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 shrink-0">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Tip: If you're between sizes, we recommend going half a size up for a comfortable fit.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
