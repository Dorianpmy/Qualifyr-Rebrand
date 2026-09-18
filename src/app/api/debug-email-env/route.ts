import { Resend } from 'resend';
import { NextResponse } from 'next/server';

/**
 * Diagnostic temporaire (18/09/2026) — à supprimer une fois le problème
 * d'envoi d'e-mail de réservation résolu.
 *
 * Ne révèle jamais une valeur, seulement une présence (booléen) : l'objectif
 * est de vérifier si `RESEND_API_KEY` / `BOOKING_FROM_EMAIL` sont
 * effectivement visibles par la fonction au moment de l'exécution, après
 * plusieurs réservations réelles n'ayant jamais généré la moindre requête
 * côté Resend malgré des réglages Netlify a priori corrects.
 *
 * **Pas de `_` dans le nom du dossier.** Une première version vivait dans
 * `api/_debug/email-env` — App Router traite tout segment préfixé `_` comme
 * un dossier privé, exclu du routage : la route répondait 404 sur toute la
 * ligne, jamais atteinte.
 */
export async function GET() {
  const present = (name: string) => {
    const value = process.env[name];
    return typeof value === 'string' && value.trim().length > 0;
  };

  /*
   * Étape 2 du diagnostic : les quatre variables sont bien lisibles (étape 1,
   * confirmée), donc `sendClientBookingEmail` devrait atteindre
   * `resend.emails.send(...)` — pourtant aucune requête n'apparaît côté
   * Resend, même après une réservation réelle. On tente ici un envoi réel,
   * en capturant l'erreur exacte (message, `name`, statut HTTP le cas
   * échéant) au lieu de la seule journaliser côté serveur où personne ne
   * peut la lire.
   */
  let sendAttempt: unknown = null;
  try {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.BOOKING_FROM_EMAIL;
    if (key && from) {
      const resend = new Resend(key);
      const { data, error } = await resend.emails.send({
        from,
        to: 'dorian.poumay10@gmail.com',
        subject: 'Diagnostic — envoi direct depuis la fonction',
        text: 'Test.',
      });
      sendAttempt = { ok: !error, data, error };
    } else {
      sendAttempt = { ok: false, reason: 'clé ou expéditeur absent au moment de l’appel' };
    }
  } catch (err) {
    sendAttempt = {
      ok: false,
      exception: err instanceof Error ? { name: err.name, message: err.message } : String(err),
    };
  }

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV ?? null,
    hasResendApiKey: present('RESEND_API_KEY'),
    hasBookingFromEmail: present('BOOKING_FROM_EMAIL'),
    hasContactFromEmail: present('CONTACT_FROM_EMAIL'),
    hasHermesFromEmail: present('HERMES_FROM_EMAIL'),
    sendAttempt,
  });
}
