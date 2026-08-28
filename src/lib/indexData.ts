import { getCollection } from 'astro:content';

export async function destinationsIndexProps() {
  const all = (await getCollection('destinations')).map(e => e.data)
    .sort((a, b) => a.name.en.localeCompare(b.name.en));
  return {
    all,
    countries: [...new Set(all.map(d => d.countryName))].sort(),
    channels: [...new Set(all.flatMap(d => d.channels))].sort(),
    venueCount: (await getCollection('venues')).length,
  };
}
