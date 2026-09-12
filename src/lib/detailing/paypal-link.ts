import 'server-only';

/**
 * Validation du lien PayPal personnel collé par le professionnel.
 *
 * **Ce n'est pas une vérification d'identité.** Impossible de confirmer que
 * le lien correspond à un compte PayPal réel et actif sans l'API partenaire
 * (Partner Referrals) — écartée pour ce mode, voir docs/18 §0. C'est
 * seulement un filtre contre un lien qui ne serait manifestement pas PayPal :
 * faute de frappe, copié depuis une autre page, compte compromis. Le client
 * final voit ce lien comme cliquable et n'a aucune raison de le remettre en
 * question — un champ libre affiché tel quel à un tiers serait une ouverture
 * au hameçonnage.
 */
const ALLOWED_HOSTS = new Set(['paypal.com', 'www.paypal.com', 'paypal.me']);

export function isValidPaypalLink(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname.toLowerCase());
}
