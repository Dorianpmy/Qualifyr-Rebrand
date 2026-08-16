import 'server-only';

/**
 * Messages WhatsApp — véhicule prêt, puis demande d'avis.
 *
 * **Pourquoi WhatsApp plutôt que le SMS.** Le message est lu, et l'aller-retour
 * reste possible : le client répond « j'arrive dans 20 min » sans composer un
 * numéro. Le coût par conversation est aussi plus bas qu'un SMS unitaire.
 *
 * **Ce que ça impose.** L'API Cloud de Meta n'autorise pas d'écrire librement
 * à quelqu'un qui ne vous a pas parlé dans les 24 heures. Tout message sortant
 * passe par un **modèle approuvé à l'avance** — texte figé, seules les
 * variables changent. Les deux modèles utilisés ici doivent donc être soumis
 * dans le gestionnaire WhatsApp Business et validés avant le premier envoi.
 * C'est le délai à prévoir, pas le code.
 *
 * **Aucun envoi n'est bloquant.** Un message qui échoue ne doit jamais
 * empêcher un professionnel de marquer une voiture terminée : la prestation a
 * eu lieu, l'échec est celui de la notification.
 */

const API_VERSION = 'v21.0';

type SendResult =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly reason: string };

/**
 * Normalise un numéro au format attendu par Meta : chiffres uniquement,
 * indicatif pays compris, sans `+` ni séparateurs.
 *
 * Les numéros saisis par les clients arrivent sous toutes les formes —
 * « 06 12 34 56 78 », « +33 6 12 … », « 0033… ». Un envoi vers un numéro mal
 * formé échoue silencieusement côté Meta.
 */
export function normalizePhone(raw: string, country: 'FR' | 'CH'): string | null {
  const digits = raw.replace(/[^\d+]/g, '');

  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('00')) return digits.slice(2);

  const prefix = country === 'CH' ? '41' : '33';
  // Un numéro national commence par 0 : on le remplace par l'indicatif.
  if (digits.startsWith('0')) return `${prefix}${digits.slice(1)}`;

  return digits.length >= 9 ? `${prefix}${digits}` : null;
}

async function sendTemplate(input: {
  readonly to: string;
  readonly template: string;
  readonly variables: readonly string[];
}): Promise<SendResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    return { ok: false, reason: 'non_configuré' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: input.to,
          type: 'template',
          template: {
            name: input.template,
            language: { code: 'fr' },
            components: [
              {
                type: 'body',
                parameters: input.variables.map((text) => ({ type: 'text', text })),
              },
            ],
          },
        }),
      },
    );

    const payload = (await response.json()) as {
      messages?: readonly { id: string }[];
      error?: { message?: string };
    };

    if (!response.ok) {
      return { ok: false, reason: payload.error?.message ?? `HTTP ${response.status}` };
    }

    return { ok: true, id: payload.messages?.[0]?.id ?? '' };
  } catch (cause) {
    return { ok: false, reason: cause instanceof Error ? cause.message : 'inconnue' };
  }
}

/**
 * « Votre véhicule est prêt. »
 *
 * Modèle à déclarer sous le nom `vehicule_pret` :
 *
 *   Bonjour {{1}}, votre véhicule est prêt chez {{2}}.
 *   Montant restant à régler sur place : {{3}}.
 *
 * Le solde est rappelé dans le message parce que c'est la question suivante du
 * client, et qu'y répondre à l'avance évite un appel.
 */
export async function notifyVehicleReady(input: {
  readonly phone: string;
  readonly country: 'FR' | 'CH';
  readonly clientName: string;
  readonly detailerName: string;
  readonly remainingLabel: string;
}): Promise<SendResult> {
  const to = normalizePhone(input.phone, input.country);
  if (!to) return { ok: false, reason: 'numéro_invalide' };

  return sendTemplate({
    to,
    template: 'vehicule_pret',
    variables: [input.clientName, input.detailerName, input.remainingLabel],
  });
}

/**
 * Demande d'avis Google, envoyée plus tard.
 *
 * Modèle à déclarer sous le nom `demande_avis` :
 *
 *   {{1}}, si le résultat vous a plu, un avis aide beaucoup {{2}} : {{3}}
 *
 * **Le conditionnel est délibéré.** « Si le résultat vous a plu » laisse une
 * sortie à un client déçu, qui répondra au professionnel plutôt que de publier
 * une étoile. Une demande inconditionnelle transforme chaque mécontentement
 * silencieux en avis public.
 */
export async function requestGoogleReview(input: {
  readonly phone: string;
  readonly country: 'FR' | 'CH';
  readonly clientName: string;
  readonly detailerName: string;
  readonly reviewUrl: string;
}): Promise<SendResult> {
  const to = normalizePhone(input.phone, input.country);
  if (!to) return { ok: false, reason: 'numéro_invalide' };

  return sendTemplate({
    to,
    template: 'demande_avis',
    variables: [input.clientName, input.detailerName, input.reviewUrl],
  });
}

/**
 * URL du formulaire d'avis Google.
 *
 * Google n'expose aucune API permettant de déposer un avis — c'est
 * volontaire de leur part, et toute solution qui prétend le contraire viole
 * leurs conditions. On envoie donc le client vers le formulaire officiel,
 * pré-ouvert sur la fiche du professionnel.
 */
export function googleReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}
