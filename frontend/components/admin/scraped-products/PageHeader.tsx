'use client';

interface PageHeaderProps {
  runningCron: boolean;
  scraperLocked: boolean;
  scraperCooldownMinsLeft: number;
  onRunScraper: () => void;
}

export default function PageHeader({ runningCron, scraperLocked, scraperCooldownMinsLeft, onRunScraper }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-white">Scraped Products</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Draft sneakers scraped from 6 sites — review, edit, and publish as real products.
        </p>
      </div>
      <button
        type="button"
        onClick={onRunScraper}
        disabled={scraperLocked}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white text-zinc-900 rounded-lg hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {runningCron ? (
          <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        {scraperCooldownMinsLeft > 0
          ? `Scraping... ~${scraperCooldownMinsLeft}m left`
          : 'Run Scraper Now'}
      </button>
    </div>
  );
}
