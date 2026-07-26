/**
 * Lecture des variables d'environnement.
 *
 * Aucune valeur n'est lue au moment de l'import et aucune exception n'est levée
 * au chargement : une variable manquante ne doit jamais empêcher le site de se
 * construire ni de s'afficher. Les formulaires se dégradent proprement.
 *
 * **Aucun secret n'est écrit dans le dépôt.** Voir `.env.example`.
 */

function read(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type EmailEnv = {
  readonly apiKey: string;
  readonly to: string;
  readonly from: string;
};

/**
 * Configuration d'envoi d'e-mail, ou `null` si elle est incomplète.
 * Les trois variables sont nécessaires ensemble : une seule manquante rend
 * l'envoi impossible, et il vaut mieux le dire que d'échouer silencieusement.
 */
export function emailEnv(): EmailEnv | null {
  const apiKey = read('RESEND_API_KEY');
  const to = read('CONTACT_TO_EMAIL');
  const from = read('CONTACT_FROM_EMAIL');
  if (!apiKey || !to || !from) return null;
  return { apiKey, to, from };
}

/** Détail des variables manquantes — pour le message technique en développement. */
export function missingEmailVars(): readonly string[] {
  return (['RESEND_API_KEY', 'CONTACT_TO_EMAIL', 'CONTACT_FROM_EMAIL'] as const).filter(
    (name) => read(name) === null,
  );
}

/** URL publique du site. Repli sur le domaine de production. */
export function siteUrl(): string {
  return read('NEXT_PUBLIC_SITE_URL') ?? 'https://qualifyragence.com';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
