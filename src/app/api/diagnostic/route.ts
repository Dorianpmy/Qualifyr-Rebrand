import { handleSubmission } from '@/lib/email/submission';
import { diagnosticNotification } from '@/lib/email/templates';
import { diagnosticSchema } from '@/lib/validation';

/**
 * Réception d'une demande de diagnostic.
 *
 * La validation faite ici est celle qui fait foi : celle du navigateur peut
 * être contournée. Aucune donnée n'est stockée — la demande transite par
 * e-mail et rien d'autre (voir la politique de confidentialité).
 */
export async function POST(request: Request) {
  const outcome = await handleSubmission(request, {
    kind: 'diagnostic',
    schema: diagnosticSchema,
    notification: diagnosticNotification,
    identity: (data) => ({
      fullName: [data.firstName, data.lastName].filter(Boolean).join(' '),
      email: data.email,
    }),
    antiSpam: (data) => ({ fax: data.fax, elapsedMs: data.elapsedMs }),
  });

  return Response.json(outcome.body, { status: outcome.status });
}
