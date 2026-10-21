/**
 * Voice on the European chain, per tenant — read from src/data/eu-voice.json,
 * an export of the tenants table (data_residency = eu_sovereign, voice_provider
 * = livekit, web_voice_enabled). Every voice count on the site comes from this
 * file, so the site never claims voice for a destination that has none: an EU
 * destination whose tenant is missing here is a web chat without voice.
 *
 * Regenerate (Supabase SQL editor, Limit → No limit, Export CSV, then convert):
 *   select slug, iso, tenant_level, voice_language as main_language,
 *          array_to_string(voice_languages, '|') as languages
 *   from public.tenants
 *   where data_residency = 'eu_sovereign' and industry in ('DMO','dmo')
 *     and voice_provider = 'livekit' and web_voice_enabled
 *     and coalesce(array_length(voice_languages, 1), 0) > 0
 *   order by iso, slug;
 */
import data from '../data/eu-voice.json';

export type EuVoice = { tenant: string; iso: string; level: string; main: string; langs: string[] };

const TENANTS: EuVoice[] = (data.tenants as { t: string; iso: string; level: string; main: string; langs: string }[])
  .map(r => ({ tenant: r.t, iso: r.iso, level: r.level, main: r.main, langs: r.langs.split('|').filter(Boolean) }));
const BY_TENANT = new Map(TENANTS.map(t => [t.tenant, t]));

/** The EU voice record for a destination, or null when its EU tenant has no voice. */
export function euVoiceOf(d: { euTenantId?: string | null }): EuVoice | null {
  return d.euTenantId ? (BY_TENANT.get(d.euTenantId) ?? null) : null;
}

/** Which engine speaks a language. Listening is Mistral for every language. */
export type Provider = 'gradium' | 'mistral';
export const TTS: Record<Provider, string[]> = data.tts as Record<Provider, string[]>;
export function providerOf(code: string): Provider | null {
  return TTS.gradium.includes(code) ? 'gradium' : TTS.mistral.includes(code) ? 'mistral' : null;
}
export const STT = data.stt as { who: string; what: string; where: string };
export const UPDATED = data.updated as string;

/* English names: the voice page is English-only. Native names sit next to them
   where a visitor picks a language. */
export const LANG_NAME: Record<string, string> = {
  fr: 'French', en: 'English', de: 'German', es: 'Spanish', pt: 'Portuguese',
  nl: 'Dutch', ca: 'Catalan', it: 'Italian', pl: 'Polish', no: 'Norwegian',
  ar: 'Arabic', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
};
export const LANG_NATIVE: Record<string, string> = {
  fr: 'Français', en: 'English', de: 'Deutsch', es: 'Español', pt: 'Português',
  nl: 'Nederlands', ca: 'Català', it: 'Italiano', pl: 'Polski', no: 'Norsk',
  ar: 'العربية', zh: '中文', ja: '日本語', ko: '한국어',
};
const COUNTRY: Record<string, string> = {
  FR: 'France', NL: 'Netherlands', ES: 'Spain', DE: 'Germany', AT: 'Austria', BE: 'Belgium',
  IT: 'Italy', PT: 'Portugal', PL: 'Poland', FI: 'Finland', SE: 'Sweden', IE: 'Ireland', LU: 'Luxembourg',
};

export type CountryRow = { iso: string; name: string; count: number; main: string[]; langs: number; note?: string };

/** Totals for the voice page: tenants, countries and languages, from the export. */
export function euVoiceStats() {
  const byIso = new Map<string, EuVoice[]>();
  for (const t of TENANTS) byIso.set(t.iso, [...(byIso.get(t.iso) ?? []), t]);
  const countries: CountryRow[] = [...byIso.entries()]
    .map(([iso, ts]) => {
      const main = [...new Set(ts.map(t => t.main))];
      const langs = Math.min(...ts.map(t => t.langs.length));
      const extra = ts.filter(t => t.langs.length > langs);
      return {
        iso, name: COUNTRY[iso] ?? iso, count: ts.length,
        main: main.map(m => LANG_NAME[m] ?? m), langs,
        note: extra.length ? `${extra.map(t => t.tenant.replace(/-eu$/, '').replace(/^\w/, c => c.toUpperCase())).join(', ')}: ${extra[0].langs.length}` : undefined,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const languages = [...new Set(TENANTS.flatMap(t => t.langs))]
    .map(code => ({
      code, name: LANG_NAME[code] ?? code, native: LANG_NATIVE[code] ?? code,
      provider: providerOf(code),
      tenants: TENANTS.filter(t => t.langs.includes(code)).length,
    }))
    .sort((a, b) => b.tenants - a.tenants || a.name.localeCompare(b.name));
  const perTenant = [...new Set(TENANTS.map(t => t.langs.length))].sort((a, b) => a - b);
  return { tenants: TENANTS.length, countries, languages, perTenant };
}
