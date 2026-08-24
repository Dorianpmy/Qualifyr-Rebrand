import { offerById, type OfferId } from '@/content/estimation-offers';

/**
 * Le parcours d'estimation : questions, réponses, recommandation.
 *
 * **Module pur, sans React ni réseau.** La recommandation est la partie qui
 * engage commercialement : elle doit être lisible d'un bloc, testable sans
 * navigateur, et modifiable sans toucher à l'interface. Le composant se
 * contente d'appeler `recommend()`.
 *
 * **Le score n'est pas une intelligence, et c'est voulu.** Chaque réponse
 * ajoute des points à deux besoins seulement — « trouver des clients » et
 * « organiser les demandes » — plus un indicateur de besoin de site. Un modèle
 * plus fin donnerait une illusion de précision sur des réponses déclaratives.
 * Ce que le prospect attend ici, c'est de ne pas se tromper d'offre, pas
 * d'obtenir un devis au centime.
 *
 * **Le budget ne décide jamais seul.** Il ne sert qu'à choisir entre le pack et
 * sa moitié la plus utile quand les deux besoins existent : recommander une
 * offre hors budget fait fuir, mais amputer quelqu'un qui a les moyens de la
 * bonne solution lui rend un mauvais service. La règle exacte est en bas.
 */

/* ------------------------------------------------------------------ */
/* Les questions                                                       */
/* ------------------------------------------------------------------ */

export type QuestionId =
  | 'activity'
  | 'channels'
  | 'problems'
  | 'priorities'
  | 'scope'
  | 'volume'
  | 'budget'
  | 'website';

export type Choice = {
  readonly id: string;
  readonly label: string;
  /** Précision courte, affichée sous le libellé. */
  readonly hint?: string;
};

export type Question = {
  readonly id: QuestionId;
  readonly title: string;
  /** Phrase d'aide, affichée sous le titre. */
  readonly help?: string;
  readonly multiple: boolean;
  /** Une réponse est-elle obligatoire pour continuer ? */
  readonly required: boolean;
  readonly choices: readonly Choice[];
  /** Propose un champ libre quand ce choix est retenu. */
  readonly freeTextFor?: string;
};

export const questions: readonly Question[] = [
  {
    id: 'activity',
    title: 'Quelle est votre activité principale ?',
    multiple: false,
    required: true,
    choices: [
      { id: 'lavage', label: 'Lavage automobile' },
      { id: 'detailing', label: 'Detailing automobile' },
      { id: 'preparation', label: 'Préparation esthétique automobile' },
      { id: 'domicile', label: 'Lavage automobile à domicile' },
      { id: 'flottes', label: 'Service pour VTC, taxis ou flottes' },
      { id: 'autre-local', label: 'Autre activité de service local' },
      { id: 'autre', label: 'Autre' },
    ],
    freeTextFor: 'autre',
  },
  {
    id: 'channels',
    title: 'Comment recevez-vous vos demandes aujourd’hui ?',
    help: 'Plusieurs réponses possibles.',
    multiple: true,
    required: true,
    choices: [
      { id: 'telephone', label: 'Téléphone' },
      { id: 'whatsapp', label: 'WhatsApp' },
      { id: 'reseaux', label: 'Instagram ou Facebook' },
      { id: 'formulaire', label: 'Formulaire de contact' },
      { id: 'site', label: 'Site internet' },
      { id: 'bouche-a-oreille', label: 'Recommandations ou bouche-à-oreille' },
      { id: 'peu', label: 'Je reçois encore très peu de demandes' },
    ],
  },
  {
    id: 'problems',
    title: 'Qu’est-ce qui vous coûte le plus de temps ou d’argent ?',
    help: 'Plusieurs réponses possibles.',
    multiple: true,
    required: true,
    choices: [
      { id: 'repetition', label: 'Je réponds sans arrêt aux mêmes questions' },
      { id: 'devis-manuels', label: 'Je fais encore mes devis à la main' },
      { id: 'prospects-perdus', label: 'Je perds des prospects après le premier contact' },
      { id: 'annulations', label: 'Mes clients oublient ou annulent leurs rendez-vous' },
      { id: 'pas-de-reservation', label: 'Je n’ai pas de système de réservation' },
      { id: 'visibilite', label: 'Je manque de visibilité professionnelle' },
      { id: 'volume-clients', label: 'Je n’ai pas assez de clients' },
    ],
  },
  {
    id: 'priorities',
    title: 'Que voulez-vous améliorer en priorité ?',
    help: 'Plusieurs réponses possibles.',
    multiple: true,
    required: true,
    choices: [
      { id: 'presenter', label: 'Présenter clairement mes services' },
      { id: 'qualifier', label: 'Recevoir et qualifier les demandes' },
      { id: 'reserver', label: 'Permettre la réservation en ligne' },
      { id: 'acomptes', label: 'Recevoir des acomptes' },
      { id: 'no-show', label: 'Réduire les rendez-vous non honorés' },
      { id: 'trouver', label: 'Trouver de nouveaux clients professionnels' },
      { id: 'site-pro', label: 'Avoir un site professionnel' },
      { id: 'centraliser', label: 'Centraliser mes outils' },
    ],
  },
  {
    id: 'scope',
    title: 'Vers quoi penchez-vous ?',
    help: 'Si vous ne savez pas encore, dites-le : vos réponses précédentes suffisent.',
    multiple: false,
    required: true,
    choices: [
      {
        id: 'agent',
        label: 'L’agent de recensement seul',
        hint: 'Il recense les entreprises d’une zone et vous envoie la liste par e-mail.',
      },
      {
        id: 'reservation',
        label: 'Le système de réservation seul',
        hint: 'Vos clients réservent en ligne, voient le prix et versent un acompte.',
      },
      { id: 'pack', label: 'Les deux' },
      { id: 'site-vitrine', label: 'Un site vitrine' },
      { id: 'site-reservation', label: 'Un site avec réservation' },
      { id: 'complet', label: 'La solution la plus complète' },
      { id: 'inconnu', label: 'Je ne sais pas encore' },
    ],
  },
  {
    id: 'volume',
    title: 'Combien de demandes recevez-vous par mois, environ ?',
    multiple: false,
    required: true,
    choices: [
      { id: 'moins-10', label: 'Moins de 10' },
      { id: '10-30', label: 'Entre 10 et 30' },
      { id: '30-60', label: 'Entre 30 et 60' },
      { id: 'plus-60', label: 'Plus de 60' },
      { id: 'inconnu', label: 'Je ne sais pas' },
    ],
  },
  {
    id: 'budget',
    title: 'Quel budget mensuel envisagez-vous pour vos outils ?',
    multiple: false,
    required: true,
    choices: [
      /* Paliers réalignés le 24/08/2026 sur la grille 17 / 49 / 59 €. Les
         anciens (15, 30, 50) venaient de la grille 9 / 29 / 39 : « moins de
         15 € » ne correspondait plus à aucune offre, et le visiteur qui le
         choisissait recevait une recommandation au-dessus du budget qu'il
         venait de déclarer, sans que rien ne le lui dise. Chaque palier doit
         contenir au moins une offre. */
      { id: 'moins-20', label: 'Moins de 20 € par mois' },
      { id: '20-50', label: 'Entre 20 et 50 € par mois' },
      { id: '50-80', label: 'Entre 50 et 80 € par mois' },
      { id: 'plus-80', label: 'Plus de 80 € par mois' },
      { id: 'simple', label: 'Je préfère commencer au plus simple' },
    ],
  },
  {
    id: 'website',
    title: 'Avez-vous déjà un site internet ?',
    multiple: false,
    required: true,
    choices: [
      { id: 'oui-ameliorer', label: 'Oui, et je veux l’améliorer' },
      { id: 'oui-insuffisant', label: 'Oui, mais il ne m’apporte pas de demandes' },
      { id: 'non', label: 'Non, pas encore' },
      { id: 'creation', label: 'Je suis en train de créer mon activité' },
    ],
  },
] as const;

/** Réponses : un identifiant de question vers les identifiants de choix retenus. */
export type Answers = Partial<Record<QuestionId, readonly string[]>>;

/* ------------------------------------------------------------------ */
/* La recommandation                                                   */
/* ------------------------------------------------------------------ */

export type Recommendation = {
  readonly offerId: OfferId;
  /** Phrase personnalisée, construite à partir des réponses réelles. */
  readonly rationale: string;
  /** Prestation de création à envisager en plus de l'abonnement, le cas échéant. */
  readonly companionOfferId: OfferId | null;
  /** Ce qui a pesé dans la décision, pour pouvoir l'expliquer au prospect. */
  readonly scores: { readonly acquisition: number; readonly organisation: number; readonly site: number };
};

/** Poids par réponse. Une réponse absente vaut zéro. */
const WEIGHTS: Readonly<
  Record<QuestionId, Readonly<Record<string, { acquisition?: number; organisation?: number; site?: number }>>>
> = {
  activity: {
    // Servir des flottes suppose de démarcher des entreprises : c'est le seul
    // profil où le recensement est utile par nature.
    flottes: { acquisition: 2 },
  },
  channels: {
    peu: { acquisition: 2, site: 1 },
    telephone: { organisation: 1 },
    whatsapp: { organisation: 1 },
    reseaux: { organisation: 1, site: 1 },
    'bouche-a-oreille': { acquisition: 1 },
  },
  problems: {
    repetition: { organisation: 2 },
    'devis-manuels': { organisation: 2 },
    'prospects-perdus': { organisation: 2 },
    annulations: { organisation: 3 },
    'pas-de-reservation': { organisation: 3 },
    visibilite: { site: 2 },
    'volume-clients': { acquisition: 3 },
  },
  priorities: {
    presenter: { site: 2 },
    qualifier: { organisation: 2 },
    reserver: { organisation: 3 },
    acomptes: { organisation: 3 },
    'no-show': { organisation: 3 },
    trouver: { acquisition: 3 },
    'site-pro': { site: 3 },
    centraliser: { organisation: 1 },
  },
  scope: {},
  volume: {
    'moins-10': { acquisition: 1 },
    'plus-60': { organisation: 1 },
  },
  budget: {},
  website: {
    non: { site: 2 },
    creation: { site: 2 },
    'oui-insuffisant': { site: 1 },
    'oui-ameliorer': { site: 1 },
  },
};

/** Budget mensuel déclaré → plafond en euros. `null` = pas de plafond. */
const BUDGET_CEILING: Readonly<Record<string, number | null>> = {
  'moins-20': 20,
  '20-50': 50,
  '50-80': 80,
  'plus-80': null,
  // « Commencer au plus simple » n'est pas un montant : c'est une préférence
  // pour l'offre la plus légère, traitée comme un plafond bas. 20 € plutôt
  // que 15 : sous 17 €, plus aucune offre n'existe, et un plafond que rien
  // ne peut satisfaire ne rétrograde vers rien du tout.
  simple: 20,
};

function scoreOf(answers: Answers) {
  const totals = { acquisition: 0, organisation: 0, site: 0 };

  for (const question of questions) {
    const picked = answers[question.id] ?? [];
    const table = WEIGHTS[question.id];
    for (const choice of picked) {
      const weight = table[choice];
      if (!weight) continue;
      totals.acquisition += weight.acquisition ?? 0;
      totals.organisation += weight.organisation ?? 0;
      totals.site += weight.site ?? 0;
    }
  }

  return totals;
}

/** Le prospect a-t-il désigné lui-même une offre ? */
function explicitChoice(answers: Answers): OfferId | null {
  const scope = answers['scope']?.[0];
  switch (scope) {
    case 'agent':
      return 'agent';
    case 'reservation':
      return 'reservation';
    case 'pack':
    case 'complet':
      return 'pack';
    case 'site-vitrine':
      return 'site-vitrine';
    case 'site-reservation':
      return 'site-reservation';
    default:
      return null;
  }
}

/**
 * Calcule la recommandation.
 *
 * Ordre des règles, du plus fort au plus faible :
 *
 * 1. **Un choix explicite est respecté.** Quand le prospect a désigné une
 *    offre à l'étape « Vers quoi penchez-vous ? », on ne la contredit pas.
 *    Lui répondre autre chose que ce qu'il vient de demander détruit la
 *    confiance dans le reste de l'estimation. Seule exception : le budget,
 *    traité en 4.
 * 2. **Les deux besoins présents → le pack.** Un score d'acquisition et un
 *    score d'organisation tous deux significatifs décrivent quelqu'un qui
 *    cherche des clients *et* peine à les traiter.
 * 3. **Un seul besoin → l'offre correspondante.**
 * 4. **Le budget peut rétrograder, jamais promouvoir.** Si l'offre retenue
 *    dépasse le plafond déclaré, on descend à la plus utile de ses moitiés —
 *    celle dont le score est le plus élevé. On ne monte jamais quelqu'un vers
 *    une offre plus chère parce qu'il en aurait les moyens.
 * 5. **Le site est une prestation en plus, pas à la place.** Un besoin de site
 *    fort ne remplace pas l'abonnement : il s'y ajoute comme `companionOffer`.
 *    Le site ne devient la recommandation principale que si aucun besoin
 *    logiciel ne ressort.
 */
export function recommend(answers: Answers): Recommendation {
  const scores = scoreOf(answers);
  const chosen = explicitChoice(answers);

  const wantsAcquisition = scores.acquisition >= 3;
  const wantsOrganisation = scores.organisation >= 3;
  const wantsSite = scores.site >= 3;

  let offerId: OfferId;

  if (chosen) {
    offerId = chosen;
  } else if (wantsAcquisition && wantsOrganisation) {
    offerId = 'pack';
  } else if (wantsOrganisation) {
    offerId = 'reservation';
  } else if (wantsAcquisition) {
    offerId = 'agent';
  } else if (wantsSite) {
    /* Aucun besoin logiciel net, mais un besoin de présence : la prestation
       devient la réponse principale. Le site avec réservation n'est proposé
       ici que s'il a été explicitement demandé en priorité — sinon on part du
       plus léger, qu'on peut toujours étendre ensuite. */
    offerId = (answers['priorities'] ?? []).includes('reserver')
      ? 'site-reservation'
      : 'site-vitrine';
  } else {
    // Rien ne ressort. L'offre la plus légère est la bonne réponse par défaut :
    // elle engage le moins, et laisse la place à un échange.
    offerId = 'agent';
  }

  // 4. Plafond de budget — uniquement sur les offres à abonnement.
  const ceiling = BUDGET_CEILING[answers['budget']?.[0] ?? ''] ?? null;
  const monthly = offerById[offerId].monthly;

  if (ceiling !== null && monthly !== null && monthly > ceiling) {
    /*
     * Repli en cascade, et non à un seul niveau.
     *
     * La première version n'essayait qu'un repli : depuis le pack, elle
     * proposait la réservation si l'organisation dominait, et abandonnait si
     * celle-ci dépassait encore le plafond — laissant le prospect devant une
     * offre à 39 € alors qu'il venait d'annoncer moins de 15 €. Le test
     * « rétrograde quand l'offre dépasse le budget déclaré » l'a relevé.
     *
     * On descend donc jusqu'à trouver une offre qui tient. L'ordre commence
     * par la moitié la plus utile au prospect — il est plus important de lui
     * garder ce dont il a le plus besoin que de lui garder le moins cher.
     */
    const preferred: OfferId =
      scores.organisation > scores.acquisition ? 'reservation' : 'agent';
    const cascade: readonly OfferId[] = [preferred, 'agent', 'reservation'];

    const affordable = cascade.find((candidate) => {
      const price = offerById[candidate].monthly;
      return price !== null && price <= ceiling;
    });

    // Si rien ne tient dans le budget annoncé, on garde l'offre juste : lui
    // montrer une offre qui ne répond pas à son besoin sous prétexte qu'elle
    // est moins chère ne l'aide pas davantage.
    if (affordable) offerId = affordable;
  }

  // 5. Le site en complément.
  const isSiteOffer = offerId === 'site-vitrine' || offerId === 'site-reservation';
  const companionOfferId: OfferId | null =
    !isSiteOffer && wantsSite
      ? answers['priorities']?.includes('reserver')
        ? 'site-reservation'
        : 'site-vitrine'
      : null;

  return { offerId, rationale: rationaleFor(offerId, scores, answers), companionOfferId, scores };
}

/**
 * Rédige l'explication.
 *
 * **Elle reprend les mots du prospect.** Une phrase générique (« cette offre
 * est adaptée à votre activité ») ne convainc personne ; citer ce qu'il vient
 * de cocher montre que la recommandation vient de ses réponses et non d'un
 * tirage. Aucune promesse de résultat n'y figure — seulement ce que l'offre
 * fait.
 */
function rationaleFor(
  offerId: OfferId,
  scores: Recommendation['scores'],
  answers: Answers,
): string {
  const offer = offerById[offerId];
  const problems = answers['problems'] ?? [];

  const trigger = problems.includes('annulations')
    ? 'des rendez-vous non honorés'
    : problems.includes('devis-manuels')
      ? 'des devis faits à la main'
      : problems.includes('repetition')
        ? 'des mêmes questions qui reviennent'
        : problems.includes('volume-clients')
          ? 'du manque de clients'
          : problems.includes('pas-de-reservation')
            ? 'de l’absence de système de réservation'
            : null;

  const opening = trigger
    ? `Vous avez signalé que ${trigger} vous pèse aujourd’hui.`
    : 'D’après vos réponses,';

  const verdict =
    scores.acquisition >= 3 && scores.organisation >= 3
      ? `l’offre ${offer.name} couvre les deux besoins que vous décrivez : trouver des clients, et traiter les demandes sans y passer vos soirées.`
      : `l’offre ${offer.name} correspond à ce que vous cherchez en priorité.`;

  return `${opening} ${trigger ? 'L’' + verdict.slice(1) : verdict}`;
}
