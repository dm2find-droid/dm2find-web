/**
 * Download YouTube poster frames once and self-host them.
 *
 * Why not just point <img> at img.youtube.com: /channels currently makes zero
 * third-party requests until a visitor clicks a card, which is what makes the
 * EU-sovereignty claim on /platform literally true. A hot-linked thumbnail
 * would send every visitor's IP to Google on page load, before consent, on the
 * one page where we assert the opposite. Self-hosting keeps the claim honest
 * and is faster besides — no DNS, no TLS handshake to a fourth domain.
 *
 * Idempotent: a file already on disk is never re-fetched, so this costs nothing
 * on rebuilds. Never fatal: if YouTube is unreachable the page falls back to
 * the gradient card it used before. A missing poster frame must not fail a
 * deploy.
 *
 * Runs automatically via the "prebuild" script. You can also run it by hand and
 * commit the results, which is the better habit — it makes the build reproducible
 * and independent of YouTube being up:
 *
 *   node scripts/fetch-thumbs.mjs
 *   git add public/channels && git commit -m "channels: poster frames"
 */
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const OUT = 'public/channels';
mkdirSync(OUT, { recursive: true });

const channels = JSON.parse(await readFile('src/data/channels.json', 'utf8'));
const ids = channels.map(c => c.yt).filter(Boolean);

/* maxresdefault is a true 1280x720. hqdefault is 480x360 — a 16:9 frame with
 * black bars top and bottom — which the page crops back off with object-cover.
 * Not every upload has a maxres, so try it first and fall back. */
const VARIANTS = ['maxresdefault', 'hqdefault'];

let got = 0, kept = 0, missed = [];

for (const id of ids) {
  const dest = `${OUT}/yt-${id}.jpg`;
  if (existsSync(dest)) { kept++; continue; }

  let saved = false;
  for (const v of VARIANTS) {
    try {
      const res = await fetch(`https://img.youtube.com/vi/${id}/${v}.jpg`);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      // YouTube answers 200 with a 1097-byte grey placeholder for absent sizes
      if (buf.length < 5000) continue;
      writeFileSync(dest, buf);
      console.log(`  ✓ ${id}  ${v}  ${(buf.length / 1024).toFixed(0)} KB`);
      saved = true; got++;
      break;
    } catch { /* offline or blocked — fall through to the next variant */ }
  }
  if (!saved) missed.push(id);
}

console.log(`thumbs: ${got} fetched, ${kept} already present` +
            (missed.length ? `, ${missed.length} unavailable (${missed.join(', ')})` : ''));
if (missed.length) console.log('  those cards render as gradients — not an error');
