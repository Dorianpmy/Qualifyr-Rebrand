/**
 * Hero — positionnement recentré nettoyage automobile / detailing.
 */
export const hero = {
  eyebrow: 'Agence digitale · Nettoyage automobile à domicile',
  title: 'Des sites qui transforment vos abonnés en réservations.',
  body:
    'Instagram vous fait connaître. Un site clair présente vos formules, affiche vos tarifs et transforme une visite en demande de créneau — sans passer par vingt messages privés.',
} as const;

export const heroMoments = [
  { number: '01', label: 'Comprendre' },
  { number: '02', label: 'Convaincre' },
  { number: '03', label: 'Passer à l’action' },
] as const;

/**
 * Bandeau produit SaaS sur la home (mis en avant).
 *
 * **Liens en chemins relatifs, pas en URL absolues vers `app.`.** Le
 * sous-domaine existe et mène au bon endroit, mais par une redirection 301 :
 * un lien absolu ferait donc payer un aller-retour réseau à chaque visiteur,
 * pour aboutir exactement ici. Les chemins relatifs vont droit au but et
 * restent justes si le domaine change un jour.
 */
export const saasHome = {
  eyebrow: 'Outil laveurs auto · France & Suisse',
  title: 'Le parcours qui remplit ton planning.',
  lead:
    'Chaque laveur auto a sa page de réservation. Le client choisit la formule, envoie des photos et un créneau. Toi, tu confirmes — sans aller-retour WhatsApp.',
  points: [
    {
      title: 'Page client dédiée',
      body: 'Une URL simple à partager : estimation, photos, créneau.',
    },
    {
      title: 'Demandes centralisées',
      body: 'Tout arrive dans un espace pro clair, prêt à confirmer.',
    },
    {
      title: 'Preuve avant / après',
      body: 'Montre tes transformations pour convertir plus vite.',
    },
  ],
  primaryCta: {
    label: 'Voir l’outil laveurs auto',
    href: '/reservation/demo',
  },
  secondaryCta: {
    label: 'Espace pro',
    href: '/app/login',
  },
} as const;

export const offerBlocks = [
  {
    number: '01',
    title: 'Une offre plus claire',
    body: 'Nous structurons vos formules et vos tarifs pour que vos prospects comprennent rapidement ce que vous proposez.',
  },
  {
    number: '02',
    title: 'Un site pensé pour agir',
    body: 'Chaque page guide vers une demande de créneau ou un échange utile.',
  },
  {
    number: '03',
    title: 'Un parcours mieux organisé',
    body: 'Les informations importantes arrivent au bon moment, sans compliquer votre quotidien.',
  },
] as const;

/**
 * Section « Pour qui » — freins concrets du métier detailing.
 * Plus de liste de verticales : un seul métier, trois points de friction.
 */
export const frictionPoints = [
  {
    number: '01',
    title: 'Des formules floues',
    body: 'Intérieur, extérieur, prestation complète — sans hiérarchie claire, le prospect compare au prix et part ailleurs.',
  },
  {
    number: '02',
    title: 'Des tarifs absents ou cachés',
    body: 'Sans fourchette visible, la conversation commence par « ça coûte combien ? » au lieu de « je veux réserver ».',
  },
  {
    number: '03',
    title: 'Un contact qui freine',
    body: 'DM Instagram, appels manqués, messages incomplets. Le client prêt à réserver abandonne faute de parcours simple.',
  },
] as const;

export const sectors = [
  {
    title: 'Nettoyage automobile mobile à domicile',
    body: 'Présentez clairement vos formules, votre zone d’intervention et la façon de réserver.',
  },
] as const;

export const transformations = [
  {
    number: '01',
    title: 'Être compris',
    body: 'Une offre claire, structurée et immédiatement lisible.',
  },
  {
    number: '02',
    title: 'Être choisi',
    body: 'Une identité et un site qui inspirent confiance avant le premier échange.',
  },
  {
    number: '03',
    title: 'Être contacté',
    body: 'Un parcours simple qui guide le visiteur vers la bonne action.',
  },
] as const;

/** @deprecated Conservé pour compat — préférer frictionPoints. */
export const serviceCompanies = [
  {
    title: 'Nettoyage automobile à domicile',
    body: 'Présenter les prestations, valoriser le niveau de travail et simplifier le passage vers la prise de contact.',
    href: '/nettoyage-automobile' as const,
  },
] as const;

export const method = [
  { number: '01', title: 'Comprendre', body: 'Votre activité, vos clients, votre différence et vos objectifs.' },
  { number: '02', title: 'Clarifier', body: 'L’offre, le message, la hiérarchie et les actions attendues.' },
  { number: '03', title: 'Concevoir', body: 'L’identité, les contenus, le site et le parcours de contact.' },
  { number: '04', title: 'Améliorer', body: 'Les détails, la lisibilité, l’expérience mobile et les points de friction.' },
] as const;
