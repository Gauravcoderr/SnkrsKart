'use client';

interface ScraperStatusPanelProps {
  status: {
    github: { status: string; conclusion: string | null; startedAt: string; updatedAt: string; runUrl: string } | null;
    render: { status: string; startedAt?: string; finishedAt?: string; error?: string; result?: { inserted: number; updated: number; shopifyFailed: boolean; nikeFailed: boolean } };
  };
}

export default function ScraperStatusPanel({ status }: ScraperStatusPanelProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {status.github ? (() => {
        const gh = status.github;
        const isDone = gh.status === 'completed';
        const isOk = isDone && gh.conclusion === 'success';
        const isFailed = isDone && gh.conclusion !== 'success';
        const isRunning = !isDone;
        return (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            isOk ? 'bg-green-950/40 border-green-800 text-green-300' :
            isFailed ? 'bg-red-950/40 border-red-800 text-red-300' :
            'bg-yellow-950/40 border-yellow-800 text-yellow-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOk ? 'bg-green-400' : isFailed ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
            <span>GitHub Actions</span>
            <span className="text-zinc-500">—</span>
            <span>{isRunning ? (gh.status === 'in_progress' ? 'running' : 'queued') : isOk ? 'success' : gh.conclusion ?? 'failed'}</span>
            {gh.runUrl && (
              <a href={gh.runUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 underline ml-1">
                view
              </a>
            )}
          </div>
        );
      })() : null}

      {status.render && status.render.status !== 'idle' && (() => {
        const r = status.render;
        const isRunning = r.status === 'running';
        const isDone = r.status === 'done';
        const isFailed = r.status === 'failed';
        return (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            isDone && !r.result?.shopifyFailed && !r.result?.nikeFailed ? 'bg-green-950/40 border-green-800 text-green-300' :
            isFailed || (isDone && (r.result?.shopifyFailed || r.result?.nikeFailed)) ? 'bg-red-950/40 border-red-800 text-red-300' :
            'bg-yellow-950/40 border-yellow-800 text-yellow-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isDone && !r.result?.shopifyFailed && !r.result?.nikeFailed ? 'bg-green-400' :
              isFailed || (isDone && (r.result?.shopifyFailed || r.result?.nikeFailed)) ? 'bg-red-400' :
              'bg-yellow-400 animate-pulse'
            }`} />
            <span>Render (Shopify + Nike)</span>
            <span className="text-zinc-500">—</span>
            {isRunning && <span>running</span>}
            {isDone && (
              <span>
                {r.result?.shopifyFailed && r.result?.nikeFailed ? 'both failed' :
                 r.result?.shopifyFailed ? 'shopify failed' :
                 r.result?.nikeFailed ? 'nike failed' :
                 `+${r.result?.inserted ?? 0} new`}
              </span>
            )}
            {isFailed && <span title={r.error}>failed</span>}
          </div>
        );
      })()}
    </div>
  );
}
