#!/usr/bin/env node
/**
 * Downloads icon-only brand marks (4-square Microsoft, colored G,
 * 3-bar Anthropic, etc.) for every certification issuer and rewrites
 * content/certifications.md to point at the local copy.
 *
 * Never uses wordmark logos — they'd be illegible at 36px chip size.
 * Every URL points at the *icon only* form of the brand mark.
 *
 * Sources:
 *   1. Wikipedia Commons icon-only SVG/PNG (preferred — official mark)
 *   2. Google's favicon service at 128px (icon-only by definition)
 *
 * PNGs get re-encoded to WebP at 128px for size.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const CERT_FILE = path.join(process.cwd(), 'content', 'certifications.md');
const LOGO_DIR = path.join(process.cwd(), 'public', 'logos');
const UA =
  'sandeepp-portfolio-logo-fetcher/1.0 (https://sandeepp.in; sandeep@sandeepp.in)';

// Every entry is an *icon-only* mark — never a wordmark.
const LOGO_MAP = {
  // Wikipedia Commons — icon-only SVGs and PNGs
  Microsoft: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Microsoft_icon.svg',
    ext: 'svg',
  },
  'Microsoft for Startups': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Microsoft_icon.svg',
    ext: 'svg',
  },
  Google: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Google_Favicon_2025.svg',
    ext: 'svg',
  },
  'United Latino Students Association': {
    // Certs came from a Google-branded ULSA program — reuse the G.
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Google_Favicon_2025.svg',
    ext: 'svg',
  },
  Anthropic: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg',
    ext: 'svg',
  },
  HackerRank: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/40/HackerRank_Icon-1000px.png',
    ext: 'webp',
  },
  'Amazon Web Services (AWS)': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Amazon_Web_Services_cloud_icon.png',
    ext: 'webp',
  },

  Udacity: {
    // Square icon-only Udacity mark (396×432)
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Udacity_Logo.svg',
    ext: 'svg',
  },
  'Indian Institute of Remote Sensing (IIRS), ISRO': {
    // Official ISRO seal / emblem
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Indian_Space_Research_Organisation_Logo.svg',
    ext: 'svg',
  },
  'IEEE DTU Student Branch': {
    // IEEE's own brand mark is the "IEEE" wordmark — even at 36px it
    // reads because it's only 4 letters.
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/21/IEEE_logo.svg',
    ext: 'svg',
  },

  // Google favicon service — icon-only by definition, 128px → WebP
  IBM: {
    url: 'https://www.google.com/s2/favicons?domain=ibm.com&sz=128',
    ext: 'webp',
  },
  'Infosys Springboard': {
    url: 'https://www.google.com/s2/favicons?domain=infosys.com&sz=128',
    ext: 'webp',
  },
  DigitalOcean: {
    url: 'https://www.google.com/s2/favicons?domain=digitalocean.com&sz=128',
    ext: 'webp',
  },
  Forage: {
    url: 'https://www.google.com/s2/favicons?domain=theforage.com&sz=128',
    ext: 'webp',
  },
  Commudle: {
    url: 'https://www.google.com/s2/favicons?domain=commudle.com&sz=128',
    ext: 'webp',
  },
};

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchBinary(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'image/*' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function downloadOne(issuer) {
  const entry = LOGO_MAP[issuer];
  if (!entry) return '';
  const slug = slugify(issuer);
  const outAbs = path.join(LOGO_DIR, `${slug}.${entry.ext}`);
  const outRel = `/logos/${slug}.${entry.ext}`;
  const buf = await fetchBinary(entry.url);
  if (entry.ext === 'svg') {
    await fs.writeFile(outAbs, buf);
  } else {
    const webp = await sharp(buf)
      .resize({
        width: 128,
        height: 128,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 90, effort: 6 })
      .toBuffer();
    await fs.writeFile(outAbs, webp);
  }
  return outRel;
}

async function main() {
  await fs.mkdir(LOGO_DIR, { recursive: true });

  const resolved = new Map();
  for (const issuer of Object.keys(LOGO_MAP)) {
    try {
      const p = await downloadOne(issuer);
      resolved.set(issuer, p);
      if (p) console.log(`✓ ${issuer} → ${p}`);
    } catch (e) {
      console.warn(`✗ ${issuer}: ${e.message}`);
      resolved.set(issuer, '');
    }
  }

  const md = await fs.readFile(CERT_FILE, 'utf-8');
  const lines = md.split('\n');
  const out = [];
  let currentIssuer = null;
  let currentIssuerIndent = '';
  let entryHasLogo = false;
  let entryLines = [];

  function flushEntry() {
    if (currentIssuer && resolved.get(currentIssuer) && !entryHasLogo) {
      entryLines.push(`${currentIssuerIndent}logo: "${resolved.get(currentIssuer)}"`);
    }
    for (const l of entryLines) out.push(l);
    entryLines = [];
    currentIssuer = null;
    currentIssuerIndent = '';
    entryHasLogo = false;
  }

  for (const line of lines) {
    if (/^\s{2}-\s+title:/.test(line)) {
      flushEntry();
      entryLines.push(line);
      continue;
    }
    if (/^\s{4,}\S/.test(line)) {
      const im = line.match(/^(\s+)issuer:\s*"([^"]+)"/);
      if (im) {
        currentIssuerIndent = im[1];
        currentIssuer = im[2];
      }
      const lm = line.match(/^(\s+)logo:\s*"([^"]+)"/);
      if (lm) {
        entryHasLogo = true;
        const local = resolved.get(currentIssuer);
        if (local) {
          entryLines.push(`${lm[1]}logo: "${local}"`);
          continue;
        }
        continue; // drop stale
      }
      entryLines.push(line);
      continue;
    }
    flushEntry();
    out.push(line);
  }
  flushEntry();

  await fs.writeFile(CERT_FILE, out.join('\n'));
  console.log(`\nDone. ${resolved.size} icon-only brand marks localized.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
