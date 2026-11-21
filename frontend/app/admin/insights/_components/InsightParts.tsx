import type { ReactNode } from 'react';
import { formatPrice } from '@/lib/utils';
import { ageLabel, CELL, HEAD, NAME_LINK, safeHref, signedPct, storeLabel } from '@/app/admin/_lib/insights';
import type { PriceMove } from '@/app/admin/_lib/insights';

export function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h2>
        {note && <p className="text-xs text-zinc-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{hint}</p>
    </div>
  );
}

export function Empty({ columns, children }: { columns: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-10 text-center text-zinc-500">
        {children}
      </td>
    </tr>
  );
}

export function MoveTable({ moves, tone, empty }: { moves: PriceMove[]; tone: string; empty: string }) {
  const now = new Date();
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="admin-table w-full text-sm">
        <thead>
          <tr className="bg-zinc-900 text-zinc-400 text-left">
            <th className={HEAD}>Pair</th>
            <th className={HEAD}>Was</th>
            <th className={HEAD}>Now</th>
            <th className={HEAD}>Change</th>
            <th className={HEAD}>When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {moves.map((move) => (
            <tr key={move.url}>
              <td className={CELL}>
                <a href={safeHref(move.url)} target="_blank" rel="noopener noreferrer nofollow" className={NAME_LINK}>
                  {move.name}
                </a>
                <div className="text-xs text-zinc-500">{storeLabel(move.site)}</div>
              </td>
              <td data-label="Was" className={`${CELL} text-zinc-400`}>
                {formatPrice(move.from)}
              </td>
              <td data-label="Now" className={`${CELL} text-white`}>
                {formatPrice(move.to)}
              </td>
              <td data-label="Change" className={`${CELL} font-semibold ${tone}`}>
                {signedPct(move.changePct)}
              </td>
              <td data-label="When" className={`${CELL} text-xs text-zinc-500 whitespace-nowrap`}>
                {ageLabel(move.changedAt, now)}
              </td>
            </tr>
          ))}
          {moves.length === 0 && <Empty columns={5}>{empty}</Empty>}
        </tbody>
      </table>
    </div>
  );
}
