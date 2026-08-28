/**
 * Gedeelde route-data voor de Engelse en de vertaalde varianten van dezelfde
 * pagina. Zonder dit staat dezelfde getStaticPaths-logica twee keer, en dan
 * lopen ze op termijn uiteen.
 */
import { getCollection } from 'astro:content';
import highlights from '../data/highlights.json';

export async function destinationProps() {
  const dests = await getCollection('destinations');
  const sources = Object.fromEntries((await getCollection('sources')).map(e => [e.data.id, e.data]));
  const picks = highlights as Record<string, string[]>;
  const bySlug = new Map(dests.map(e => [e.data.slug, e]));

  return dests.map(e => {
    const inCountry = dests.filter(
      x => x.data.country === e.data.country && x.data.slug !== e.data.slug,
    );
    const curated = (picks[e.data.country] ?? [])
      .filter(s => s !== e.data.slug)
      .map(s => bySlug.get(s))
      .filter((x): x is NonNullable<typeof x> => !!x && x.data.country === e.data.country);
    const rest = inCountry.filter(x => !curated.some(c => c.data.slug === x.data.slug));

    return {
      slug: e.data.slug,
      props: {
        d: e.data,
        source: e.data.dataSource ? sources[e.data.dataSource] : null,
        siblings: [...curated, ...rest].slice(0, 4).map(x => x.data),
        curatedCount: curated.length,
      },
    };
  });
}

export async function countryProps() {
  const all = (await getCollection('destinations')).map(e => e.data);
  const sources = (await getCollection('sources')).map(e => e.data);
  const byCountry = new Map<string, typeof all>();
  for (const d of all) {
    const k = d.country.toLowerCase();
    byCountry.set(k, [...(byCountry.get(k) ?? []), d]);
  }
  return [...byCountry].map(([code, dests]) => ({
    code,
    props: {
      dests,
      name: dests[0].countryName,
      source: sources.find(s => s.id === dests.find(d => d.dataSource)?.dataSource) ?? null,
    },
  }));
}
