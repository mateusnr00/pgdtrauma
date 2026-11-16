'use client';

import { useId, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import type { Media, Video } from '@/content/schema';
import { BASE_PATH } from '@/lib/base-path';
import s from '../admin.module.css';

const safeName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9.]+/g, '-')
    .toLowerCase();

async function uploadFile(file: File, onProgress: (pct: number) => void) {
  const blob = await upload(`media/${safeName(file.name)}`, file, {
    access: 'public',
    handleUploadUrl: `${BASE_PATH}/api/admin/upload`,
    multipart: file.size > 20 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => onProgress(Math.round(percentage)),
  });
  return blob.url;
}

const MAX_SIDE = 2400;
const isHeic = (file: File) => /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

/**
 * Prepares a photo for the web before it leaves the browser: fixes the rotation, shrinks phone
 * photos (often 4000px+, 8MB+) to at most 2400px and re-encodes them. PNG/WebP keep transparency
 * (as WebP); everything else becomes JPEG. SVG and GIF go as they are.
 */
async function prepareImage(file: File): Promise<{ file: File; width: number; height: number }> {
  if (/svg|gif/i.test(file.type)) {
    const size = await readImageSize(file);
    return { file, ...size };
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    if (isHeic(file)) {
      throw new Error(
        'Essa foto está no formato HEIC (padrão do iPhone), que o navegador não abre. No iPhone, abra a foto e use Compartilhar → Salvar em Arquivos como JPG, ou tire um print da foto, e envie de novo.',
      );
    }
    throw new Error('Não foi possível abrir essa imagem. Envie uma foto em JPG ou PNG.');
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível preparar a imagem neste navegador.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const keepAlpha = /png|webp/i.test(file.type);
  const type = keepAlpha ? 'image/webp' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, keepAlpha ? 0.9 : 0.86));
  if (!blob) throw new Error('Não foi possível preparar a imagem neste navegador.');
  const base = file.name.replace(/\.[^.]+$/, '') || 'imagem';
  return { file: new File([blob], `${base}.${keepAlpha ? 'webp' : 'jpg'}`, { type }), width, height };
}

/** Turns technical upload errors into something the editor can act on. */
function friendly(error: unknown) {
  const message = (error as Error)?.message || '';
  if (/autorizado|unauthori|403|401/i.test(message)) return 'Sua sessão expirou. Saia e entre de novo no painel, depois envie a imagem outra vez.';
  if (/content type|not allowed|tipo/i.test(message)) return 'Formato de arquivo não aceito. Envie a foto em JPG ou PNG.';
  if (/network|fetch|failed to fetch/i.test(message)) return 'A conexão caiu durante o envio. Verifique a internet e tente de novo.';
  return message || 'Falha no envio. Tente de novo.';
}

function readImageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 1000, height: img.naturalHeight || 1000 });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    img.src = url;
  });
}

function useUploader() {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async <T,>(task: (onProgress: (n: number) => void) => Promise<T>) => {
    setError(null);
    setProgress(0);
    try {
      return await task(setProgress);
    } catch (e) {
      setError(friendly(e));
      return null;
    } finally {
      setProgress(null);
    }
  };
  return { progress, error, run };
}

export function ImageField({ label, hint, value, onChange }: { label: string; hint?: string; value: unknown; onChange: (v: Media) => void }) {
  const media = (value ?? { src: '', width: 1000, height: 1000, alt: '' }) as Media;
  const input = useRef<HTMLInputElement>(null);
  const altId = useId();
  const { progress, error, run } = useUploader();
  const [justUploaded, setJustUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setJustUploaded(false);
    const result = await run(async (onProgress) => {
      const prepared = await prepareImage(file);
      const src = await uploadFile(prepared.file, onProgress);
      return { width: prepared.width, height: prepared.height, src };
    });
    if (result) {
      onChange({ ...media, ...result });
      setJustUploaded(true);
    }
  };

  return (
    <div className={s.field}>
      <p className={s.label}>{label}</p>
      <div className={s.media}>
        <div
          className={s.thumb}
          data-dragging={dragging || undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
        >
          {media.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary uploads
            <img src={media.src} alt="" />
          ) : (
            <span className={s.thumbEmpty}>Arraste uma foto aqui</span>
          )}
        </div>
        <div className={s.mediaSide}>
          <div className={s.mediaButtons}>
            <button type="button" className={s.secondaryBtn} onClick={() => input.current?.click()} disabled={progress !== null}>
              {progress !== null ? `Enviando… ${progress}%` : media.src ? 'Trocar imagem' : 'Enviar imagem'}
            </button>
            <input ref={input} type="file" accept="image/*,.heic,.heif" hidden onChange={(e) => pick(e.target.files?.[0]).then(() => (e.target.value = ''))} />
          </div>
          {media.src && (
            <p className={s.hint}>
              {media.width} × {media.height} px
            </p>
          )}
          {hint && <p className={s.hint}>{hint}</p>}
          {error && (
            <p className={s.error} role="alert">
              {error}
            </p>
          )}
          {justUploaded && !error && (
            <p className={s.success} role="status">
              Imagem enviada. Clique em <b>Publicar</b>, no topo, para ela aparecer no site.
            </p>
          )}
          <label htmlFor={altId} className={s.subLabel}>
            Descrição da imagem (acessibilidade e Google)
          </label>
          <textarea id={altId} className={s.input} rows={2} value={media.alt} onChange={(e) => onChange({ ...media, alt: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

export function VideoField({ label, value, onChange }: { label: string; value: unknown; onChange: (v: Video) => void }) {
  const video = (value ?? { mp4: '', webm: '', poster: '', label: '' }) as Video;
  const mp4Input = useRef<HTMLInputElement>(null);
  const posterInput = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const { progress, error, run } = useUploader();

  const pickVideo = async (file: File | undefined) => {
    if (!file) return;
    const src = await run((onProgress) => uploadFile(file, onProgress));
    // A new upload replaces both sources; the WebM version only exists for the original video.
    if (src) onChange({ ...video, mp4: src, webm: '' });
  };
  const pickPoster = async (file: File | undefined) => {
    if (!file) return;
    const src = await run((onProgress) => uploadFile(file, onProgress));
    if (src) onChange({ ...video, poster: src });
  };

  return (
    <div className={s.field}>
      <p className={s.label}>{label}</p>
      <div className={s.media}>
        <div className={s.thumb} data-wide>
          {video.mp4 || video.webm ? (
            <video src={video.mp4 || video.webm} poster={video.poster || undefined} muted controls playsInline preload="metadata" />
          ) : (
            <span className={s.thumbEmpty}>Sem vídeo</span>
          )}
        </div>
        <div className={s.mediaSide}>
          <div className={s.mediaButtons}>
            <button type="button" className={s.secondaryBtn} onClick={() => mp4Input.current?.click()} disabled={progress !== null}>
              {progress !== null ? `Enviando… ${progress}%` : 'Trocar vídeo'}
            </button>
            <button type="button" className={s.secondaryBtn} onClick={() => posterInput.current?.click()} disabled={progress !== null}>
              Trocar capa do vídeo
            </button>
            <input ref={mp4Input} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => pickVideo(e.target.files?.[0]).then(() => (e.target.value = ''))} />
            <input ref={posterInput} type="file" accept="image/*" hidden onChange={(e) => pickPoster(e.target.files?.[0]).then(() => (e.target.value = ''))} />
          </div>
          <p className={s.hint}>MP4 (H.264) é o formato mais compatível. O vídeo toca sem som; prefira arquivos curtos e leves.</p>
          {error && <p className={s.error}>{error}</p>}
          <label htmlFor={labelId} className={s.subLabel}>
            Descrição do vídeo (acessibilidade)
          </label>
          <textarea id={labelId} className={s.input} rows={2} value={video.label} onChange={(e) => onChange({ ...video, label: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
