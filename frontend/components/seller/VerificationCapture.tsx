'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sellerApi } from '@/lib/sellerApi';
import type { SellerOrder, VerificationAngle } from '@/types/seller';
import { compressImage } from '@/lib/compressImage';
import { uploadVerificationPhoto } from '@/lib/sellerUpload';
import { cn } from '@/lib/utils';
import { btnPrimary, Spinner, useHandleApiError, useToast } from '@/components/seller/SellerShell';

const FALLBACK_ANGLES: VerificationAngle[] = [
  { id: 'side-lateral', label: 'Lateral side', required: true },
  { id: 'side-medial', label: 'Medial side', required: true },
  { id: 'top-down', label: 'Top down', required: true },
  { id: 'heel', label: 'Heel', required: true },
  { id: 'sole', label: 'Sole', required: true },
  { id: 'size-tag', label: 'Size tag', required: true },
  { id: 'tongue', label: 'Tongue label', required: false },
  { id: 'box-label', label: 'Box label', required: false },
];

const TIPS: Record<string, string> = {
  'side-lateral': 'Outer side, whole shoe in frame, good light',
  'side-medial': 'Inner side showing the arch, whole shoe in frame',
  'top-down': 'From above with laces and toe box visible',
  heel: 'Straight on at the heel tab and logo',
  sole: 'Flip the shoe, show the full outsole',
  'size-tag': 'Inside label with size and SKU, sharp and readable',
  tongue: 'Close up of the tongue tag or label',
  'box-label': 'Box label with SKU, size and barcode',
};

interface SlotState {
  url?: string;
  preview?: string;
  uploading: boolean;
  error?: string;
}

interface Props {
  orderId: string;
  onSubmitted: (order: SellerOrder) => void;
  rejectedNote?: string;
}

function CameraModal({
  angle,
  tip,
  onCapture,
  onClose,
  onUnavailable,
}: {
  angle: VerificationAngle;
  tip: string;
  onCapture: (file: File) => void;
  onClose: () => void;
  onUnavailable: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play().catch(() => {});
            setReady(true);
          };
        }
      } catch {
        if (!cancelled) {
          setError('Live camera is not available here. Use your phone camera instead.');
          onUnavailable();
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onUnavailable]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `${angle.id}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  }, [angle.id, onCapture]);

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label={`Capture ${angle.label}`}>
      <div className="flex items-start justify-between gap-3 px-4 py-3 bg-black/80">
        <div>
          <p className="text-white font-bold text-sm">{angle.label}</p>
          <p className="text-zinc-400 text-[11px] mt-0.5">{tip}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close camera" className="text-zinc-400 hover:text-white transition-colors p-2 -m-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <p className="text-white font-bold mb-2">Camera unavailable</p>
            <p className="text-zinc-400 text-sm mb-6">{error}</p>
            <label className={cn(btnPrimary, 'bg-white text-zinc-900 hover:bg-zinc-200 cursor-pointer')}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onCapture(file);
                  e.target.value = '';
                }}
              />
              Open phone camera
            </label>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            {ready && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="border-2 border-white/40 w-[78%] aspect-[4/3]" />
              </div>
            )}
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {!error && (
        <div className="flex items-center justify-center py-7 bg-black/80" style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={capture}
            disabled={!ready}
            aria-label="Take photo"
            className="w-[72px] h-[72px] rounded-full bg-white disabled:opacity-30 flex items-center justify-center shadow-[0_0_0_5px_rgba(255,255,255,0.25)] active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-white border-[3px] border-zinc-900" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerificationCapture({ orderId, onSubmitted, rejectedNote }: Props) {
  const handleError = useHandleApiError();
  const { show } = useToast();
  const [angles, setAngles] = useState<VerificationAngle[]>(FALLBACK_ANGLES);
  const [slots, setSlots] = useState<Record<string, SlotState>>({});
  const [cameraAngle, setCameraAngle] = useState<VerificationAngle | null>(null);
  const [fallback, setFallback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const previews = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    sellerApi
      .config()
      .then((cfg) => {
        if (!cancelled && Array.isArray(cfg.angles) && cfg.angles.length > 0) setAngles(cfg.angles);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const list = previews.current;
    return () => {
      list.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const handleFile = useCallback(async (angleId: string, file: File) => {
    const preview = URL.createObjectURL(file);
    previews.current.push(preview);
    setSlots((prev) => ({ ...prev, [angleId]: { preview, uploading: true } }));
    try {
      const compressed = await compressImage(file).catch(() => file);
      const url = await uploadVerificationPhoto(compressed);
      setSlots((prev) => ({ ...prev, [angleId]: { preview, url, uploading: false } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      show(`Photo upload failed: ${message}`, 'error');
      setSlots((prev) => ({ ...prev, [angleId]: { uploading: false, error: message } }));
    }
  }, [show]);

  const onUnavailable = useCallback(() => setFallback(true), []);

  const required = useMemo(() => angles.filter((a) => a.required), [angles]);
  const requiredDone = required.filter((a) => slots[a.id]?.url).length;
  const anyUploading = Object.values(slots).some((s) => s.uploading);
  const allRequired = requiredDone === required.length && required.length > 0;
  const pct = required.length ? Math.round((requiredDone / required.length) * 100) : 0;

  async function handleSubmit() {
    const photos = angles.filter((a) => slots[a.id]?.url).map((a) => ({ angle: a.id, url: slots[a.id].url as string }));
    setSubmitting(true);
    try {
      const order = await sellerApi.submitVerification(orderId, photos);
      onSubmitted(order);
    } catch (err) {
      show(handleError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function slotInner(angle: VerificationAngle, slot: SlotState | undefined) {
    const tip = TIPS[angle.id] ?? '';
    if (slot?.uploading) {
      return (
        <>
          {slot.preview && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slot.preview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            </>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Spinner className="border-zinc-300 border-t-zinc-900" />
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-700">Uploading</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-200 overflow-hidden">
            <div className="h-full w-full bg-zinc-900 animate-pulse" />
          </div>
        </>
      );
    }
    if (slot?.url) {
      return (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slot.preview ?? slot.url} alt={angle.label} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white px-2 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold truncate">{angle.label}</span>
            <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-200">Retake</span>
          </div>
        </>
      );
    }
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
        <svg className={cn('w-7 h-7 mb-2', slot?.error ? 'text-red-400' : 'text-zinc-300')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h3l2-3h6l2 3h3v11H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        <p className="text-xs font-bold text-zinc-900 leading-tight">{angle.label}</p>
        {angle.required ? (
          <p className="text-[9px] font-bold tracking-widest uppercase text-red-600 mt-0.5">Required</p>
        ) : (
          <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mt-0.5">Optional</p>
        )}
        {slot?.error ? (
          <p className="text-[10px] text-red-600 mt-1 leading-tight">{slot.error}</p>
        ) : (
          <p className="text-[10px] text-zinc-400 mt-1 leading-tight hidden sm:block">{tip}</p>
        )}
      </div>
    );
  }

  const slotClass = (slot: SlotState | undefined) =>
    cn(
      'relative block aspect-square border-2 overflow-hidden text-left transition-colors cursor-pointer select-none',
      slot?.url ? 'border-emerald-400 bg-emerald-50' : slot?.error ? 'border-red-300 bg-red-50' : 'border-dashed border-zinc-300 bg-white hover:border-zinc-900',
      slot?.uploading && 'pointer-events-none',
    );

  return (
    <div className="bg-white border border-zinc-200">
      <div className="px-4 sm:px-5 py-4 border-b border-zinc-100">
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Step 1 of 2</p>
        <h2 className="text-lg font-black tracking-tight text-zinc-900 mt-0.5">{rejectedNote !== undefined ? 'Retake verification photos' : 'Verify this pair'}</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Photos must be taken live from your camera so SNKRS CART can confirm the exact pair being shipped.
        </p>
      </div>

      {rejectedNote !== undefined && (
        <div className="mx-4 sm:mx-5 mt-4 border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-[10px] font-bold tracking-widest uppercase text-amber-700 mb-1">Why the last set was rejected</p>
          <p className="text-sm text-amber-900 whitespace-pre-line">{rejectedNote || 'SNKRS CART asked for a clearer set of photos.'}</p>
        </div>
      )}

      {fallback && (
        <p className="mx-4 sm:mx-5 mt-4 text-xs text-zinc-600 border border-zinc-200 bg-zinc-50 px-3 py-2">
          Live camera is not available in this browser, so each slot opens your phone camera instead.
        </p>
      )}

      <div className="px-4 sm:px-5 pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-zinc-900">
            {requiredDone} of {required.length} required photos
          </p>
          <p className="text-[11px] text-zinc-400">{angles.length - required.length} optional</p>
        </div>
        <div className="h-1.5 bg-zinc-100 overflow-hidden">
          <div className={cn('h-full transition-all', allRequired ? 'bg-emerald-500' : 'bg-zinc-900')} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {angles.map((angle) => {
          const slot = slots[angle.id];
          const inner = slotInner(angle, slot);
          if (fallback) {
            return (
              <label key={angle.id} className={slotClass(slot)}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  disabled={!!slot?.uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(angle.id, file);
                    e.target.value = '';
                  }}
                />
                {inner}
              </label>
            );
          }
          return (
            <button key={angle.id} type="button" onClick={() => setCameraAngle(angle)} disabled={!!slot?.uploading} className={slotClass(slot)}>
              {inner}
            </button>
          );
        })}
      </div>

      <div className="px-4 sm:px-5 py-4 border-t border-zinc-100">
        <button type="button" onClick={handleSubmit} disabled={!allRequired || anyUploading || submitting} className={`${btnPrimary} w-full`}>
          {submitting ? 'Submitting...' : anyUploading ? 'Uploading photos...' : allRequired ? 'Submit photos for review' : `Add ${required.length - requiredDone} more required photo${required.length - requiredDone === 1 ? '' : 's'}`}
        </button>
        <p className="text-[11px] text-zinc-400 mt-2 text-center">SNKRS CART usually reviews photos within a few hours. You will add tracking after approval.</p>
      </div>

      {cameraAngle && (
        <CameraModal
          angle={cameraAngle}
          tip={TIPS[cameraAngle.id] ?? ''}
          onCapture={(file) => {
            const id = cameraAngle.id;
            setCameraAngle(null);
            handleFile(id, file);
          }}
          onClose={() => setCameraAngle(null)}
          onUnavailable={onUnavailable}
        />
      )}
    </div>
  );
}
