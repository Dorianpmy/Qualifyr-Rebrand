import { z } from 'zod';
import { bookingMethodOptions, priorityOptions, seniorityOptions } from '@/content/forms';

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

const email = z
  .string({ error: 'Indiquez votre adresse e-mail.' })
  .transform((value) => clean(value, 254).toLowerCase())
  .pipe(z.email('Cette adresse e-mail ne semble pas valide.').max(254));

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
};

export const diagnosticSchema = z.object({
  fullName: text(2, 120, 'Indiquez votre prénom et votre nom.'),
  company: text(2, 120, 'Indiquez le nom de votre entreprise.'),
  email,
  phone: optionalPhone.optional().default(''),
  area: text(2, 160, 'Indiquez votre ville ou votre zone d’intervention.'),
  website: optionalUrl.optional().default(''),
  seniority: enumFrom(seniorityOptions, 'Choisissez une ancienneté.'),
  bookingMethods: z
    .array(enumFrom(bookingMethodOptions, 'Méthode inconnue.'))
    .max(bookingMethodOptions.length)
    .min(1, 'Indiquez au moins une manière de recevoir vos réservations.'),
  priority: enumFrom(priorityOptions, 'Choisissez un objectif prioritaire.'),
  blocker: text(10, 1000, 'Décrivez en quelques mots ce qui vous freine aujourd’hui.'),
  message: optionalText(2000).optional().default(''),
  consent,
  ...antiSpam,
});

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
