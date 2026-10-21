/**
 * Which channels a destination's concierge is reachable on.
 *
 * A destination with an EU tenant (euTenantId) runs the fully European chat.
 * When the tenant export (src/data/eu-voice.json) says that chat has voice —
 * the wave icon: Gradium or Mistral Voxtral 3 speech over LiveKit — it is a
 * web chat, a voice concierge and the two combined, whatever destinations.json
 * lists. An EU tenant without voice in the export is a web chat, full stop.
 * Destinations without an EU tenant keep the channels listed in the data, so
 * the label never promises more than what is actually wired up.
 */
import { euVoiceOf } from './euVoice';

export const EU_CHANNELS = ['webchat', 'voice', 'web+voice'] as const;
const ORDER = ['webchat', 'voice', 'web+voice'];

export function channelsOf(d: { euTenantId?: string | null; channels: string[] }): string[] {
  if (!d.euTenantId) return d.channels;
  // The EU edition: web chat always; voice only when the export says the tenant has it.
  return euVoiceOf(d) ? [...EU_CHANNELS] : ['webchat'];
}

/** All distinct channel values across destinations, in display order. */
export function allChannels(all: { euTenantId?: string | null; channels: string[] }[]): string[] {
  return [...new Set(all.flatMap(channelsOf))]
    .sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
}

/** Human label for a channel value; unknown values fall back to the raw value. */
export function channelLabel(_: (k: string) => string, c: string): string {
  const k = `ch.${c.replace(/[^a-z]/g, '')}`;
  const v = _(k);
  return v === k ? c : v;
}
