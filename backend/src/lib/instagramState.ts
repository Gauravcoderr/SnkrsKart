// Lifecycle of an Instagram post. Every status change in the routes and the
// publish job goes through nextStatus(), so an illegal jump (for example
// re-publishing a published post) is impossible by construction.

export const IG_STATUSES = ['draft', 'approved', 'publishing', 'published', 'failed', 'rejected'] as const;
export type IgStatus = (typeof IG_STATUSES)[number];

export type IgAction =
  | 'approve'
  | 'unapprove'
  | 'reject'
  | 'reopen'
  | 'edit'
  | 'claim'
  | 'succeed'
  | 'fail'
  | 'retryLater'
  | 'retry';

const TRANSITIONS: Record<IgStatus, Partial<Record<IgAction, IgStatus>>> = {
  draft: { approve: 'approved', reject: 'rejected', edit: 'draft' },
  approved: { unapprove: 'draft', reject: 'rejected', edit: 'draft', claim: 'publishing' },
  publishing: { succeed: 'published', fail: 'failed', retryLater: 'approved' },
  published: {},
  failed: { retry: 'approved', edit: 'draft', reject: 'rejected' },
  rejected: { reopen: 'draft', edit: 'draft' },
};

export function nextStatus(from: IgStatus, action: IgAction): IgStatus | null {
  return TRANSITIONS[from]?.[action] ?? null;
}

export function isEditable(status: IgStatus): boolean {
  return nextStatus(status, 'edit') !== null;
}

export const MAX_PUBLISH_ATTEMPTS = 3;
export const RETRY_DELAY_MINUTES = 15;

export interface PublishFailure {
  message: string;
  transient: boolean;
  stage: 'container' | 'status' | 'publish' | 'permalink' | 'precheck';
}

// After a failed attempt: retry transient container errors with backoff, but
// never retry once media_publish itself was called, because Instagram may
// have posted it and a retry would post twice.
export function decideAfterFailure(
  failure: PublishFailure,
  attempts: number,
  now: Date,
): { action: 'retryLater' | 'fail'; scheduledAt?: Date } {
  const retryable = failure.transient && failure.stage !== 'publish' && attempts < MAX_PUBLISH_ATTEMPTS;
  if (!retryable) return { action: 'fail' };
  return { action: 'retryLater', scheduledAt: new Date(now.getTime() + RETRY_DELAY_MINUTES * attempts * 60_000) };
}
