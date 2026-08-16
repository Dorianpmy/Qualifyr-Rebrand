/**
 * Validation IBAN — pure, sans dépendance serveur.
 *
 * Séparé de `swiss-qr-bill.ts` (marqué `server-only`) pour rester utilisable
 * dans le formulaire de réglages, côté client, où le professionnel doit voir
 * tout de suite si l'IBAN qu'il saisit est exploitable pour une QR-facture.
 */

/** Contrôle mod-97 (ISO 7064) — valide n'importe quel IBAN, indépendamment du pays. */
export function isValidIban(raw: string): boolean {
  const iban = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(iban)) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));

  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    remainder = Number(`${remainder}${numeric.slice(i, i + 7)}`) % 97;
  }
  return remainder === 1;
}

/** Un QR-bill suisse exige un IBAN suisse ou liechtensteinois. */
export function isQrBillEligibleIban(raw: string): boolean {
  const iban = raw.replace(/\s+/g, '').toUpperCase();
  return (iban.startsWith('CH') || iban.startsWith('LI')) && isValidIban(iban);
}
