import { handleSubmission } from '@/lib/email/submission';
import { contactNotification } from '@/lib/email/templates';
import { contactSchema } from '@/lib/validation';

/**
 * Réception d'un message de contact.
 * Même traitement que le diagnostic, formulaire plus court.
 */
export async function POST(request: Request) {
  const outcome = await handleSubmission(request, {
    kind: 'contact',
    schema: contactSchema,
    notification: contactNotification,
    identity: (data) => ({ fullName: data.fullName, email: data.email }),
    antiSpam: (data) => ({ fax: data.fax, elapsedMs: data.elapsedMs }),
  });

  return Response.json(outcome.body, { status: outcome.status });
}
