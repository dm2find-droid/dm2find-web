import { getCollection } from 'astro:content';
import { allChannels } from './channels';

export async function destinationsIndexProps() {
  const all = (await getCollection('destinations')).map(e => e.data)
    .sort((a, b) => a.name.en.localeCompare(b.name.en));
  return {
    all,
    countries: [...new Set(all.map(d => d.countryName))].sort(),
    channels: allChannels(all),
    venueCount: (await getCollection('venues')).length,
  };
}
