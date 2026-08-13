import type { OptionKey, Scope, SoilingLevel, VehicleSize } from '@/lib/detailing/types';

/**
 * Copie éditoriale du parcours de réservation.
 *
 * Chaque option porte deux lignes écrites une fois pour toutes, dans le
 * registre de la conséquence plutôt que de la technique
 * (`docs/13-saas-nettoyage-automobile.md`, §3.1). Aucun chiffre non
 * sourçable : la mention « jusqu'à 40 % » du cahier des charges est retirée
 * tant qu'elle n'est pas vérifiée (§3.1, note « interdit »).
 */

export const vehicleSizeCopy: Record<VehicleSize, { label: string; hint: string }> = {
  citadine: { label: 'Citadine', hint: 'Ex. Clio, 208, Twingo' },
  berline: { label: 'Berline', hint: 'Ex. Golf, 308, Mégane' },
  suv: { label: 'SUV / break', hint: 'Ex. Qashqai, 3008, Tiguan' },
  utilitaire: { label: 'Utilitaire', hint: 'Ex. Kangoo, Trafic, Jumpy' },
  prestige: { label: 'Prestige', hint: 'Berline haut de gamme, sportive, collection' },
};

export const scopeCopy: Record<Scope, { label: string; hint: string }> = {
  interieur: { label: 'Intérieur', hint: 'Habitacle, sièges, plastiques, vitres intérieures' },
  exterieur: { label: 'Extérieur', hint: 'Carrosserie, jantes, vitres extérieures' },
  complet: { label: 'Complet', hint: 'Intérieur et extérieur' },
};

export const soilingCopy: Record<SoilingLevel, { label: string; hint: string }> = {
  normal: { label: 'État normal', hint: 'Quelques miettes et un peu de poussière.' },
  tres_sale: { label: 'Très sale', hint: 'Taches visibles sur les sièges.' },
  poils_taches: { label: 'Poils et taches anciennes', hint: 'Poils d’animaux, taches installées.' },
};

export const optionCopy: Record<OptionKey, { label: string; lines: readonly [string, string] }> = {
  shampouinage: {
    label: 'Shampouinage des sièges',
    lines: [
      'Ce qui part avec l’aspirateur, ce sont les miettes.',
      'Les taches et les odeurs sont dans la mousse, et seul un shampouinage-extraction les en sort.',
    ],
  },
  ceramique: {
    label: 'Traitement céramique',
    lines: [
      'La peinture reste propre plus longtemps et se lave en deux fois moins de temps.',
      'Compter deux à trois ans de protection, contre deux mois pour une cire classique.',
    ],
  },
  polissage: {
    label: 'Polissage carrosserie',
    lines: [
      'Les micro-rayures qui ternissent la peinture disparaissent, la couleur retrouve sa profondeur.',
      'Un geste mécanique sur la carrosserie, indépendant de l’état intérieur du véhicule.',
    ],
  },
  phares: {
    label: 'Rénovation des phares',
    lines: [
      'Des phares jaunis éclairent nettement moins loin la nuit.',
      'C’est la seule prestation esthétique qui soit aussi une question de sécurité.',
    ],
  },
  ozone: {
    label: 'Traitement anti-odeur ozone',
    lines: [
      'Une odeur de tabac, d’humidité ou d’animal ne part pas au parfum : elle est dans les textiles.',
      'Le traitement à l’ozone la neutralise à la source plutôt que de la masquer.',
    ],
  },
};

export const revisionNotice = (detailerName: string) =>
  `Ce montant repose sur l’état que vous avez décrit. À son arrivée, ${detailerName} vérifie le véhicule avant de commencer. Si l’état diffère de ce qui a été annoncé, il vous propose un montant ajusté — et vous restez libre de refuser. Votre acompte vous est alors rendu.`;
