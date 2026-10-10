// Instagram content rules shared by the admin routes, the publisher and the
// draft CLI. Pure functions only, so they can be unit tested without Mongo.

export const IG_KINDS = ['IMAGE', 'CAROUSEL', 'REELS', 'STORIES'] as const;
export type IgKind = (typeof IG_KINDS)[number];

export const IG_SOURCE_KINDS = ['drop', 'blog', 'sneaker', 'manual'] as const;
export type IgSourceKind = (typeof IG_SOURCE_KINDS)[number];

export const CAPTION_MAX = 2200;
// Instagram cut hashtags to 5 per post on 18 Dec 2025. The API still accepts
// up to 30, but we hold ourselves to the app rule.
export const HASHTAG_MAX = 5;
export const MENTION_MAX = 20;
export const FEED_PREVIEW_CHARS = 125;
export const CAROUSEL_MIN = 2;
export const CAROUSEL_MAX = 10;
export const ALT_TEXT_MAX = 1000;

export interface IgMediaItem {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  altText?: string;
}

export interface IgPostShape {
  kind: IgKind;
  caption: string;
  media: IgMediaItem[];
  coverUrl?: string;
}

export function countHashtags(caption: string): number {
  return (caption.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).length;
}

export function countMentions(caption: string): number {
  return (caption.match(/(^|\s)@[A-Za-z0-9._]+/g) || []).length;
}

export function feedPreview(caption: string): string {
  return caption.length <= FEED_PREVIEW_CHARS ? caption : caption.slice(0, FEED_PREVIEW_CHARS);
}

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

// Instagram's Content Publishing API only accepts JPEG for images. Cloudinary
// converts on the fly when the URL asks for f_jpg and a .jpg extension, so a
// PNG or WebP upload still reaches Instagram as JPEG.
export function toInstagramJpeg(url: string): string {
  const m = url.match(CLOUDINARY_UPLOAD);
  if (!m) return url;
  const [, base, rest] = m;
  const withFormat = /(^|[,/])f_jpg([,/]|$)/.test(rest) ? rest : `f_jpg,q_90/${rest}`;
  const [pathPart, query = ''] = withFormat.split('?');
  const jpgPath = pathPart.replace(/\.(png|webp|avif|gif|jpeg|heic)$/i, '.jpg');
  const finalPath = /\.[a-z0-9]{2,5}$/i.test(jpgPath) ? jpgPath : `${jpgPath}.jpg`;
  return `${base}${finalPath}${query ? `?${query}` : ''}`;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function looksLikeJpeg(url: string): boolean {
  return CLOUDINARY_UPLOAD.test(url) || /\.jpe?g(\?|$)/i.test(url);
}

// Returns human readable problems. Empty array means the post can be approved.
export function validatePost(post: IgPostShape): string[] {
  const errors: string[] = [];
  const caption = post.caption ?? '';

  if (!IG_KINDS.includes(post.kind)) errors.push(`Unknown post kind "${post.kind}"`);

  if (post.kind !== 'STORIES') {
    if (!caption.trim()) errors.push('Caption is empty');
    if (caption.length > CAPTION_MAX) errors.push(`Caption is ${caption.length} characters, the limit is ${CAPTION_MAX}`);
    const tags = countHashtags(caption);
    if (tags > HASHTAG_MAX) errors.push(`Caption has ${tags} hashtags, the limit is ${HASHTAG_MAX}`);
    const mentions = countMentions(caption);
    if (mentions > MENTION_MAX) errors.push(`Caption has ${mentions} mentions, the limit is ${MENTION_MAX}`);
    if (/\u2014/.test(caption)) errors.push('Caption contains an em dash, run it through /ig-human');
  }
  if (/\{\{[^}]*\}\}/.test(caption)) errors.push('Caption still has a {{placeholder}} to fill in');

  const media = post.media ?? [];
  if (media.length === 0) errors.push('No media attached');

  if (post.kind === 'IMAGE' && media.length !== 1) errors.push('An image post takes exactly one image');
  if (post.kind === 'IMAGE' && media[0] && media[0].type !== 'IMAGE') errors.push('An image post needs an image, not a video');
  if (post.kind === 'REELS' && (media.length !== 1 || media[0]?.type !== 'VIDEO')) errors.push('A reel takes exactly one video');
  if (post.kind === 'STORIES' && media.length !== 1) errors.push('A story takes exactly one image or video');
  if (post.kind === 'CAROUSEL' && (media.length < CAROUSEL_MIN || media.length > CAROUSEL_MAX)) {
    errors.push(`A carousel takes ${CAROUSEL_MIN} to ${CAROUSEL_MAX} items, this one has ${media.length}`);
  }

  media.forEach((m, i) => {
    const n = i + 1;
    if (!isHttpsUrl(m.url)) errors.push(`Item ${n} is not a public https URL`);
    else if (m.type === 'IMAGE' && !looksLikeJpeg(m.url)) errors.push(`Item ${n} must be a JPEG or a Cloudinary image`);
    if (m.altText && m.altText.length > ALT_TEXT_MAX) errors.push(`Item ${n} alt text is over ${ALT_TEXT_MAX} characters`);
  });

  if (post.coverUrl && !isHttpsUrl(post.coverUrl)) errors.push('Reel cover is not a public https URL');

  return errors;
}
