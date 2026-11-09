/**
 * Asset pipeline: turns the raw materials in /_source into web-ready media in /public/media.
 *
 *   npm run assets
 *
 * - Book renders delivered as JPG over a fake checkerboard are cut out with a convex-hull
 *   mask (a hardcover silhouette is convex), then exported as transparent PNG masters.
 *   next/image serves them as AVIF/WebP at the right sizes.
 * - The transparent front+back render embedded in the presentation .docx is extracted.
 * - The printed-copies video is trimmed of audio, lightly graded and re-encoded (MP4 + WebM).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';
import JSZip from 'jszip';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, '_source');
const OUT = path.join(ROOT, 'public', 'media');
fs.mkdirSync(OUT, { recursive: true });

/** Cut a book out of a light, neutral (checkerboard) background. */
async function cutout(input, output, inset = 1.2) {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;

  // 1. Core mask: anything dark or chromatic belongs to the book.
  const core = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    core[i] = lum < 165 || Math.max(r, g, b) - Math.min(r, g, b) > 28 ? 1 : 0;
  }

  // 2. Keep the largest connected component (drops checkerboard noise).
  const label = new Int32Array(W * H);
  const stack = new Int32Array(W * H);
  let best = 0, bestSize = 0, current = 0;
  for (let s = 0; s < W * H; s++) {
    if (!core[s] || label[s]) continue;
    current++;
    let size = 0, sp = 0;
    stack[sp++] = s;
    label[s] = current;
    while (sp) {
      const p = stack[--sp];
      size++;
      const x = p % W, y = (p / W) | 0;
      const nb = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
      for (const q of nb) if (q >= 0 && core[q] && !label[q]) { label[q] = current; stack[sp++] = q; }
    }
    if (size > bestSize) { bestSize = size; best = current; }
  }

  // 3. Convex hull of that component (recovers the light page block between the boards).
  const pts = [];
  for (let y = 0; y < H; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (label[y * W + x] === best) { if (l < 0) l = x; r = x; }
    if (l >= 0) pts.push([l, y], [r + 1, y], [l, y + 1], [r + 1, y + 1]);
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), p) <= 0) lower.pop();
    lower.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), p) <= 0) upper.pop();
    upper.push(p);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  const edges = hull.map((a, i) => {
    const b = hull[(i + 1) % hull.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    return [a[0], a[1], dx / len, dy / len];
  });

  // 4. Anti-aliased alpha from the signed distance to the hull, inset to drop the light fringe.
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (const [x, y] of hull) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let alpha = 0;
      if (x >= minX - 2 && x <= maxX + 2 && y >= minY - 2 && y <= maxY + 2) {
        let d = Infinity;
        const px = x + 0.5, py = y + 0.5;
        for (const [ax, ay, ux, uy] of edges) d = Math.min(d, -((px - ax) * uy - (py - ay) * ux));
        alpha = Math.max(0, Math.min(1, d - inset + 0.5));
      }
      rgba[i * 4] = data[i * C]; rgba[i * 4 + 1] = data[i * C + 1]; rgba[i * 4 + 2] = data[i * C + 2];
      rgba[i * 4 + 3] = Math.round(alpha * 255);
    }
  }
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .trim({ threshold: 0 })
    .png({ compressionLevel: 9 })
    .toFile(output);
}

/** Pull the transparent front+back render out of the presentation .docx (a zip). */
async function extractDocxRender() {
  const zip = await JSZip.loadAsync(fs.readFileSync(path.join(SRC, 'apresentacao.docx')));
  const entry = Object.keys(zip.files).find((f) => f.startsWith('word/media/') && f.endsWith('.png'));
  const pair = sharp(await zip.file(entry).async('nodebuffer'));
  await pair.clone().trim({ threshold: 0 }).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'book-pair.png'));

  // Back cover on its own: the right-hand book of the pair.
  const meta = await sharp(path.join(OUT, 'book-pair.png')).metadata();
  const { data, info } = await sharp(path.join(OUT, 'book-pair.png')).raw().toBuffer({ resolveWithObject: true });
  // Find the transparent gutter between the two books along the vertical middle.
  const y = Math.round(info.height / 2);
  let gap = Math.round(info.width / 2);
  for (let x = Math.round(info.width * 0.4); x < info.width * 0.7; x++) {
    if (data[(y * info.width + x) * 4 + 3] < 8) { gap = x; break; }
  }
  await sharp(path.join(OUT, 'book-pair.png'))
    .extract({ left: gap, top: 0, width: meta.width - gap, height: meta.height })
    .trim({ threshold: 0 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'book-back.png'));
}

async function photos() {
  // Real photograph of the printed book. Keep it honest: crop only.
  await sharp(path.join(SRC, 'img-c.jpg'))
    .extract({ left: 0, top: 160, width: 899, height: 1300 })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(OUT, 'book-photo.jpg'));
}

async function social() {
  // 1200×630 share image: the front+back render on the deep green of the cover.
  const W = 1200, H = 630;
  const glow = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="55%" r="60%">
          <stop offset="0%" stop-color="#173f2d"/>
          <stop offset="55%" stop-color="#0a1f16"/>
          <stop offset="100%" stop-color="#050c08"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`,
  );
  const book = await sharp(path.join(OUT, 'book-pair.png')).resize({ height: 560 }).toBuffer();
  const bm = await sharp(book).metadata();
  await sharp(glow)
    .composite([{ input: book, left: Math.round((W - bm.width) / 2), top: Math.round((H - bm.height) / 2) + 8 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(OUT, 'og.jpg'));
}

function video() {
  const input = path.join(SRC, 'video-b.mp4');
  const grade = 'eq=brightness=-0.03:contrast=1.06:saturation=0.92,scale=1024:-2';
  const common = ['-y', '-v', 'error', '-i', input, '-an', '-vf', grade];
  execFileSync(ffmpeg, [...common, '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(OUT, 'printed.mp4')]);
  execFileSync(ffmpeg, [...common, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', path.join(OUT, 'printed.webm')]);
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-ss', '0.4', '-i', input, '-frames:v', '1', '-vf', grade, '-q:v', '3', path.join(OUT, 'printed-poster.jpg')]);
}

await cutout(path.join(SRC, 'img-a.jpg'), path.join(OUT, 'book-angle.png'));
await cutout(path.join(SRC, 'img-d.jpg'), path.join(OUT, 'book-front.png'));
await extractDocxRender();
await photos();
await social();
video();

for (const f of fs.readdirSync(OUT)) {
  const p = path.join(OUT, f);
  const size = (fs.statSync(p).size / 1024).toFixed(0);
  const dims = /\.(png|jpg)$/.test(f) ? await sharp(p).metadata().then((m) => `${m.width}×${m.height}`) : '';
  console.log(f.padEnd(22), `${size} KB`.padStart(9), dims);
}
