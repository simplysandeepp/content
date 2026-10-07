#!/usr/bin/env node
/**
 * Validates every content file against the frontmatter contract the
 * portfolio templates rely on. Runs in CI before any template is told to
 * rebuild, so a typo here fails one cheap check instead of a deploy.
 *
 * Templates may ignore fields they don't use, but they all assume the
 * required ones below exist. New fields must be optional.
 *
 * Usage: node scripts/validate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'front-matter';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'content');

const REQUIRED = {
  projects: ['title', 'description', 'date', 'tags'],
  blog: ['title', 'description', 'date'],
  experience: ['company', 'role', 'start', 'end'],
};
const CERT_REQUIRED = ['title', 'issuer', 'issued'];

const errors = [];
const fail = (file, msg) => errors.push(`${path.relative(ROOT, file)}: ${msg}`);

function isValidDate(value) {
  return !Number.isNaN(new Date(String(value)).getTime());
}

function readFrontmatter(file) {
  try {
    return matter(fs.readFileSync(file, 'utf-8')).attributes ?? {};
  } catch (err) {
    fail(file, `frontmatter does not parse — ${err.message.split('\n')[0]}`);
    return null;
  }
}

for (const [folder, required] of Object.entries(REQUIRED)) {
  const dir = path.join(CONTENT, folder);
  for (const name of fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f))) {
    const file = path.join(dir, name);
    if (!/^[a-z0-9-]+\.mdx?$/.test(name)) {
      fail(file, 'filename becomes the URL slug — use lowercase letters, digits and dashes');
    }
    const fm = readFrontmatter(file);
    if (!fm) continue;
    for (const key of required) {
      if (fm[key] === undefined || fm[key] === '') fail(file, `missing required "${key}"`);
    }
    if ('date' in fm && !isValidDate(fm.date)) fail(file, `"date" is not a valid date (${fm.date})`);
    if ('tags' in fm && !Array.isArray(fm.tags)) fail(file, '"tags" must be a list');
    if (fm.scorecard && !fs.existsSync(path.join(CONTENT, 'data', `${fm.scorecard}-eval.json`))) {
      fail(file, `scorecard "${fm.scorecard}" has no content/data/${fm.scorecard}-eval.json`);
    }
    if (fm.image && fm.image.startsWith('/') && !fs.existsSync(path.join(ROOT, 'public', fm.image))) {
      fail(file, `image ${fm.image} not found under public/`);
    }
  }
}

const certFile = path.join(CONTENT, 'certifications.md');
const certs = readFrontmatter(certFile)?.certifications;
if (!Array.isArray(certs)) {
  fail(certFile, '"certifications" must be a list');
} else {
  certs.forEach((cert, i) => {
    for (const key of CERT_REQUIRED) {
      if (!cert[key]) fail(certFile, `certification #${i + 1} missing "${key}"`);
    }
    if (cert.logo && cert.logo.startsWith('/') && !fs.existsSync(path.join(ROOT, 'public', cert.logo))) {
      fail(certFile, `certification #${i + 1} logo ${cert.logo} not found under public/`);
    }
  });
}

for (const name of fs.readdirSync(path.join(CONTENT, 'data')).filter((f) => f.endsWith('.json'))) {
  const file = path.join(CONTENT, 'data', name);
  try {
    JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    fail(file, `invalid JSON — ${err.message}`);
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} content problem(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('✓ content is valid');
