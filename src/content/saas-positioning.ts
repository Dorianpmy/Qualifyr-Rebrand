/**
 * Positionnement produit SaaS (interne + copy source).
 *
 * Agence  → sites & identité (vitrine).
 * SaaS    → acquisition + réservation pour detailers FR / CH.
 *
 * Référence mentale : « le TrendTrack du detailing » =
 * avantage concurrentiel sur le parcours client, pas un clone Detailr.
 */

export const saasPositioning = {
  name: 'Qualifyr Detailers',
  oneLiner: 'Le parcours qui remplit le planning des detailers.',
  pitch: [
    'Chaque detailer a sa page de réservation.',
    'Le client choisit, estime, envoie photos et créneau.',
    'Toi, tu confirmes — sans aller-retour WhatsApp.',
  ],
  not: [
    'Pas un clone Detailr US.',
    'Pas un CRM fourre-tout dès le jour 1.',
    'Pas confondu avec l’agence vitrine.',
  ],
  markets: ['France', 'Suisse'] as const,
  focusNow: ['booking', 'estimation', 'photos', 'créneaux'] as const,
  focusLater: ['stats conversion', 'forfaits qui marchent', 'no-show'] as const,
} as const;
