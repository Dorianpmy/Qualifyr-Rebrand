export type ActivityId = 'automobile' | 'detailing' | 'conciergerie' | 'autre';
export type SituationId = 'lancement' | 'recommandation' | 'site' | 'multicanal' | 'croissance';
export type ObstacleId = 'comparaison' | 'incompletes' | 'echanges' | 'image' | 'retour';
export type OptionId = 'acompte' | 'reservation' | 'redaction';

export const setupPrice = 490;
export const monthlyPrice = 149;
export const commitmentMonths = 12;

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

export function calculateOffer(selected: readonly OptionId[]) {
  const optionTotal = selected.reduce((sum, id) => sum + (options.find((option) => option.id === id)?.price ?? 0), 0);
  return { optionTotal, firstYearTotal: setupPrice + monthlyPrice * commitmentMonths + optionTotal };
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR').format(price);
}
