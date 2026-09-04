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
  | 'golf'
  | 'swimming'
  | 'walkNodes'
  | 'cycleNodes';

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
      fr: 'Que faire à {name} ce week-end ?',
      de: 'Was ist dieses Wochenende in {name} los?',
      nl: 'Wat is er dit weekend te doen in {name}?',
      es: '¿Qué hay en {name} este fin de semana?',
      it: "Cosa c'è a {name} questo fine settimana?",
      zh: '{name}这个周末有什么活动？',
      ja: '今週末、{name}では何がありますか？',
      ko: '이번 주말 {name}에서 뭘 할 수 있나요?',
    },
  },
  {
    needs: 'restaurants',
    min: 15,
    weight: 95,
    text: {
      en: 'Somewhere to eat tonight, away from the tourist streets',
      fr: 'Où manger ce soir, loin des rues touristiques',
      de: 'Wo esse ich heute Abend, abseits der Touristenstraßen?',
      nl: 'Waar eet ik vanavond, weg van de toeristische straten',
      es: 'Dónde cenar esta noche, lejos de las calles turísticas',
      it: 'Dove mangiare stasera, lontano dalle vie turistiche',
      zh: '今晚在哪吃饭？想避开游客街区',
      ja: '今夜の食事、観光客の多い通りを外して',
      ko: '오늘 저녁 식사, 관광객 많은 거리 말고',
    },
  },
  {
    // Knooppuntenroutes. Boven `districts`, want in een fietsland is dit de
    // vraag waarvoor je de concierge opent — en het is het antwoord dat een
    // zoekmachine niet geeft.
    //
    // De telling gaat over STARTPUNTEN met score >= 45, niet over knooppunten:
    // 83.000 knooppunten zou overal boven elke drempel komen, terwijl de vraag
    // is of er iets te beginnen valt. 50 startpunten binnen 15 km is een dicht
    // genoeg netwerk dat `rondjes_bij` vrijwel altijd een lus vindt.
    //
    // Wandelen en fietsen dekken niet hetzelfde gebied — Nord alleen wandelen,
    // Doubs en Wallonie vooral fietsen — vandaar twee sleutels. Eén sleutel zou
    // in Wallonie een wandelvraag aanbieden die de planner niet kan beantwoorden.
    // Fietsen krijgt een lagere drempel dan wandelen, en dat is geen slordigheid.
    // Wandelknooppunten staan dichter op elkaar: Rotterdam 459 fiets tegen 654
    // wandel, Nijmegen 315 tegen 962. Dezelfde drempel voor beide zou juist de
    // fietsbestemmingen wegfilteren waar half de straal water is - Texel staat
    // op 41, Flevoland op 49. Onder de 40 komen Hamburg (37) en Berlijn (8)
    // binnen, en daar is de Duitse dekking te dun om iets te beloven.
    needs: 'cycleNodes',
    min: 40,
    weight: 92,
    text: {
      en: 'A two-hour bike ride near {name}?',
      fr: 'Une balade à vélo de 2 heures près de {name} ?',
      de: 'Eine zweistündige Radtour bei {name}?',
      nl: 'Een fietstocht van 2 uur bij {name}?',
      es: '¿Una ruta en bici de 2 horas cerca de {name}?',
      it: 'Un giro in bici di 2 ore vicino a {name}?',
      zh: '{name}附近 2 小时的骑行路线？',
      ja: '{name}周辺で 2 時間のサイクリングコースは？',
      ko: '{name} 근처 2시간 자전거 코스는?',
    },
  },
  {
    needs: 'walkNodes',
    min: 50,
    weight: 91,
    text: {
      en: 'A two-hour walk near {name}?',
      fr: 'Une randonnée de 2 heures près de {name} ?',
      de: 'Eine zweistündige Wanderung bei {name}?',
      nl: 'Een wandeltocht van 2 uur bij {name}?',
      es: '¿Una caminata de 2 horas cerca de {name}?',
      it: 'Una camminata di 2 ore vicino a {name}?',
      zh: '{name}附近 2 小时的徒步路线？',
      ja: '{name}周辺で 2 時間の散策コースは？',
      ko: '{name} 근처 2시간 걷기 코스는?',
    },
  },
  {
    needs: 'districts',
    min: 3,
    weight: 90,
    text: {
      en: 'Which neighbourhood should I stay in?',
      fr: 'Dans quel quartier loger ?',
      de: 'In welchem Viertel soll ich wohnen?',
      nl: 'In welke wijk kan ik het beste verblijven?',
      es: '¿En qué barrio me conviene alojarme?',
      it: 'In che quartiere conviene alloggiare?',
      zh: '住在哪个城区比较好？',
      ja: 'どの地区に泊まるのがいいですか？',
      ko: '어느 동네에 묵는 게 좋을까요?',
    },
  },
  {
    needs: 'bookable',
    min: 1,
    weight: 88,
    text: {
      en: 'Book a table for two tomorrow at 19:30',
      fr: 'Réserver une table pour deux demain à 19h30',
      de: 'Einen Tisch für zwei morgen um 19:30 Uhr reservieren',
      nl: 'Reserveer morgen om 19:30 een tafel voor twee',
      es: 'Reservar mesa para dos mañana a las 19:30',
      it: 'Prenota un tavolo per due domani alle 19:30',
      zh: '预订明天 19:30 两人的餐位',
      ja: '明日 19:30 に 2 名でテーブルを予約',
      ko: '내일 저녁 7시 30분 2인 테이블 예약',
    },
  },
  {
    // Boven golf en onder 'bookable': zwemmen heeft een veel breder publiek dan
    // golf, maar mag een concrete reserveervraag niet verdringen. Bij een stad
    // met wijken en reserveerbare tafels valt hij buiten de eerste vier; bij een
    // kust- of merenbestemming, die die twee meestal mist, komt hij bovendrijven.
    //
    // min 5, want de vraag suggereert keuze. Eén zwembad is een adres, geen
    // antwoord op "waar kan ik zwemmen".
    needs: 'swimming',
    min: 5,
    weight: 87,
    text: {
      en: 'Where can I swim near {name}?',
      fr: 'Où se baigner près de {name} ?',
      de: 'Wo kann ich in der Nähe von {name} schwimmen?',
      nl: 'Waar kan ik zwemmen in de buurt van {name}?',
      es: '¿Dónde puedo bañarme cerca de {name}?',
      it: 'Dove posso fare il bagno vicino a {name}?',
      zh: '{name}附近哪里可以游泳？',
      ja: '{name}の近くで泳げる場所は？',
      ko: '{name} 근처에서 수영할 만한 곳은?',
    },
  },
  {
    needs: 'golf',
    min: 1,
    weight: 86,
    text: {
      en: 'Is there a tee time free on Saturday morning?',
      fr: 'Y a-t-il un départ libre samedi matin ?',
      de: 'Ist Samstagvormittag eine Startzeit frei?',
      nl: 'Is er zaterdagochtend een flight vrij?',
      es: '¿Hay salida libre el sábado por la mañana?',
      it: "C'è una partenza libera sabato mattina?",
      zh: '周六上午还有空的开球时间吗？',
      ja: '土曜の午前にスタート時間の空きはありますか？',
      ko: '토요일 오전에 티타임 남아 있나요?',
    },
  },
  {
    needs: 'events',
    min: 50,
    weight: 80,
    text: {
      en: 'Anything for kids on a rainy day?',
      fr: 'Quelque chose pour les enfants un jour de pluie ?',
      de: 'Etwas für Kinder an einem Regentag?',
      nl: 'Iets voor kinderen als het regent?',
      es: '¿Algo para niños en un día de lluvia?',
      it: 'Qualcosa per i bambini in una giornata di pioggia?',
      zh: '下雨天有适合孩子的活动吗？',
      ja: '雨の日に子ども向けのものはありますか？',
      ko: '비 오는 날 아이와 갈 만한 곳이 있나요?',
    },
  },
  {
    needs: 'attractions',
    min: 10,
    weight: 78,
    text: {
      en: 'What is worth seeing if I only have one day?',
      fr: "Que voir si je n'ai qu'une journée ?",
      de: 'Was lohnt sich, wenn ich nur einen Tag habe?',
      nl: 'Wat moet ik zien als ik maar één dag heb?',
      es: '¿Qué merece la pena ver si solo tengo un día?',
      it: 'Cosa vale la pena vedere se ho solo un giorno?',
      zh: '只有一天的话，值得看什么？',
      ja: '1 日しかない場合、何を見るべきですか？',
      ko: '하루밖에 없다면 뭘 봐야 할까요?',
    },
  },
  {
    needs: 'trails',
    min: 3,
    weight: 74,
    text: {
      en: 'A walk near {name} under 10 km',
      fr: 'Une randonnée près de {name}, moins de 10 km',
      de: 'Eine Wanderung bei {name} unter 10 km',
      nl: 'Een wandeling bij {name} onder de 10 km',
      es: 'Una ruta a pie cerca de {name}, menos de 10 km',
      it: 'Una camminata vicino a {name}, sotto i 10 km',
      zh: '{name}附近 10 公里以内的徒步路线',
      ja: '{name}周辺の 10 km 以内の散策コース',
      ko: '{name} 근처 10km 이내 걷기 코스',
    },
  },
  {
    needs: 'restaurants',
    min: 40,
    weight: 60,
    text: {
      en: 'Open right now, gluten free',
      fr: 'Ouvert maintenant, sans gluten',
      de: 'Jetzt geöffnet, glutenfrei',
      nl: 'Nu open, glutenvrij',
      es: 'Abierto ahora, sin gluten',
      it: 'Aperto adesso, senza glutine',
      zh: '现在营业，无麸质',
      ja: 'いま営業中、グルテンフリー',
      ko: '지금 영업 중, 글루텐 프리',
    },
  },
];

/** {pass} = de naam van de city pass, precies zoals de bron hem levert. */
const PASS_QUESTION: Record<string, string> = {
  en: 'Is the {pass} worth it for two days?',
  fr: 'Est-ce que le {pass} vaut le coup pour deux jours ?',
  de: 'Lohnt sich der {pass} für zwei Tage?',
  nl: 'Is de {pass} het waard voor twee dagen?',
  es: '¿Merece la pena el {pass} para dos días?',
  it: 'Vale la pena il {pass} per due giorni?',
  zh: '两天的话，{pass}值得买吗？',
  ja: '2 日間なら {pass} は元が取れますか？',
  ko: '이틀이라면 {pass}는 살 만한가요?',
};

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
  //
  // De naam van de pas zelf blijft onvertaald: "Bordeaux Métropole City Pass"
  // heet overal zo, en een vertaalde variant zou de bezoeker naar iets laten
  // zoeken wat niet bestaat.
  if (d.touristPass?.name) {
    const tpl = PASS_QUESTION[locale] ?? PASS_QUESTION.en;
    out.push(tpl.replace('{pass}', d.touristPass.name));
  }

  return out.slice(0, limit);
}
