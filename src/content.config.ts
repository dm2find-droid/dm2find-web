import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

/**
 * Two collections, both validated at build time.
 * A duplicate slug, an unknown dataSource, or a destination claiming an
 * official feed without one FAILS THE BUILD. That is the whole point of
 * moving the catalogue out of hand-written markdown.
 */

const sources = defineCollection({
  loader: file('src/data/sources.json', { parser: (t) => JSON.parse(t) }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    geo: z.string(),
    country: z.string(),
    url: z.string().url().optional(),
    /** 'connected' = we read the feed. 'planned' = we do NOT, and must not claim attribution. */
    status: z.enum(['connected', 'planned']),
    attributionRequired: z.boolean().default(false),
    attribution: z.string().optional(),
    /** Where a connector covers only part of a country, say so. Rendered next
     *  to the geography so "Connected" can never be read as nationwide. */
    coverage: z.string().optional(),
  }),
});

/**
 * Venues are tenants that are not destinations: a golf club, a restaurant, a
 * resort. Same build-time discipline as destinations — a bad slug or a booking
 * mode that names no URL fails the build.
 */
const venues = defineCollection({
  loader: file('src/data/venues.json', { parser: (t) => JSON.parse(t) }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase, digits and hyphens only'),
    name: z.string(),
    /** Drives the catalogue filter and the price band. */
    industry: z.enum(['golf_resort', 'hospitality', 'mixed_property']),
    country: z.string(),
    countryName: z.string(),
    city: z.string().nullable().default(null),
    region: z.string().nullable().default(null),
    tenantId: z.string(),
    chatUrl: z.string().url(),
    website: z.string().url().nullable().default(null),
    logo: z.string().url().nullable().default(null),
    brandColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).nullable().default(null),
    /** How the visitor can act on the card.
     *  link  = the venue's own booking page, which outranks the panel
     *          (same precedence fallback_booking_url has in the venues table)
     *  panel = live availability lookup, read-only — we never take the booking
     *  none  = website and phone only */
    booking: z.enum(['link', 'panel', 'none']).default('none'),
    bookingUrl: z.string().url().nullable().default(null),
    voiceAgentId: z.string().regex(/^agent_[A-Za-z0-9]+$/).nullable().default(null),
    channels: z.array(z.string()).default(['webchat']),
    coords: z.tuple([z.number(), z.number()]).optional(),
  })
  .refine((v) => v.booking !== 'link' || !!v.bookingUrl, {
    message: 'booking "link" needs a bookingUrl',
    path: ['bookingUrl'],
  }),
});

const destinations = defineCollection({
  loader: file('src/data/destinations.json', { parser: (t) => JSON.parse(t) }),
  schema: z.object({
    /** Public URL segment. Human-readable. Never a tenant id. */
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase, digits and hyphens only'),
    name: z.record(z.string()),
    country: z.string(),
    countryName: z.string(),
    region: z.string().nullable().default(null),
    /** Whatever chat.dm2find.ai actually needs — may be numeric or prefixed. */
    tenantId: z.string(),
    /** Separate namespace: /demo?city=<voiceId>. Null where there is no voice demo. */
    voiceId: z.string().nullable().default(null),
    /** ElevenLabs agent for this destination's own voice concierge. Present only
     *  where the tenants table has el_agent_id. Loading it sends data to
     *  ElevenLabs in the US, so it is lazy-loaded and captioned as such. */
    voiceAgentId: z.string().regex(/^agent_[A-Za-z0-9]+$/, 'not an ElevenLabs agent id')
                   .nullable().default(null),
    chatUrl: z.string().url(),
    provenance: z.enum(['official', 'preview']),
    dataSource: z.string().nullable().default(null),
    status: z.enum(['live', 'preview', 'requested']).default('live'),
    channels: z.array(z.string()).default(['webchat']),
    languages: z.array(z.string()).default([]),
    inventory: z.record(z.number()).default({}),
    enrichments: z.array(z.string()).default([]),
    sampleQuestions: z.record(z.array(z.string())).default({}),
    /** [lat, lon] from the tenants table. */
    coords: z.tuple([z.number(), z.number()]).optional(),
    /** true = this tenant has its own DATAtourisme feed hash bound. */
    dtFeed: z.boolean().default(false),
    website: z.string().url().nullable().default(null),
    /** The DMO's own logo and accent colour, straight from the tenants table. */
    logo: z.string().url().nullable().default(null),
    brandColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).nullable().default(null),
    touristPass: z.object({ name: z.string().nullable(), url: z.string().nullable() }).nullable().default(null),
    calendarUrl: z.string().nullable().default(null),
    /** Real walkthrough videos recovered from the old Grav pages. */
    videos: z.array(z.object({
      id: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'not a YouTube id'),
      label: z.string(),
      channel: z.string(),
    })).default([]),
    /** Real photograph of the place. Optional, and left null rather than filled
     *  with a generic stock shot: a picture of the wrong town on a DMO's own
     *  page costs more trust than an honest blank. `credit` renders under the
     *  image where the licence asks for it. */
    image: z.object({
      src: z.string().url(),
      credit: z.string().nullable().default(null),
      creditUrl: z.string().url().nullable().default(null),
    }).nullable().default(null),
    dmo: z.object({ name: z.string().nullable(), claimed: z.boolean() })
          .default({ name: null, claimed: false }),
  })
  .refine((d) => d.provenance !== 'official' || !!d.dataSource, {
    message: 'a destination marked "official" must name its dataSource',
    path: ['dataSource'],
  }),
});

export const collections = { destinations, sources, venues };
