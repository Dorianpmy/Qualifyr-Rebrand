/**
 * Définition des formulaires : options, libellés, textes d'état.
 *
 * Les valeurs techniques (`value`) sont stables et servent aussi côté serveur.
 * Ne pas les renommer sans mettre à jour `src/lib/validation.ts`.
 */

export type SelectOption = {
  readonly value: string;
  readonly label: string;
};

export const seniorityOptions = [
  { value: 'lancement', label: 'Je lance mon activité' },
  { value: 'moins-1-an', label: 'Moins d’un an' },
  { value: '1-3-ans', label: 'Entre 1 et 3 ans' },
  { value: '3-5-ans', label: 'Entre 3 et 5 ans' },
  { value: 'plus-5-ans', label: 'Plus de 5 ans' },
] as const satisfies readonly SelectOption[];

export const bookingMethodOptions = [
  { value: 'telephone', label: 'Téléphone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'formulaire', label: 'Formulaire' },
  { value: 'calendrier', label: 'Calendrier en ligne' },
  { value: 'reseaux-sociaux', label: 'Réseaux sociaux' },
  { value: 'autre', label: 'Autrement' },
] as const satisfies readonly SelectOption[];

export const priorityOptions = [
  { value: 'plus-de-demandes', label: 'Obtenir plus de demandes' },
  { value: 'simplifier-reservations', label: 'Simplifier les réservations' },
  { value: 'presenter-formules', label: 'Mieux présenter les formules' },
  { value: 'plus-avis', label: 'Obtenir plus d’avis' },
  { value: 'fideliser', label: 'Fidéliser mes clients' },
  { value: 'lancer-activite', label: 'Lancer mon activité' },
] as const satisfies readonly SelectOption[];

/**
 * Consentement, découpé pour insérer un vrai lien vers la politique de
 * confidentialité. La case n'est jamais pré-cochée.
 */
export const consent = {
  before: 'J’accepte que ces informations soient utilisées pour préparer notre échange, conformément à la ',
  linkLabel: 'politique de confidentialité',
  after: '. Elles ne sont ni revendues, ni utilisées à d’autres fins, et ne sont pas conservées dans une base de données.',
} as const;

export const formLabels = {
  diagnosticSubmit: 'Envoyer ma demande',
  contactSubmit: 'Envoyer le message',
  sending: 'Envoi en cours',
  errorSummaryTitle: 'Le formulaire n’a pas pu être envoyé',
  errorSummaryIntro: 'Vérifiez les points suivants :',
} as const;

export const successMessages = {
  diagnostic: {
    title: 'Demande reçue.',
    body: 'Nous avons bien reçu vos réponses. Nous les lisons, puis nous vous écrivons à l’adresse indiquée.',
  },
  contact: {
    title: 'Message reçu.',
    body: 'Nous avons bien reçu votre message et nous vous répondons à l’adresse indiquée.',
  },
} as const;

/** Libellé lisible d'une valeur technique, pour l'e-mail reçu par Qualifyr. */
export function labelFor(options: readonly SelectOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
