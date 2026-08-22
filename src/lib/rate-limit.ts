/**
 * Limitation de débit en mémoire, par clé (généralement une IP, parfois
 * IP+email pour restreindre plus fort une action précise comme la connexion).
 *
 * Extrait de `lib/email/submission.ts` (18/08/2026) — au départ propre aux
 * formulaires de contact/devis, le même besoin est apparu pour la connexion
 * par mot de passe (`/api/app/login-password`, protection contre le brute
 * force) et la capture de zone à prospecter (`/api/agent/scan`, protection du
 * quota INSEE à 30 requêtes/minute). Un seul garde-fou, réutilisé partout où
 * une route publique accepte un POST non authentifié.
 *
 * **Limite connue, assumée.** La mémoire n'est pas partagée entre instances
 * serverless et se vide à chaque démarrage à froid — ce n'est pas une
 * protection anti-abus de niveau production (un attaquant distribué ou qui
 * traverse plusieurs instances la contourne). C'est un garde-fou contre les
 * abus non sophistiqués (script naïf, brute force basique), pas une défense
 * contre un attaquant déterminé. Une vraie limitation de débit demanderait un
 * magasin partagé (Upstash Redis, Vercel KV) — volontairement pas ajouté ici
 * pour ne pas introduire une dépendance et un compte externe sans que Dorian
 * l'ait demandé.
 */

const buckets = new Map<string, number[]>();

export type RateLimitOptions = {
  /** Fenêtre glissante, en millisecondes. */
  readonly windowMs?: number;
  /** Nombre de passages autorisés dans la fenêtre. */
  readonly max?: number;
};

const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_MAX = 5;

export function rateLimit(key: string, options?: RateLimitOptions): boolean {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options?.max ?? DEFAULT_MAX;
  const now = Date.now();
  const previous = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);

  if (previous.length >= max) {
    buckets.set(key, previous);
    return false;
  }

  previous.push(now);
  buckets.set(key, previous);

  // Purge opportuniste : la table ne doit pas croître indéfiniment.
  if (buckets.size > 1000) {
    for (const [bucketKey, times] of buckets) {
      if (times.every((time) => now - time >= windowMs)) buckets.delete(bucketKey);
    }
  }

  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || 'inconnue';
}
