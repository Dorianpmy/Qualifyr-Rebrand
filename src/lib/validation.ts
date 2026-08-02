import { z } from 'zod';
import {
  activityOptions,
  budgetStatusOptions,
  conciergeTypeOptions,
  demandSourceOptions,
  practiceModeOptions,
  preferredContactOptions,
  priorityOptions,
  siteSituationOptions,
  timingOptions,
} from '@/content/forms';

/**
 * Schémas de validation partagés entre le client et le serveur.
 *
 * Le même fichier sert des deux côtés : les deux validations ne peuvent pas
 * diverger. La validation client rend l'erreur immédiate ; la validation
 * serveur est celle qui fait foi, car elle seule ne peut pas être contournée.
 *
 * Toutes les chaînes sont nettoyées avant validation et toutes ont une taille
 * maximale : un champ sans borne est une porte ouverte.
 */

/** Retire les caractères de contrôle, normalise les espaces, coupe aux bornes. */
export function clean(value: unknown, max = 2000): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

const text = (min: number, max: number, tooShort: string) =>
  z
    .string({ error: tooShort })
    .transform((value) => clean(value, max))
    .pipe(z.string().min(min, tooShort).max(max, `Ce champ dépasse ${max} caractères.`));

const optionalText = (max: number) =>
  z
    .string()
    .transform((value) => clean(value, max))
    .pipe(z.string().max(max, `Ce champ dépasse ${max} caractères.`));

const optionalAttributionValue = (max: number) =>
  z
    .string()
    .transform((value) => clean(value, max))
    .pipe(z.string().max(max))
    .optional();

export const attributionTouchSchema = z.object({
  source: optionalAttributionValue(80),
  medium: optionalAttributionValue(80),
  campaign: optionalAttributionValue(120),
  content: optionalAttributionValue(120),
  term: optionalAttributionValue(120),
  referrerDomain: optionalAttributionValue(120),
  landingPath: optionalAttributionValue(500),
  firstSeenAt: optionalAttributionValue(40),
}).strict();

export const attributionSchema = z.object({
  firstTouch: attributionTouchSchema.optional(),
  lastTouch: attributionTouchSchema.optional(),
}).strict();

const email = z
  .string({ error: 'Indiquez votre adresse e-mail.' })
  .transform((value) => clean(value, 254).toLowerCase())
  .pipe(z.email('Cette adresse e-mail ne semble pas valide.').max(254));

function normalizedWebUrl(value: string): string {
  if (value === '') return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

const optionalUrl = z
  .string()
  .transform((value) => clean(value, 300))
  .pipe(
    z
      .string()
      .max(300)
      .refine(
        (value) => value === '' || /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(value),
        'Indiquez une adresse complète, par exemple https://exemple.fr',
      ),
  );

export const optionalWebsiteUrl = z
  .string()
  .transform((value) => normalizedWebUrl(clean(value, 300)))
  .pipe(
    z
      .string()
      .max(300)
      .refine((value) => {
        if (value === '') return true;
        try {
          const url = new URL(value);
          return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
        } catch {
          return false;
        }
      }, 'Indiquez une adresse valide, par exemple exemple.fr'),
  );

const optionalPhone = z
  .string()
  .transform((value) => clean(value, 30))
  .pipe(
    z
      .string()
      .max(30)
      .refine(
        (value) => value === '' || /^[+()\d\s.-]{6,30}$/.test(value),
        'Ce numéro ne semble pas valide.',
      ),
  );

const consent = z.literal(true, {
  error: 'Votre accord est nécessaire pour que nous puissions vous répondre.',
});

const enumFrom = (options: readonly { readonly value: string }[], message: string) =>
  z
    .string({ error: message })
    .refine((value) => options.some((option) => option.value === value), message);

/**
 * Temps minimal entre l'affichage du formulaire et son envoi.
 *
 * Avec le champ piège, cela filtre les envois automatisés les plus courants.
 * **Ce n'est pas une protection absolue** : un robot patient qui ignore le
 * champ piège et attend quelques secondes passera. C'est un filtre bon marché,
 * choisi pour ne pas imposer de CAPTCHA au visiteur.
 */
export const MIN_ELAPSED_MS = 2500;

/**
 * Champs anti-spam communs aux deux formulaires.
 *
 * `fax` est le champ piège : hors du flux de tabulation, masqué aux
 * technologies d'assistance, jamais rempli par un humain. Il doit rester vide.
 */
const antiSpam = {
  fax: z.string().max(100).optional().default(''),
  elapsedMs: z
    .number({ error: 'Le formulaire doit être affiché avant son envoi.' })
    .int()
    .nonnegative()
    .max(1000 * 60 * 60 * 24),
  pageUrl: optionalUrl.optional().default(''),
  attribution: attributionSchema.optional(),
};

const diagnosticFields = {
  activity: enumFrom(activityOptions, 'Choisissez votre activité.'),
  activityDetails: optionalText(300).optional().default(''),
  practiceMode: optionalText(40).optional().default(''),
  conciergeType: optionalText(60).optional().default(''),
  company: text(2, 120, 'Indiquez le nom de votre entreprise.'),
  website: optionalWebsiteUrl.optional().default(''),
  siteSituation: enumFrom(siteSituationOptions, 'Choisissez votre situation actuelle.'),
  demandSources: z
    .array(enumFrom(demandSourceOptions, 'Origine de demande inconnue.'))
    .min(1, 'Choisissez au moins une origine de demandes.')
    .max(3, 'Choisissez trois réponses maximum.'),
  situationNote: optionalText(400).optional().default(''),
  priorities: z
    .array(enumFrom(priorityOptions, 'Priorité inconnue.'))
    .min(1, 'Choisissez au moins une priorité.')
    .max(2, 'Choisissez deux priorités maximum.'),
  desiredResult: optionalText(400).optional().default(''),
  timing: enumFrom(timingOptions, 'Choisissez un horizon de démarrage.'),
  budgetStatus: enumFrom(budgetStatusOptions, 'Indiquez où en est votre réflexion sur le budget.'),
  budgetAmount: optionalText(120).optional().default(''),
  constraints: optionalText(700).optional().default(''),
  firstName: text(2, 80, 'Indiquez votre prénom.'),
  lastName: optionalText(80).optional().default(''),
  email,
  phone: optionalPhone.optional().default(''),
  preferredContact: enumFrom(preferredContactOptions, 'Choisissez votre moyen de contact préféré.'),
  consent,
} as const;

function requireOtherActivity(
  data: {
    activity: string;
    activityDetails?: string;
    practiceMode?: string;
    conciergeType?: string;
  },
  context: z.RefinementCtx,
) {
  if (data.activity === 'autre-service' && clean(data.activityDetails, 300).length < 3) {
    context.addIssue({
      code: 'custom',
      path: ['activityDetails'],
      message: 'Précisez votre activité en quelques mots.',
    });
  }

  if (
    data.activity === 'nettoyage-detailing' &&
    clean(data.practiceMode, 40).length > 0 &&
    !practiceModeOptions.some((option) => option.value === data.practiceMode)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['practiceMode'],
      message: 'Indiquez comment vous réalisez principalement vos prestations.',
    });
  }

  if (
    data.activity === 'conciergerie' &&
    clean(data.conciergeType, 60).length > 0 &&
    !conciergeTypeOptions.some((option) => option.value === data.conciergeType)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['conciergeType'],
      message: 'Choisissez le type de conciergerie le plus proche de votre activité.',
    });
  }
}

export const diagnosticStepSchemas = [
  z
    .object({
      activity: diagnosticFields.activity,
      activityDetails: diagnosticFields.activityDetails,
      practiceMode: diagnosticFields.practiceMode,
      conciergeType: diagnosticFields.conciergeType,
      company: diagnosticFields.company,
      website: diagnosticFields.website,
    })
    .superRefine(requireOtherActivity),
  z.object({
    siteSituation: diagnosticFields.siteSituation,
    demandSources: diagnosticFields.demandSources,
    situationNote: diagnosticFields.situationNote,
  }),
  z.object({
    priorities: diagnosticFields.priorities,
    desiredResult: diagnosticFields.desiredResult,
  }),
  z.object({
    timing: diagnosticFields.timing,
    budgetStatus: diagnosticFields.budgetStatus,
    budgetAmount: diagnosticFields.budgetAmount,
    constraints: diagnosticFields.constraints,
  }),
  z.object({
    firstName: diagnosticFields.firstName,
    lastName: diagnosticFields.lastName,
    email: diagnosticFields.email,
    phone: diagnosticFields.phone,
    preferredContact: diagnosticFields.preferredContact,
    consent: diagnosticFields.consent,
  }),
] as const;

export const diagnosticSchema = z
  .object({ ...diagnosticFields, ...antiSpam })
  .superRefine(requireOtherActivity);

export const contactSchema = z.object({
  fullName: text(2, 120, 'Indiquez votre prénom et votre nom.'),
  email,
  company: optionalText(120).optional().default(''),
  message: text(10, 2000, 'Écrivez votre message (10 caractères minimum).'),
  consent,
  ...antiSpam,
});

export type DiagnosticData = z.output<typeof diagnosticSchema>;
export type ContactData = z.output<typeof contactSchema>;

/** Erreurs par champ, forme consommée telle quelle par les formulaires. */
export type FieldErrors = Record<string, string>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in result)) {
      result[key] = issue.message;
    }
  }
  return result;
}
