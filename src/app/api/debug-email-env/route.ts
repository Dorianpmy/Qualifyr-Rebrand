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

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV ?? null,
    hasResendApiKey: present('RESEND_API_KEY'),
    hasBookingFromEmail: present('BOOKING_FROM_EMAIL'),
    hasContactFromEmail: present('CONTACT_FROM_EMAIL'),
    hasHermesFromEmail: present('HERMES_FROM_EMAIL'),
  });
}
