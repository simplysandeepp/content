#!/usr/bin/env node
/**
 * Compresses public/projects/*.png to WebP at ~150-200KB target.
 * Deletes originals only after WebP writes succeed. Idempotent.
 *
 * Usage: node scripts/compress-project-images.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.join(process.cwd(), 'public', 'projects');
const TARGET_KB = 200;
const MAX_WIDTH = 1600;

async function fileSize(p) {
  const s = await fs.stat(p);
  return s.size;
}

async function compress(pngPath) {
  const base = pngPath.replace(/\.png$/i, '');
  const webpPath = `${base}.webp`;
  const buf = await fs.readFile(pngPath);
  const meta = await sharp(buf).metadata();
  const targetWidth = meta.width && meta.width > MAX_WIDTH ? MAX_WIDTH : meta.width;

  for (const quality of [82, 78, 72, 66, 60, 55, 50]) {
    const out = await sharp(buf)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer();
    await fs.writeFile(webpPath, out);
    const kb = Math.round(out.length / 1024);
    if (kb <= TARGET_KB || quality === 50) {
      return { webpPath, kb, quality };
    }
  }
}

async function main() {
  const entries = await fs.readdir(DIR);
  const pngs = entries.filter((f) => f.toLowerCase().endsWith('.png'));
  if (pngs.length === 0) {
    console.log('No PNGs to compress.');
    return;
  }
  let totalBefore = 0;
  let totalAfter = 0;
  for (const png of pngs) {
    const full = path.join(DIR, png);
    const before = await fileSize(full);
    totalBefore += before;
    const { webpPath, kb, quality } = await compress(full);
    totalAfter += kb * 1024;
    console.log(
      `${png}: ${Math.round(before / 1024)}KB → ${kb}KB @ q${quality}`
    );
    await fs.unlink(full);
  }
  console.log(
    `\nTotal: ${Math.round(totalBefore / 1024)}KB → ${Math.round(
      totalAfter / 1024
    )}KB (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
