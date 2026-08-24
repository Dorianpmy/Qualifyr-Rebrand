import { productionDomain } from '@/content/site';

/**
 * Informations légales de la structure éditrice.
 *
 * RÈGLE ABSOLUE : **ne jamais inventer une valeur ici.** Ni nom légal, ni forme
 * juridique, ni adresse, ni numéro d'entreprise, ni TVA, ni directeur de
 * publication, ni hébergeur, ni e-mail.
 *
 * Un champ à `null` n'est pas affiché : les pages légales omettent la ligne
 * proprement et signalent que l'information reste à publier. Aucun placeholder
 * du type « À compléter » n'est montré au visiteur.
 *
 * Inventaire de ce qui manque : `docs/07-informations-legales-requises.md`.
 */

export type Hosting = {
  /** Raison sociale de l'hébergeur. */
  readonly name: string;
  /** Adresse postale complète. */
  readonly address: string;
  /** Contact — téléphone ou formulaire. */
  readonly contact: string;
};

export type Processor = {
  readonly name: string;
  readonly purpose: string;
  readonly location: string;
};

export type Mediator = {
  readonly name: string;
  /** Site internet ou adresse de saisine. */
  readonly contact: string;
};

export const company = {
  /** Nom commercial. Seule information de marque confirmée. */
  tradeName: 'Qualifyr Agence',

  /**
   * Raison sociale exacte. Un entrepreneur individuel n'a pas de raison
   * sociale distincte de son état civil — vérifié le 22/08/2026 auprès du
   * registre officiel (recherche-entreprises.api.gouv.fr, source Sirene/RNE)
   * sur le SIRET 999 132 921 00019.
   */
  legalName: 'Dorian Poumay' as string | null,

  /**
   * Forme juridique. Confirmée par Dorian et par le registre officiel
   * (`complements.est_entrepreneur_individuel: true`, SIRET créé le
   * 29/12/2025).
   */
  legalForm: 'Entrepreneur individuel (micro-entreprise)' as string | null,

  /** Capital social, si la forme juridique en comporte un. Sans objet en EI. */
  shareCapital: null as string | null,

  /**
   * SIREN ou SIRET. Vérifié le 22/08/2026 auprès du registre officiel —
   * établissement actif (`etat_administratif: "A"`).
   */
  registrationNumber: '999 132 921 00019' as string | null,

  /** Ville du greffe et numéro RCS, le cas échéant. Sans objet en EI. */
  registry: null as string | null,

  /**
   * Numéro de TVA intracommunautaire, ou mention de franchise en base.
   * Confirmé par Dorian le 22/08/2026 : facturation sans TVA (franchise en
   * base, régime par défaut d'une micro-entreprise créée fin décembre 2025 —
   * cohérent avec `tva: null` sur le registre officiel).
   */
  vatNumber: 'TVA non applicable, article 293 B du CGI (franchise en base)' as
    | string
    | null,

  /**
   * Adresse du siège. Vérifiée le 22/08/2026 auprès du registre officiel.
   */
  address: '12 Impasse du Couvent, Bâtiment Villa 1, Étage 1, 84170 Monteux' as
    | string
    | null,

  /** Directeur de la publication. */
  publicationDirector: 'Dorian Poumay' as string | null,

  /**
   * Adresse e-mail de contact publiée. Confirmée par Dorian le 22/08/2026 —
   * redirige vers sa boîte personnelle, mais c'est l'adresse à afficher.
   */
  email: 'contact@qualifyragence.com' as string | null,

  /** Téléphone publié. Non retenu — Dorian n'a pas souhaité en publier un. */
  phone: null as string | null,

  /**
   * Hébergeur du site — mention obligatoire en France. Netlify, Inc.
   * Adresse vérifiée le 22/08/2026 sur les conditions d'utilisation
   * officielles de Netlify (netlify.com/legal/terms-of-use, section 14,
   * « Contact Information »).
   */
  hosting: {
    name: 'Netlify, Inc.',
    address: '101 2nd Street, San Francisco, CA 94105, États-Unis',
    contact: 'support@netlify.com',
  } as Hosting | null,

  /** Domaine, information factuelle et confirmée. */
  domain: productionDomain,
} as const;

/**
 * Sous-traitants qui traitent réellement des données.
 *
 * **Ne lister que des services effectivement en place.** Le commentaire
 * précédent (« aucun autre prestataire n'est configuré à ce jour ») datait du
 * 22/08/2026 et ne l'était déjà plus le lendemain : Resend envoie en
 * production, Supabase porte la base et l'authentification, Stripe encaisse,
 * Mistral classe les prospects Hermès depuis le 24/08/2026. Mis à jour le
 * 24/08/2026 pour refléter les cinq.
 *
 * **`location` vient d'une source officielle du prestataire, ou de Dorian
 * pour ce qu'aucune source publique ne documente** (le choix de région d'un
 * projet Supabase, par exemple, est un réglage propre à ce projet — jamais
 * une supposition à partir de la documentation générale du prestataire).
 */
export const processors: readonly Processor[] = [
  {
    name: 'Netlify, Inc.',
    purpose:
      'Hébergement et distribution du site ; fournit le code pays utilisé pour la présélection tarifaire.',
    location: 'États-Unis',
  },
  {
    name: 'Supabase, Inc.',
    purpose:
      'Base de données et authentification de l’espace professionnel : comptes, zones et prospects recensés, campagnes Hermès, réservations, abonnements.',
    /*
     * Deux faits distincts, aucun ne remplace l'autre : la région
     * d'hébergement (un réglage du projet, confirmé par Dorian le
     * 24/08/2026 : Irlande, eu-west-1) et le siège de la société
     * (États-Unis, conditions Supabase). N'écrire que « Irlande » laisserait
     * croire qu'aucune entité américaine n'est concernée ; n'écrire que
     * « États-Unis » laisserait croire que les données y sont stockées.
     * Région d'abord — c'est ce qui compte le plus pour un lecteur RGPD.
     */
    location: 'Irlande (eu-west-1, hébergement des données du projet) — siège de la société aux États-Unis',
  },
  {
    name: 'Resend',
    purpose:
      'Envoi des e-mails du site : formulaires, réservations, factures, et prospection Hermès sur un sous-domaine d’expédition dédié.',
    // Source : resend.com/legal/subprocessors — tous les sous-traitants
    // listés (infrastructure AWS comprise) sont situés aux États-Unis.
    location: 'États-Unis',
  },
  {
    name: 'Stripe',
    purpose:
      'Paiement des abonnements Qualifyr et des acomptes clients des professionnels (Stripe Connect).',
    /*
     * Source : stripe.com/legal/privacy-center. Pour un marchand européen,
     * l'entité contractante est Stripe Payments Europe, Limited (Irlande) ;
     * Stripe Technology Company, Limited (Irlande) est l'établissement
     * principal au sens du RGPD. Le traitement reste international
     * (clauses contractuelles types / cadre UE-États-Unis de protection des
     * données) — la page ne donne pas de localisation unique des serveurs.
     */
    location:
      'Irlande (Stripe Payments Europe, Limited, entité contractante pour les marchands européens) — traitement international encadré par des clauses contractuelles types',
  },
  {
    name: 'Mistral AI',
    purpose:
      'Classement des entreprises recensées par pertinence pour l’activité du professionnel (Hermès). Ne reçoit jamais l’adresse e-mail ni le jeton de désinscription — voir lib/agent/relevance.ts.',
    /*
     * Source : legal.mistral.ai (société) et legal.mistral.ai/terms/privacy-
     * policy, qui énonce elle-même la nuance reprise ici plutôt qu'une
     * affirmation plus simple mais moins fidèle : « nous privilégions des
     * prestataires situés dans l'Union européenne [...], mais pouvons
     * exceptionnellement recourir à des prestataires hors UE ».
     */
    location:
      'France (siège, Paris) — hébergement annoncé prioritairement dans l’Union européenne, exceptions hors UE possibles selon la politique de confidentialité de Mistral',
  },
];

/**
 * Médiateur de la consommation.
 *
 * `null` tant que Dorian n'a pas souscrit d'adhésion payante auprès d'un
 * médiateur agréé (liste officielle : economie.gouv.fr/mediation-conso,
 * rubrique « médiateurs référencés ») — un choix qui lui appartient seul, et
 * qui ne concerne d'ailleurs que les litiges avec un client agissant comme
 * consommateur au sens du code de la consommation (une entreprise qui
 * souscrit pour son activité n'en est pas un — voir `content/terms.ts`,
 * section « objet », sur l'incertitude déjà signalée à ce sujet).
 *
 * La clause CGV correspondante (`content/terms.ts`) ne s'affiche que si ce
 * champ est renseigné : citer un médiateur qui n'existe pas serait une
 * fausse information juridique, pire que l'absence de clause.
 *
 * TODO_CONTENU_REEL : nom et coordonnées de saisine du médiateur choisi.
 */
export const mediator: Mediator | null = null;

/**
 * Durées de conservation.
 *
 * `null` tant que la durée n'est pas arrêtée : annoncer une durée qui ne sera
 * pas respectée serait pire que de reconnaître qu'elle reste à définir.
 */
export const retention = {
  formSubmissions: null as string | null,
} as const;

/**
 * Mesure d'audience et cookies.
 *
 * **Aucun fournisseur de mesure n'est installé.** Aucun cookie n'est déposé.
 * Le stockage de session sert uniquement à garder l'origine non personnelle
 * d'une campagne pendant l'onglet courant.
 */
export const tracking = {
  analytics: null as string | null,
  cookies: [] as readonly { readonly name: string; readonly purpose: string }[],
} as const;

/**
 * Champs volontairement **non publiés**, sur décision de Dorian.
 *
 * **La valeur reste renseignée plus haut, elle n'est pas effacée.** La
 * distinction est importante : une donnée absente signifie « pas encore
 * connue » et fait apparaître la note « sera publiée avant la mise en ligne ».
 * Une donnée retenue signifie « connue, vérifiée, mais pas affichée » — ce qui
 * n'appelle aucune note d'attente, et permet de la republier en changeant une
 * seule ligne ici.
 *
 * **Adresse retirée le 22/08/2026, à la demande explicite de Dorian**, le
 * siège étant son domicile personnel.
 *
 * ⚠️ **Cette omission est un écart connu à l'article 6 de la LCEN**, qui
 * impose la publication de l'adresse du siège pour un site professionnel.
 * Dorian en a été informé avant la modification et l'a assumée. La solution
 * durable est une domiciliation commerciale : une adresse professionnelle
 * légale, déclarée comme siège, qui remplace le domicile partout. Dès qu'elle
 * existera, retirer `'address'` de cette liste et mettre `company.address`
 * à jour suffira à revenir en conformité.
 */
export const withheldFromPublicNotice: readonly (keyof typeof company)[] = ['address'];

/** Vrai si assez d'informations existent pour publier des mentions légales conformes. */
export function legalNoticeIsComplete(): boolean {
  return (
    company.legalName !== null &&
    company.legalForm !== null &&
    company.registrationNumber !== null &&
    company.address !== null &&
    company.publicationDirector !== null &&
    company.hosting !== null &&
    company.email !== null
  );
}
