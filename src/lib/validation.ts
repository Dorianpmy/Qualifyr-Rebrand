import { z } from 'zod';

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

const consent = z.literal(true, {
  error: 'Votre accord est nécessaire pour que nous puissions vous répondre.',
});

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

export const contactSchema = z.object({
  fullName: text(2, 120, 'Indiquez votre prénom et votre nom.'),
  email,
  company: optionalText(120).optional().default(''),
  message: text(10, 2000, 'Écrivez votre message (10 caractères minimum).'),
  consent,
  ...antiSpam,
});

export type ContactData = z.output<typeof contactSchema>;

/**
 * Demande d'estimation.
 *
 * **Les réponses sont transmises telles quelles, en texte.** Le serveur ne
 * recalcule pas la recommandation : elle est déjà affichée au prospect, et un
 * second calcul côté serveur pourrait diverger du premier — Dorian recevrait
 * alors une offre différente de celle que le visiteur a vue à l'écran. C'est
 * le résultat montré qui fait foi pour la conversation qui suit.
 *
 * `phone` est facultatif : l'imposer coûterait des demandes sans rien
 * garantir, un numéro saisi de force étant souvent faux.
 *
 * Les longueurs maximales sont hautes mais présentes : elles protègent contre
 * un envoi massif, sans rejeter un nom d'entreprise à rallonge.
 */
export const estimationSchema = z.object({
  firstName: text(1, 80, 'Indiquez votre prénom.'),
  lastName: text(1, 120, 'Indiquez votre nom ou celui de votre entreprise.'),
  email,
  phone: optionalText(30).optional().default(''),
  businessName: optionalText(120).optional().default(''),
  area: text(2, 120, 'Indiquez votre ville ou votre zone d’intervention.'),
  /** Offre recommandée, telle qu'affichée au prospect. */
  recommendation: text(2, 80, 'Recommandation manquante.'),
  /** Réponses mises en forme lisible, une par ligne. */
  answers: text(2, 4000, 'Réponses manquantes.'),
  consent,
  ...antiSpam,
});

export type EstimationData = z.output<typeof estimationSchema>;

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
