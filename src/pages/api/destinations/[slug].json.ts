import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const dests = await getCollection('destinations');
  const sources = Object.fromEntries((await getCollection('sources')).map(e => [e.data.id, e.data]));
  return dests.map(e => ({ params: { slug: e.data.slug }, props: { d: e.data, sources } }));
}

export const GET: APIRoute = ({ props }) => {
  const { d, sources } = props as any;
  const src = d.dataSource ? sources[d.dataSource] : null;
  const official = d.provenance === 'official';
  return new Response(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: d.name.en,
    address: { '@type': 'PostalAddress', addressCountry: d.country },
    source: official && src
      ? { platform: src.name, attribution: src.attribution, refresh: 'continuous' }
      : { platform: 'public web sources', attribution: null, refresh: 'compiled' },
    enrichmentLayer: { affectsRanking: false },
    agentEndpoint: `mcp://dm2find.ai/${d.slug}`,
  }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
