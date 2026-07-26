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

  /** Raison sociale exacte, telle qu'immatriculée. */
  legalName: null as string | null,

  /** Forme juridique : micro-entreprise, SASU, SARL… */
  legalForm: null as string | null,

  /** Capital social, si la forme juridique en comporte un. */
  shareCapital: null as string | null,

  /** SIREN ou SIRET. */
  registrationNumber: null as string | null,

  /** Ville du greffe et numéro RCS, le cas échéant. */
  registry: null as string | null,

  /** Numéro de TVA intracommunautaire, ou mention de franchise en base. */
  vatNumber: null as string | null,

  /** Adresse du siège. */
  address: null as string | null,

  /** Directeur de la publication. */
  publicationDirector: null as string | null,

  /** Adresse e-mail de contact publiée. */
  email: null as string | null,

  /** Téléphone publié. */
  phone: null as string | null,

  /** Hébergeur du site — mention obligatoire en France. */
  hosting: null as Hosting | null,

  /** Domaine, information factuelle et confirmée. */
  domain: 'qualifyragence.com',
} as const;

/**
 * Sous-traitants qui traitent réellement des données.
 *
 * **Ne lister que des services effectivement en place.** Aujourd'hui, aucun
 * n'est configuré : ni fournisseur d'e-mail, ni hébergeur retenu, ni outil de
 * mesure d'audience. Le tableau reste vide, et la politique de confidentialité
 * le dit franchement.
 */
export const processors: readonly Processor[] = [];

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
 * **Aucun outil de mesure n'est installé.** Aucun cookie n'est déposé : ni
 * publicitaire, ni de mesure, ni de préférence. Le site ne stocke rien dans le
 * navigateur. Ne modifier ces valeurs qu'en même temps que le code.
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

