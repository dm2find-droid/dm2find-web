/**
 * src/lib/sampleQuestions.ts
 *
 * Voorbeeldvragen worden AFGELEID, nooit per bestemming opgeslagen.
 *
 * `inventory` is feit — een telling per categorie, geëxporteerd uit Supabase
 * naast de rest van destinations.json. Dit bestand maakt daar de vragen van
 * waarmee een bezoeker wordt uitgenodigd. Twee gevolgen die het waard zijn
 * om vast te houden:
 *
 *   - Een bestemming wordt nooit uitgenodigd iets te vragen wat hij niet kan
 *     beantwoorden. Geen tee times waar geen golf is, geen wijkvraag waar
 *     city_districts leeg is. Dezelfde discipline als de ProvenanceBadge: de
 *     pagina claimt niet wat de data niet draagt.
 *   - Sluit een bron aan en de vragen veranderen zichzelf. Niets bij te
 *     werken over 398 records.
 *
 * `sampleQuestions` in het collectieschema blijft bestaan als override per
 * bestemming voor de handvol pagina's die iets specifieks verdienen
 * (Bordeaux → wijnkastelen). Waar hij voor een taal gezet is, wint hij.
 */

/** Inventory-sleutels die de generator begrijpt. De rest wordt genegeerd. */
export type InventoryKey =
  | 'events'
  | 'restaurants'
  | 'attractions'
  | 'trails'
  | 'districts'
  | 'bookable'
  | 'golf';

interface Template {
  needs: InventoryKey;
  /** Onder deze telling wordt de vraag niet aangeboden. Een bestemming met
   *  drie evenementen kan "wat is er dit weekend" niet eerlijk beantwoorden.
   *
   *  De drempels zijn geijkt op de gecorrigeerde telling: Bordeaux staat op
   *  101 events, Groningen op 34. Vóór die correctie telde de export dagrijen
   *  in plaats van evenementen en lagen dezelfde bestemmingen een factor drie
   *  tot twintig hoger. */
  min: number;
  /** Hoger wordt eerder getoond. Gelijkspel wordt beslist door de volgorde
   *  hieronder, zodat de uitvoer stabiel is tussen builds — geen diff-ruis
   *  in de gegenereerde HTML. */
  weight: number;
  /** {name} = naam van de bestemming. */
  text: Record<string, string>;
}

const TEMPLATES: Template[] = [
  {
    needs: 'events',
    min: 15,
    weight: 100,
    text: {
      en: "What's on in {name} this weekend?",
      nl: 'Wat is er dit weekend te doen in {name}?',
    },
  },
  {
    needs: 'restaurants',
    min: 15,
    weight: 95,
    text: {
      en: 'Somewhere to eat tonight, away from the tourist streets',
      nl: 'Waar eet ik vanavond, weg van de toeristische straten',
    },
  },
  {
    needs: 'districts',
    min: 3,
    weight: 90,
    text: {
      en: 'Which neighbourhood should I stay in?',
      nl: 'In welke wijk kan ik het beste verblijven?',
    },
  },
  {
    needs: 'bookable',
    min: 1,
    weight: 88,
    text: {
      en: 'Book a table for two tomorrow at 19:30',
      nl: 'Reserveer morgen om 19:30 een tafel voor twee',
    },
  },
  {
    needs: 'golf',
    min: 1,
    weight: 86,
    text: {
      en: 'Is there a tee time free on Saturday morning?',
      nl: 'Is er zaterdagochtend een flight vrij?',
    },
  },
  {
    needs: 'events',
    min: 50,
    weight: 80,
    text: {
      en: 'Anything for kids on a rainy day?',
      nl: 'Iets voor kinderen als het regent?',
    },
  },
  {
    needs: 'attractions',
    min: 10,
    weight: 78,
    text: {
      en: 'What is worth seeing if I only have one day?',
      nl: 'Wat moet ik zien als ik maar één dag heb?',
    },
  },
  {
    needs: 'trails',
    min: 3,
    weight: 74,
    text: {
      en: 'A walk near {name} under 10 km',
      nl: 'Een wandeling bij {name} onder de 10 km',
    },
  },
  {
    needs: 'restaurants',
    min: 40,
    weight: 60,
    text: {
      en: 'Open right now, gluten free',
      nl: 'Nu open, glutenvrij',
    },
  },
];

/** De vorm die dit van een bestemmingsrecord nodig heeft. Bewust smal. */
export interface QuestionSource {
  name: Record<string, string>;
  inventory: Record<string, number>;
  sampleQuestions: Record<string, string[]>;
  touristPass?: { name: string | null; url: string | null } | null;
}

/**
 * Geeft tot `limit` vragen terug die deze bestemming werkelijk kan
 * beantwoorden. Een lege array is een geldig en verwacht resultaat — een
 * preview-bestemming zonder inventory krijgt geen chips, en de sectie rendert
 * dan helemaal niet.
 */
export function sampleQuestionsFor(
  d: QuestionSource,
  locale = 'en',
  limit = 4,
): string[] {
  const override = d.sampleQuestions?.[locale];
  if (override?.length) return override.slice(0, limit);

  const name = d.name?.[locale] ?? d.name?.en ?? '';
  const inv = d.inventory ?? {};

  const out = TEMPLATES.filter((t) => (inv[t.needs] ?? 0) >= t.min)
    .sort((a, b) => b.weight - a.weight)
    .map((t) => (t.text[locale] ?? t.text.en).replace('{name}', name));

  // De city pass is geen inventory-telling maar wel een echte, beantwoordbare
  // vraag overal waar touristPass gezet is — en een goede, want het antwoord
  // hangt af van wat de bezoeker van plan is.
  if (d.touristPass?.name) {
    out.push(
      locale === 'nl'
        ? `Is de ${d.touristPass.name} het waard voor twee dagen?`
        : `Is the ${d.touristPass.name} worth it for two days?`,
    );
  }

  return out.slice(0, limit);
}
