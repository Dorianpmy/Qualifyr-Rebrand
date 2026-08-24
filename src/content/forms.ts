/**
 * Définition des formulaires : options, libellés, textes d'état.
 *
 * Les valeurs techniques (`value`) sont stables et servent aussi côté serveur.
 * Ne pas les renommer sans mettre à jour `src/lib/validation.ts`.
 */

export type SelectOption = {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
};

export const activityOptions = [
  {
    value: 'nettoyage-detailing',
    label: 'Nettoyage automobile / lavage à domicile',
    description: 'Prestations mobiles, à domicile ou dans votre atelier.',
  },
  {
    value: 'autre-service',
    label: 'Autre activité liée au véhicule',
    description: 'Detailing, esthétique auto, préparation ou nettoyage professionnel : présentez votre activité, nous vérifierons si le projet est cohérent.',
  },
] as const satisfies readonly SelectOption[];

export const practiceModeOptions = [
  { value: 'domicile', label: 'À domicile' },
  { value: 'atelier', label: 'En atelier' },
  { value: 'les-deux', label: 'Les deux' },
] as const satisfies readonly SelectOption[];

export const siteSituationOptions = [
  { value: 'lancement', label: 'Je lance mon activité' },
  { value: 'sans-site', label: 'Je n’ai pas encore de site' },
  { value: 'site-decale', label: 'Mon site ne reflète plus la qualité de mon activité' },
  { value: 'peu-demandes', label: 'Mon site est correct, mais génère peu de demandes' },
  { value: 'offre-floue', label: 'Mon offre manque encore de clarté' },
  { value: 'conseil', label: 'Je souhaite être conseillé' },
] as const satisfies readonly SelectOption[];

export const demandSourceOptions = [
  { value: 'recommandation', label: 'Recommandation / bouche-à-oreille' },
  { value: 'google', label: 'Google' },
  { value: 'reseaux-sociaux', label: 'Instagram / TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'publicite', label: 'Publicité' },
  { value: 'partenariats', label: 'Partenariats' },
  { value: 'autre', label: 'Autre' },
] as const satisfies readonly SelectOption[];

export const priorityOptions = [
  { value: 'clarifier-offre', label: 'Clarifier mon offre' },
  { value: 'image-premium', label: 'Donner une image plus premium' },
  { value: 'nouveau-site', label: 'Créer un nouveau site' },
  { value: 'refaire-site', label: 'Refaire mon site actuel' },
  { value: 'demandes-serieuses', label: 'Obtenir davantage de demandes sérieuses' },
  { value: 'prise-contact', label: 'Simplifier la prise de contact' },
  { value: 'realisations', label: 'Mieux présenter mes réalisations' },
  { value: 'nouvelle-activite', label: 'Lancer une nouvelle activité' },
  { value: 'conseil', label: 'Être conseillé avant de décider' },
] as const satisfies readonly SelectOption[];

export const timingOptions = [
  { value: 'des-que-possible', label: 'Dès que possible' },
  { value: 'moins-un-mois', label: 'Dans moins d’un mois' },
  { value: 'un-trois-mois', label: 'Dans un à trois mois' },
  { value: 'plus-tard', label: 'Plus tard' },
  { value: 'inconnu', label: 'Je ne sais pas encore' },
] as const satisfies readonly SelectOption[];

export const budgetStatusOptions = [
  { value: 'oui', label: 'Oui' },
  { value: 'pas-encore', label: 'Pas encore' },
  { value: 'conseil', label: 'Je souhaite être conseillé' },
] as const satisfies readonly SelectOption[];

export const preferredContactOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'appel', label: 'Appel' },
  { value: 'email', label: 'E-mail' },
] as const satisfies readonly SelectOption[];

export const consent = {
  before: 'J’accepte que Qualifyr utilise ces informations uniquement afin de répondre à ma demande. ',
  linkLabel: 'Politique de confidentialité',
  after: '',
} as const;

export const formLabels = {
  contactSubmit: 'Envoyer le message',
  sending: 'Envoi en cours',
  errorSummaryTitle: 'Le formulaire n’a pas pu être envoyé',
  errorSummaryIntro: 'Vérifiez les points suivants :',
} as const;

export const successMessages = {
  contact: {
    title: 'Message reçu.',
    body: 'Nous avons bien reçu votre message et nous vous répondons à l’adresse indiquée.',
  },
} as const;

/** Libellé lisible d'une valeur technique, pour l'e-mail reçu par Qualifyr. */
export function labelFor(options: readonly SelectOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
