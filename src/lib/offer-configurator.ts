export type ActivityId = 'automobile' | 'detailing' | 'conciergerie' | 'autre';
export type SituationId = 'lancement' | 'recommandation' | 'site' | 'multicanal' | 'croissance';
export type ObstacleId = 'comparaison' | 'incompletes' | 'echanges' | 'image' | 'retour';
export type OptionId = 'acompte' | 'reservation' | 'redaction';
export type PricingRegion = 'euro' | 'switzerland';

export const commitmentMonths = 12;
export const swissPriceFactor = 1.16;

const euroPricing = {
  setupPrice: 590,
  monthlyPrice: 149,
  currency: 'EUR',
  locale: 'fr-FR',
} as const;

export function roundUpToTen(amount: number) {
  return Math.ceil(amount / 10) * 10;
}

function toSwissPrice(euroPrice: number) {
  return roundUpToTen(euroPrice * swissPriceFactor);
}

export const pricingByRegion = {
  euro: {
    ...euroPricing,
    label: 'France et zone euro',
  },
  switzerland: {
    setupPrice: toSwissPrice(euroPricing.setupPrice),
    monthlyPrice: toSwissPrice(euroPricing.monthlyPrice),
    currency: 'CHF',
    locale: 'fr-CH',
    label: 'Suisse',
  },
} as const satisfies Record<PricingRegion, {
  readonly setupPrice: number;
  readonly monthlyPrice: number;
  readonly currency: 'EUR' | 'CHF';
  readonly locale: string;
  readonly label: string;
}>;

export const options = [
  { id: 'acompte', title: 'Sécuriser les rendez-vous importants', description: 'Ajoutez un acompte lorsque certaines prestations mobilisent du temps, un déplacement ou du matériel.', price: 290, recommendedFor: ['echanges'] },
  { id: 'reservation', title: 'Réduire les échanges avant le rendez-vous', description: 'Laissez le client choisir sa prestation, préciser son besoin, vérifier la zone et demander un créneau dans un même parcours.', price: 290, recommendedFor: ['incompletes', 'echanges'] },
  { id: 'redaction', title: 'Présenter votre offre avec les bons mots', description: 'Qualifyr structure et rédige les contenus à partir de votre activité, de vos prestations et des questions réelles de vos clients.', price: 390, recommendedFor: ['comparaison', 'image'] },
] as const satisfies readonly { id: OptionId; title: string; description: string; price: number; recommendedFor: readonly ObstacleId[] }[];

type Recommendation = { id: string; title: string; description: string };

const recommendations: Record<string, Recommendation> = {
  clarity: { id: 'clarity', title: 'Une offre plus facile à choisir', description: 'Vos prestations sont structurées pour que les différences et le prochain geste soient immédiatement compris.' },
  site: { id: 'site', title: 'Un site organisé autour de vos prestations', description: 'Le visiteur comprend votre activité, votre façon de travailler et comment vous contacter sans chercher l’information.' },
  guided: { id: 'guided', title: 'Une demande mieux préparée', description: 'Les informations utiles sont recueillies avant le premier échange afin de répondre avec davantage de précision.' },
  area: { id: 'area', title: 'Une zone d’intervention explicite', description: 'Le client sait rapidement si vous pouvez intervenir à son adresse avant de commencer sa demande.' },
  booking: { id: 'booking', title: 'Un passage au rendez-vous plus direct', description: 'Les choix nécessaires sont rassemblés avant la demande de créneau pour limiter les échanges dispersés.' },
  proof: { id: 'proof', title: 'Un travail mieux mis en valeur', description: 'La présentation reflète votre niveau de soin et aide le client à comprendre ce qui vous distingue.' },
  reviews: { id: 'reviews', title: 'Un suivi après la prestation', description: 'Le bon moment est prévu pour demander un avis et faciliter une future réservation.' },
  maintenance: { id: 'maintenance', title: 'Un parcours suivi dans le temps', description: 'Le site, les contenus et les étapes sont ajustés lorsque votre activité ou vos prestations évoluent.' },
  deposit: { id: 'deposit', title: 'Un acompte lorsque la prestation le justifie', description: 'Les rendez-vous qui mobilisent le plus de temps ou de préparation peuvent être confirmés avant le déplacement.' },
  writing: { id: 'writing', title: 'Des contenus entièrement rédigés', description: 'Vos informations métier sont transformées en textes précis, cohérents et directement exploitables.' },
};

export function getRecommendations(activity: ActivityId, situation: SituationId, obstacle: ObstacleId, selected: readonly OptionId[]) {
  const ids = new Set<string>(['site', 'maintenance']);
  if (['lancement', 'recommandation', 'croissance'].includes(situation) || obstacle === 'comparaison') ids.add('clarity');
  if (situation === 'site' || obstacle === 'image') ids.add('proof');
  if (situation === 'multicanal' || obstacle === 'incompletes') ids.add('guided');
  if (activity === 'automobile' || activity === 'detailing') ids.add('area');
  if (obstacle === 'echanges') ids.add('booking');
  if (obstacle === 'retour') ids.add('reviews');
  if (selected.includes('reservation')) ids.add('booking');
  if (selected.includes('acompte')) ids.add('deposit');
  if (selected.includes('redaction')) ids.add('writing');
  return [...ids].map((id) => recommendations[id]).filter((item): item is Recommendation => Boolean(item));
}

export function resolvePricingRegion(countryCode: string | null | undefined): PricingRegion {
  return countryCode?.toUpperCase() === 'CH' ? 'switzerland' : 'euro';
}

export function getOptionPrice(id: OptionId, region: PricingRegion) {
  const euroPrice = options.find((option) => option.id === id)?.price ?? 0;
  return region === 'switzerland' ? toSwissPrice(euroPrice) : euroPrice;
}

export function calculateOffer(selected: readonly OptionId[], region: PricingRegion = 'euro') {
  const pricing = pricingByRegion[region];
  const optionTotal = selected.reduce((sum, id) => sum + getOptionPrice(id, region), 0);
  return {
    optionTotal,
    firstYearTotal: pricing.setupPrice + pricing.monthlyPrice * commitmentMonths + optionTotal,
  };
}

export function calculateMonthlyEquivalent(firstYearTotal: number) {
  return firstYearTotal / commitmentMonths;
}

export function formatMoney(price: number, region: PricingRegion, fractionDigits = 0) {
  const pricing = pricingByRegion[region];
  return new Intl.NumberFormat(pricing.locale, {
    style: 'currency',
    currency: pricing.currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(price);
}
