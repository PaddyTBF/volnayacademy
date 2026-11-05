import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try {
  const local = await readFile(resolve(root, '.env.local'), 'utf8');
  for (const line of local.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }

const get = name => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}; see .env.example. Build refused.`);
  return value;
};
const config = {
  posthogToken: get('PUBLIC_POSTHOG_PROJECT_TOKEN'),
  posthogHost: get('PUBLIC_POSTHOG_HOST'),
  metaPixelId: get('PUBLIC_META_PIXEL_ID'),
  supabaseUrl: get('PUBLIC_SUPABASE_URL'),
  supabasePublishableKey: get('PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  allowedHosts: ['paddytbf.github.io'],
  canonicalUrl: 'https://paddytbf.github.io/volnayacademy/',
  schemaVersion: '1',
};
if (!/^phc_[A-Za-z0-9_-]+$/.test(config.posthogToken)) throw new Error('Expected a public PostHog project token.');
if (!/^https:\/\/(us|eu)\.i\.posthog\.com$/.test(config.posthogHost)) throw new Error('Unexpected PostHog ingestion host.');
if (!/^\d{10,20}$/.test(config.metaPixelId)) throw new Error('Invalid Meta pixel ID.');
if (!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(config.supabaseUrl)) throw new Error('Unexpected Supabase project URL.');
if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.supabasePublishableKey)) throw new Error('Use a modern public Supabase key, never an admin/secret key.');
const out = resolve(root, 'dist');
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'tracking.js', 'form.js', 'privacy.html', 'logo.svg', 'ricky.jpg', '.nojekyll']) {
  await copyFile(resolve(root, file), resolve(out, file));
}
await writeFile(resolve(out, 'tracking-config.js'), '// Generated public runtime configuration. Do not edit.\nwindow.VOLNAY_CONFIG = Object.freeze(' + JSON.stringify(config) + ');\n');
console.log('Built dist/ with verified public configuration; no credentials printed.');

