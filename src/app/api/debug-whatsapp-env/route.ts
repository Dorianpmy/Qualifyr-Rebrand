import { NextResponse } from 'next/server';

/**
 * Diagnostic temporaire (20/09/2026) — à supprimer une fois le token
 * WhatsApp confirmé valide.
 *
 * `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` sont présentes dans Netlify
 * depuis le 17/09/2026, mais rien ne dit si ce token est le token permanent
 * d'un utilisateur système (`Meta Business Settings → Utilisateurs
 * système`), ou l'ancien token de test de 24h affiché sur la page « Vue
 * d'ensemble » de l'API — ce dernier aurait expiré depuis.
 *
 * Pas d'envoi de message ici : une simple lecture des métadonnées du numéro
 * (`GET /{phone-number-id}`) suffit à distinguer un token valide d'un token
 * expiré ou révoqué, sans consommer de quota de conversation ni exiger de
 * numéro destinataire.
 *
 * Même politique que `api/debug-email-env` (supprimée depuis) : aucune
 * valeur secrète renvoyée, seulement des booléens de présence et la réponse
 * de Meta (qui ne contient que des métadonnées publiques du numéro, jamais
 * le token).
 */
export async function GET() {
  const present = (name: string) => {
    const value = process.env[name];
    return typeof value === 'string' && value.trim().length > 0;
  };

  let check: unknown = null;
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (token && phoneId) {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}?fields=verified_name,display_phone_number,quality_rating`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
      );
      const data = (await response.json()) as unknown;
      check = { ok: response.ok, status: response.status, data };
    } else {
      check = { ok: false, reason: 'variable manquante au moment de l’appel' };
    }
  } catch (err) {
    check = {
      ok: false,
      exception: err instanceof Error ? { name: err.name, message: err.message } : String(err),
    };
  }

  return NextResponse.json({
    hasWhatsappToken: present('WHATSAPP_TOKEN'),
    hasWhatsappPhoneNumberId: present('WHATSAPP_PHONE_NUMBER_ID'),
    check,
  });
}
