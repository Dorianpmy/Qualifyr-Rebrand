/**
 * Coordonnées de Qualifyr Agence.
 *
 * RÈGLE ABSOLUE : ne jamais inventer une valeur. Un champ à `null` n'est pas
 * affiché — les composants (`Footer`, `ContactPanel`) omettent proprement la
 * ligne, voire le bloc entier si rien n'est renseigné.
 *
 * Renseigner uniquement des informations réelles et vérifiées.
 */

type ContactChannel = {
  readonly label: string;
  readonly value: string;
  readonly href: string;
} | null;

export const contact = {
  /** Adresse e-mail professionnelle. Exemple de forme attendue une fois connue :
   *  { label: 'E-mail', value: 'adresse@exemple.tld', href: 'mailto:adresse@exemple.tld' }
   *  — remplacer par l'adresse réelle, cet exemple n'est jamais affiché. */
  email: null as ContactChannel,

  /** Téléphone. À ne remplir que si Dorian souhaite l'afficher publiquement. */
  phone: null as ContactChannel,

  /** Nom d'affichage du domaine, sans protocole. Information factuelle, connue. */
  domain: 'qualifyragence.com',

  /** Adresse postale — non renseignée, et non inventée. */
  address: null as string | null,

  /** Réseaux sociaux — aucun compte confirmé à ce jour. */
  social: [] as readonly { readonly label: string; readonly href: string }[],

  /** Horaires — non communiqués. */
  hours: null as string | null,
} as const;

/** Canaux réellement renseignés, dans l'ordre d'affichage. */
export function availableChannels() {
  return [contact.email, contact.phone].filter(
    (channel): channel is NonNullable<ContactChannel> => channel !== null,
  );
}

/**
 * Textes de la page Contact.
 * Centralisés ici avec les coordonnées : la page ne contient aucune phrase
 * écrite en dur.
 */
export const contactPage = {
  eyebrow: 'Contact',
  title: 'Parlons de votre activité.',
  lead: 'Une question sur la façon dont nous travaillons, sur ce qui est possible ou sur votre situation en particulier ?',
  orientationSuffix: 'Pour toute autre question, ce formulaire suffit.',
  noChannel:
    'Le formulaire est pour l’instant le seul canal de contact. Une adresse directe sera indiquée ici dès qu’elle sera en service.',
} as const;
