import type { z } from 'zod';
import { availableChannels } from '@/content/contact';
import { isProduction, siteUrl } from '@/lib/env';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { fieldErrors, MIN_ELAPSED_MS, type FieldErrors } from '@/lib/validation';
import { acknowledgement } from './templates';
import { resolveTransport } from './transport';

/**
 * Traitement commun aux deux formulaires.
 *
 * Ordre volontaire : limitation de débit → validation → anti-spam → envoi.
 * Le travail le moins coûteux est fait en premier.
 */

export type SubmissionOutcome = {
  readonly status: number;
  readonly body: Record<string, unknown>;
};

// `rateLimit`/`clientIp` déménagés dans `@/lib/rate-limit` (22/08/2026) : le
// même garde-fou sert maintenant aussi `/api/app/login-password` et
// `/api/agent/scan`, pas seulement les formulaires e-mail. Réexportés ici
// pour ne pas casser d'éventuels autres imports de ce module.
export { clientIp, rateLimit };

/* ------------------------------------------------------------------ */
/* Journalisation                                                      */
/* ------------------------------------------------------------------ */

/**
 * Journal minimal.
 *
 * **Aucune donnée personnelle n'est écrite** : ni nom, ni e-mail, ni message,
 * ni adresse IP. Seuls le type de formulaire, l'issue et la cause technique
 * sont conservés — de quoi diagnostiquer une panne, rien de plus.
 */
function log(form: string, outcome: string, detail?: string) {
  console.warn(`[form:${form}] ${outcome}${detail ? ` (${detail})` : ''}`);
}

/* ------------------------------------------------------------------ */
/* Traitement                                                          */
/* ------------------------------------------------------------------ */

type Handled<T> = {
  /* `'estimation'` ajouté le 22/08/2026. Le type reste fermé plutôt que
     d'accepter `string` : il sert à préfixer les journaux, et une valeur
     libre y ferait entrer des chaînes non maîtrisées. */
  readonly kind: 'contact' | 'estimation';
  readonly schema: z.ZodType<T, unknown>;
  readonly notification: (data: T, receivedAt: Date) => { subject: string; text: string };
  readonly identity: (data: T) => { fullName: string; email: string };
  readonly antiSpam: (data: T) => { fax: string; elapsedMs: number };
};

export async function handleSubmission<T>(
  request: Request,
  handler: Handled<T>,
): Promise<SubmissionOutcome> {
  const { kind } = handler;

  if (!rateLimit(clientIp(request))) {
    log(kind, 'refusée', 'limite de débit');
    return {
      status: 429,
      body: {
        ok: false,
        message:
          'Trop de tentatives en peu de temps. Réessayez dans quelques minutes.',
      },
    };
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    log(kind, 'refusée', 'corps illisible');
    return { status: 400, body: { ok: false, message: 'Requête invalide.' } };
  }

  const parsed = handler.schema.safeParse(payload);
  if (!parsed.success) {
    log(kind, 'refusée', 'validation');
    const errors: FieldErrors = fieldErrors(parsed.error);
    return {
      status: 422,
      body: {
        ok: false,
        errors,
        message: 'Certaines réponses doivent être corrigées.',
      },
    };
  }

  const data = parsed.data;
  const { fax, elapsedMs } = handler.antiSpam(data);

  // Champ piège rempli : on répond comme si tout allait bien, sans rien envoyer.
  // Signaler l'échec renseignerait le robot sur le mécanisme.
  if (fax.trim().length > 0) {
    log(kind, 'ignorée', 'champ piège');
    return { status: 200, body: { ok: true } };
  }

  if (elapsedMs < MIN_ELAPSED_MS) {
    log(kind, 'refusée', 'envoi trop rapide');
    return {
      status: 422,
      body: {
        ok: false,
        message: 'Envoi trop rapide pour être traité. Réessayez.',
      },
    };
  }

  const resolution = resolveTransport();

  if (resolution.status === 'unconfigured') {
    log(kind, 'échec', `configuration incomplète : ${resolution.missing.join(', ')}`);
    return {
      status: 503,
      body: {
        ok: false,
        message:
          'L’envoi est momentanément indisponible. Votre message n’a pas été transmis. Réessayez plus tard.',
        // Détail technique en développement uniquement.
        ...(isProduction() ? {} : { missing: resolution.missing }),
      },
    };
  }

  const receivedAt = new Date();
  const identity = handler.identity(data);
  const notification = handler.notification(data, receivedAt);

  const sent = await resolution.transport.send({
    to: resolution.to,
    from: resolution.from,
    subject: notification.subject,
    text: notification.text,
    replyTo: identity.email,
  });

  if (!sent.ok) {
    log(kind, 'échec', `${resolution.transport.name} : ${sent.reason}`);
    return {
      status: 502,
      body: {
        ok: false,
        message:
          'Votre message n’a pas pu être transmis. Réessayez dans un instant.',
      },
    };
  }

  // Accusé de réception : uniquement si un vrai fournisseur est configuré.
  // Un échec ici ne remet pas en cause la demande, qui est bien arrivée.
  if (resolution.canSendConfirmation) {
    const channels = availableChannels();
    const replyTo = channels[0]?.value ?? null;
    const ack = acknowledgement(identity, { replyTo, siteUrl: siteUrl() });

    const confirmation = await resolution.transport.send({
      to: identity.email,
      from: resolution.from,
      subject: ack.subject,
      text: ack.text,
    });

    if (!confirmation.ok) {
      log(kind, 'accusé non envoyé', confirmation.reason);
    }
  }

  log(kind, 'transmise');
  return { status: 200, body: { ok: true } };
}
