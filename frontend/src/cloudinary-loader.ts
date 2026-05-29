type ImageLoaderProps = { src: string; width: number; quality?: number };

export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  const q = quality ?? (width <= 150 ? 50 : 75);
  if (!src.includes('res.cloudinary.com')) return src;

  const uploadIdx = src.indexOf('/upload/');
  if (uploadIdx === -1) return src;

  const base = src.slice(0, uploadIdx + '/upload/'.length);
  // Strip any existing transform segments (e.g. "q_auto/f_auto/") — they contain underscores
  const rest = src.slice(uploadIdx + '/upload/'.length).replace(/^([\w,]+_[\w,]+\/)+/, '');

  return `${base}w_${width},q_${q},f_auto/${rest}`;
}
