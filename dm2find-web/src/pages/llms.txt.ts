import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const d = (await getCollection('destinations')).map(e => e.data)
    .sort((a, b) => a.name.en.localeCompare(b.name.en));
  const body = `# DM2find.ai

AI travel concierges built on the tourism data destinations already publish.
Each destination below has a live conversational concierge and a machine-readable
record at /api/destinations/<slug>.json

Attribution: where a destination is sourced from a national or regional open data
platform, the required licence attribution is published on its page and in its JSON.
Destinations marked "public sources" are compiled and carry no platform attribution.

## Destinations
${d.map(x => `- [${x.name.en}](${new URL(`/destinations/${x.slug}`, site)}) — ${x.countryName} — ${x.provenance}`).join('\n')}
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
