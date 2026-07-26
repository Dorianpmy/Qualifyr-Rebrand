import { emailEnv, isProduction, missingEmailVars } from '@/lib/env';

/**
 * Abstraction de transport d'e-mail.
 *
 * Le reste de l'application ne connaît que `EmailTransport`. Changer de
 * fournisseur revient à écrire une implémentation de cette interface : aucune
 * route ni aucun composant n'a à être modifié.
 *
 * **Aucune clé n'est écrite dans le code.** Tout vient des variables
 * d'environnement (voir `.env.example`). L'absence de configuration n'est pas
 * une erreur de programmation : c'est un état prévu, traité explicitement.
 */

export type EmailMessage = {
  readonly to: string;
  readonly from: string;
  readonly subject: string;
  readonly text: string;
  readonly replyTo?: string;
};

export type SendResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

export interface EmailTransport {
  /** Identifiant lisible, journalisé sans donnée personnelle. */
  readonly name: string;
  send(message: EmailMessage): Promise<SendResult>;
}

/* ------------------------------------------------------------------ */
/* Resend — appelé directement en HTTP                                 */
/* ------------------------------------------------------------------ */

/**
 * Implémentation Resend.
 *
 * L'API tient en un appel `POST /emails` : le SDK officiel n'apporterait rien
 * ici et ajouterait une dépendance de production. On utilise `fetch`, présent
 * nativement dans le runtime Node de Next.
 */
export function resendTransport(apiKey: string): EmailTransport {
  return {
    name: 'resend',
    async send(message) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: message.from,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            ...(message.replyTo ? { reply_to: message.replyTo } : {}),
          }),
          signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
          // Le corps de la réponse peut contenir l'adresse : on ne le journalise pas.
          return { ok: false, reason: `resend_http_${response.status}` };
        }

        return { ok: true };
      } catch {
        return { ok: false, reason: 'resend_unreachable' };
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Console — développement uniquement                                  */
/* ------------------------------------------------------------------ */

/**
 * Transport de développement : écrit le message dans la console du serveur.
 *
 * Jamais activé en production — `resolveTransport` s'en assure. Il permet de
 * dérouler le parcours complet sans clé API, tout en gardant un message
 * technique explicite dans le terminal.
 */
export function consoleTransport(): EmailTransport {
  return {
    name: 'console',
    async send(message) {
      console.warn(
        [
          '',
          '─────────────────────────────────────────────',
          ' E-MAIL NON ENVOYÉ — transport de développement',
          ` Variables manquantes : ${missingEmailVars().join(', ') || 'aucune'}`,
          '─────────────────────────────────────────────',
          ` À      : ${message.to}`,
          ` De     : ${message.from}`,
          ` Objet  : ${message.subject}`,
          message.replyTo ? ` Répondre à : ${message.replyTo}` : '',
          '─────────────────────────────────────────────',
          message.text,
          '─────────────────────────────────────────────',
          '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
      return { ok: true };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Résolution                                                          */
/* ------------------------------------------------------------------ */

export type TransportResolution =
  | {
      readonly status: 'ready';
      readonly transport: EmailTransport;
      readonly to: string;
      readonly from: string;
      /** L'accusé de réception n'est envoyé que par un vrai fournisseur. */
      readonly canSendConfirmation: boolean;
    }
  | {
      readonly status: 'unconfigured';
      readonly missing: readonly string[];
    };

/**
 * Choisit le transport disponible.
 *
 * — Configuration complète → Resend, accusé de réception activé.
 * — Configuration incomplète **en développement** → console, sans accusé de
 *   réception : rien n'est réellement envoyé, autant ne pas le prétendre.
 * — Configuration incomplète **en production** → `unconfigured`. La route
 *   répond honnêtement qu'elle ne peut pas envoyer. Jamais de faux succès.
 */
export function resolveTransport(): TransportResolution {
  const env = emailEnv();

  if (env) {
    return {
      status: 'ready',
      transport: resendTransport(env.apiKey),
      to: env.to,
      from: env.from,
      canSendConfirmation: true,
    };
  }

  if (!isProduction()) {
    return {
      status: 'ready',
      transport: consoleTransport(),
      to: 'console@local',
      from: 'Qualifyr (développement) <dev@local>',
      canSendConfirmation: false,
    };
  }

  return { status: 'unconfigured', missing: missingEmailVars() };
}
