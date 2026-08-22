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
 * **Ne lister que des services effectivement en place.** Netlify héberge le
 * site en production (confirmé) — ajouté le 22/08/2026. Aucun autre
 * prestataire n'est configuré à ce jour : ni fournisseur d'e-mail, ni outil
 * de mesure d'audience.
 */
export const processors: readonly Processor[] = [
  {
    name: 'Netlify, Inc.',
    purpose: 'Hébergement et distribution du site.',
    location: 'États-Unis',
  },
];

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
