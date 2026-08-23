import { handleSubmission } from '@/lib/email/submission';
import { estimationNotification } from '@/lib/email/templates';
import { estimationSchema } from '@/lib/validation';

/**
 * Réception d'une demande d'estimation.
 *
 * **Cette route est nouvelle (22/08/2026), et c'est un changement de nature
 * pour la page.** Jusqu'ici, `/estimation` calculait un montant sur l'appareil
 * du visiteur et n'envoyait rien : aucune demande n'arrivait, rien n'était
 * enregistré. Un prospect qui remplissait le configurateur pouvait croire
 * avoir pris contact.
 *
 * Elle réutilise `handleSubmission`, comme `/api/contact`, plutôt que de
 * refaire sa propre validation. Le traitement est donc identique et déjà
 * éprouvé : limite de débit par adresse IP, validation par schéma, champ piège
 * et délai minimum de remplissage contre les robots, envoi par le transport
 * configuré, accusé de réception au visiteur.
 *
 * **Rien n'est stocké en base.** Le projet n'a pas de table de soumissions, et
 * en créer une pour cette seule page ajouterait une donnée personnelle de plus
 * à conserver, à purger et à déclarer. L'e-mail suffit à traiter la demande.
 */
export async function POST(request: Request) {
  const outcome = await handleSubmission(request, {
    kind: 'estimation',
    schema: estimationSchema,
    notification: estimationNotification,
    identity: (data) => ({
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
    }),
    antiSpam: (data) => ({ fax: data.fax, elapsedMs: data.elapsedMs }),
  });

  return Response.json(outcome.body, { status: outcome.status });
}
