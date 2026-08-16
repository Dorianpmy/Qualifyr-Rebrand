import 'server-only';
import qrcode from 'qrcode-generator';
import { isQrBillEligibleIban } from './iban';

/**
 * QR-facture suisse (Swiss QR-bill, Swiss Payment Standards, v2.3).
 *
 * **Pourquoi ce module et pas le XML CII pour un client suisse.** `einvoice.ts`
 * produit un CII conforme EN 16931 — c'est la norme européenne (et française)
 * de facturation électronique. La Suisse n'y est pas soumise et ne la reconnaît
 * pas comme moyen de paiement : son format propre est le QR-bill, une charge
 * structurée codée dans un QR Code apposé sur la facture, que n'importe quelle
 * app bancaire suisse sait scanner pour préremplir un virement. Un client
 * suisse qui reçoit un CII XML ne peut rien en faire ; un QR-bill, si.
 *
 * **Adresse structurée uniquement.** Le format « combiné » (deux lignes libres)
 * a été retiré du standard le 21 novembre 2025 — seul le format structuré
 * (rue / numéro / NPA / localité séparés) reste valide. Qualifyr ne stocke
 * qu'une adresse libre par tiers ; `splitStreetAndNumber` en extrait le numéro
 * de rue par une heuristique simple plutôt que d'exiger une refonte du
 * formulaire d'adresse pour ce seul usage.
 *
 * **Type de référence : NON.** Une référence structurée (QRR) exige un
 * IBAN de type « QR-IBAN », une plage réservée que les banques attribuent sur
 * demande spécifique — rien ne garantit que l'IBAN saisi par un detailer en
 * soit un. « NON » (pas de référence structurée) est valide avec un IBAN
 * ordinaire ; le numéro de facture part alors en message libre, ce qui reste
 * largement suffisant pour un règlement entre un artisan et son client.
 *
 * **Jeu de caractères restreint par la norme** (« Extended Latin ») : pas
 * d'emoji, pas de certains signes de ponctuation. Les diacritiques sont
 * retirés (`stripDiacritics`) plutôt que de risquer un caractère refusé par un
 * validateur bancaire — un nom de rue sans accent reste lisible, un caractère
 * qui casse l'encodage du QR ne l'est pas.
 *
 * **Non validé face à un validateur officiel.** Comme pour le CII (voir
 * `einvoice.ts`), cette structure suit la spécification publique terme à
 * terme mais n'a pas été passée dans le validateur de référence de SIX. À
 * vérifier par un scan réel dans une app bancaire suisse avant usage en
 * production.
 */

export type QrBillParty = {
  readonly name: string;
  readonly address: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly country: string;
};

export type QrBillInput = {
  readonly iban: string;
  readonly creditor: QrBillParty;
  readonly debtor: QrBillParty | null;
  readonly amount: number;
  readonly currency: string;
  readonly message: string;
};

/** Retire les diacritiques — voir la note de jeu de caractères en tête de fichier. */
function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Un seul point commun à tous les champs du payload : pas de retour à la ligne, longueur raisonnable. */
function field(value: string | null | undefined, maxLength = 70): string {
  if (!value) return '';
  return stripDiacritics(value).replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength);
}

/**
 * Sépare une adresse libre en rue + numéro.
 *
 * Cherche un numéro en fin de chaîne (« Rue de la Gare 12 ») ou en tête
 * (« 12 Rue de la Gare ») — les deux usages coexistent en France et en Suisse.
 * Sans numéro trouvé, toute la chaîne part en nom de rue : le champ numéro
 * vide est légal dans le standard, une rue tronquée ne l'est pas.
 */
function splitStreetAndNumber(address: string | null): { street: string; number: string } {
  if (!address) return { street: '', number: '' };
  const trimmed = address.trim();

  const trailing = trimmed.match(/^(.*\S)\s+([0-9][0-9a-zA-Z/\-]*)$/);
  if (trailing?.[1] && trailing[2]) return { street: trailing[1], number: trailing[2] };

  const leading = trimmed.match(/^([0-9][0-9a-zA-Z/\-]*)\s+(.*\S)$/);
  if (leading?.[1] && leading[2]) return { street: leading[2], number: leading[1] };

  return { street: trimmed, number: '' };
}

function partyBlock(party: QrBillParty | null, structuredType: 'S'): readonly string[] {
  if (!party || !party.name || !party.country) {
    return ['', '', '', '', '', '', ''];
  }
  const { street, number } = splitStreetAndNumber(party.address);
  return [
    structuredType,
    field(party.name),
    field(street),
    field(number, 16),
    field(party.postalCode, 16),
    field(party.city),
    field(party.country, 2).toUpperCase(),
  ];
}

/**
 * Construit le payload texte du QR Code, prêt à encoder.
 *
 * Retourne `null` quand les conditions minimales ne sont pas réunies — un
 * QR-bill mal formé n'est pas un repli acceptable, seulement son absence
 * l'est.
 */
export function buildSwissQrBillPayload(input: QrBillInput): string | null {
  const iban = input.iban.replace(/\s+/g, '').toUpperCase();
  if (!isQrBillEligibleIban(iban)) return null;
  if (!input.creditor.name || !input.creditor.country) return null;
  if (input.currency !== 'CHF' && input.currency !== 'EUR') return null;
  if (!(input.amount > 0)) return null;

  // UltmtCdtr (créancier final) : sept champs, toujours vides — la norme
  // réserve ce bloc à un cas d'usage (cession de créance) que Qualifyr ne
  // couvre pas, mais les sept lignes doivent être présentes.
  const ultimateCreditor = ['', '', '', '', '', '', ''];

  const lines = [
    'SPC',
    '0200',
    '1',
    iban,
    ...partyBlock(input.creditor, 'S'),
    ...ultimateCreditor,
    input.amount.toFixed(2),
    input.currency,
    ...partyBlock(input.debtor, 'S'),
    'NON',
    '',
    field(input.message, 140),
    'EPD',
    '',
  ];

  return lines.join('\r\n');
}

/**
 * Rend le QR Code en SVG, avec la croix suisse au centre.
 *
 * **Pourquoi ne pas utiliser l'export SVG intégré de la bibliothèque.** Il ne
 * sait pas poser la croix suisse par-dessus — obligatoire sur un QR-bill, elle
 * distingue le format des QR Codes génériques. On reconstruit donc le SVG
 * module par module à partir de la matrice calculée, ce qui permet d'ajouter
 * le repère au centre sans post-traitement d'image.
 */
export function renderQrBillSvg(payload: string, sizeMm = 46): string {
  const qr = qrcode(0, 'M');
  qr.addData(payload, 'Byte');
  qr.make();

  const count = qr.getModuleCount();
  const cell = sizeMm / count;

  let modules = '';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.isDark(row, col)) continue;
      modules += `<rect x="${(col * cell).toFixed(3)}" y="${(row * cell).toFixed(3)}" width="${cell.toFixed(3)}" height="${cell.toFixed(3)}" />`;
    }
  }

  // Croix suisse : carré blanc à bord noir, 7 mm de côté au centre, plus la
  // croix elle-même — proportions données par le guide d'implémentation SIX.
  const crossSize = 7;
  const crossX = (sizeMm - crossSize) / 2;
  const crossY = crossX;
  const armW = crossSize * 0.18;
  const armL = crossSize * 0.55;
  const cx = sizeMm / 2;
  const cy = sizeMm / 2;

  return `<svg viewBox="0 0 ${sizeMm} ${sizeMm}" width="${sizeMm}mm" height="${sizeMm}mm" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${sizeMm}" height="${sizeMm}" fill="#ffffff" />
    <g fill="#000000">${modules}</g>
    <rect x="${crossX}" y="${crossY}" width="${crossSize}" height="${crossSize}" fill="#ffffff" stroke="#000000" stroke-width="0.5" />
    <rect x="${cx - armW / 2}" y="${cy - armL / 2}" width="${armW}" height="${armL}" fill="#000000" />
    <rect x="${cx - armL / 2}" y="${cy - armW / 2}" width="${armL}" height="${armW}" fill="#000000" />
  </svg>`;
}
