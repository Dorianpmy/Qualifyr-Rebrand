import { productionDomain } from '@/content/site';

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
  /** Adresse e-mail professionnelle confirmée par Dorian le 1er août 2026. */
  email: {
    label: 'E-mail',
    value: 'qualifyragence@gmail.com',
    href: 'mailto:qualifyragence@gmail.com',
  } as ContactChannel,

  /** Téléphone. À ne remplir que si Dorian souhaite l'afficher publiquement. */
  phone: null as ContactChannel,

  /** Nom d'affichage du domaine, sans protocole. Information factuelle, connue. */
  domain: productionDomain,

  /** Adresse postale — non renseignée, et non inventée. */
  address: null as string | null,

  /** Réseaux sociaux publics confirmés par Dorian le 31 juillet 2026. */
  social: [
    {
      label: 'Instagram',
      icon: 'instagram',
      href: 'https://www.instagram.com/qualifyragence/',
    },
    {
      label: 'TikTok',
      icon: 'tiktok',
      href: 'https://www.tiktok.com/@qualifyragence?_r=1&_t=ZN-98URb6Oe4Re',
    },
  ] as const satisfies readonly {
    readonly label: string;
    readonly icon: 'instagram' | 'tiktok';
    readonly href: string;
  }[],

  /** Horaires — non communiqués. */
  hours: null as string | null,
} as const;

/** Zone d'accompagnement confirmée dans le brief du 30 juillet 2026. */
export const serviceAreas = ['France', 'Belgique', 'Suisse', 'Luxembourg'] as const;

/**
 * Coordonnées affichées en toutes lettres dans les blocs génériques.
 * L'e-mail reste disponible via les boutons dédiés de la page Contact, sans
 * exposer l'adresse brute dans le footer ou les panneaux éditoriaux.
 */
export function availableChannels() {
  return [contact.phone].filter(
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
  title: 'Discutons de votre projet.',
  lead: 'Expliquez-nous ce que vous souhaitez créer, clarifier ou améliorer. Quelques lignes suffisent pour commencer.',
  briefTitle: 'Votre brief.',
  briefLead: 'Plus votre message est précis, plus notre première réponse pourra être utile.',
  directTitle: 'Ou plus direct.',
  directLead: 'Choisissez simplement le canal qui vous convient.',
} as const;
