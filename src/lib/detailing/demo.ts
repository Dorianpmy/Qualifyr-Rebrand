import type { DetailerConfig } from './types';

/**
 * Pas de type importé de `BookingFlow` ici volontairement : ce fichier ne
 * doit dépendre que de `types.ts`, jamais d'un composant client. La forme de
 * `DEMO_DETAILER` est vérifiée à l'usage, là où `BookingFlow` la reçoit.
 */

/**
 * Détailer et tarifs de démonstration — entièrement codés en dur.
 *
 * **Pourquoi pas une fiche `demo` en base.** La version précédente cherchait
 * un detailer `slug='demo'` dans Supabase et affichait un message d'excuse
 * quand la ligne manquait — ce qui s'est reproduit plusieurs fois en
 * production (project Supabase mal configuré, ligne dépubliée, environnement
 * qui diverge). Une démonstration qui dépend d'un état de base de données
 * précis finira toujours par casser un jour où personne ne le remarque avant
 * qu'un visiteur tombe dessus.
 *
 * Cette fiche ne vit dans aucune table : elle ne peut plus manquer, plus
 * être dépubliée, plus pointer vers le mauvais projet Supabase. Le tunnel
 * qui la consomme (`BookingFlow` en mode `demo`) n'appelle non plus aucune
 * API de créneaux ni de réservation réelle — voir la note dans ce fichier.
 *
 * Service à l'atelier uniquement : ça retire `AddressPicker` et le
 * géocodage de la démonstration, qui n'ont rien à prouver ici — un visiteur
 * qui essaie la démo veut voir le devis se calculer et un créneau se
 * choisir, pas taper une adresse.
 */
export const DEMO_DETAILER = {
  id: 'demo',
  slug: 'demo',
  name: 'Atelier Qualifyr (démonstration)',
  city: 'Votre ville',
  country: 'FR',
  base: null,
  scopeLabels: {},
  mobileService: false,
  workshopService: true,
  workshopAddress: 'Adresse de démonstration — aucun rendez-vous réel n’est pris ici.',
};

export const DEMO_QUOTE_CONFIG: DetailerConfig = {
  prices: [
    { scope: 'interieur', vehicleSize: 'citadine', basePrice: 39, baseMinutes: 60 },
    { scope: 'exterieur', vehicleSize: 'citadine', basePrice: 35, baseMinutes: 45 },
    { scope: 'complet', vehicleSize: 'citadine', basePrice: 65, baseMinutes: 90 },
    { scope: 'interieur', vehicleSize: 'berline', basePrice: 49, baseMinutes: 75 },
    { scope: 'exterieur', vehicleSize: 'berline', basePrice: 45, baseMinutes: 60 },
    { scope: 'complet', vehicleSize: 'berline', basePrice: 85, baseMinutes: 120 },
    { scope: 'interieur', vehicleSize: 'suv', basePrice: 59, baseMinutes: 90 },
    { scope: 'exterieur', vehicleSize: 'suv', basePrice: 55, baseMinutes: 75 },
    { scope: 'complet', vehicleSize: 'suv', basePrice: 99, baseMinutes: 150 },
    { scope: 'interieur', vehicleSize: 'utilitaire', basePrice: 65, baseMinutes: 100 },
    { scope: 'exterieur', vehicleSize: 'utilitaire', basePrice: 59, baseMinutes: 85 },
    { scope: 'complet', vehicleSize: 'utilitaire', basePrice: 109, baseMinutes: 165 },
    { scope: 'interieur', vehicleSize: 'prestige', basePrice: 79, baseMinutes: 110 },
    { scope: 'exterieur', vehicleSize: 'prestige', basePrice: 69, baseMinutes: 90 },
    { scope: 'complet', vehicleSize: 'prestige', basePrice: 129, baseMinutes: 180 },
  ],
  options: [
    { key: 'shampouinage', enabled: true, price: 35, minutes: 45, scaleWithSize: true, affectedBySoiling: true },
    { key: 'ceramique', enabled: true, price: 120, minutes: 60, scaleWithSize: true, affectedBySoiling: false },
    { key: 'polissage', enabled: true, price: 90, minutes: 50, scaleWithSize: true, affectedBySoiling: false },
    { key: 'phares', enabled: true, price: 25, minutes: 20, scaleWithSize: false, affectedBySoiling: false },
    { key: 'ozone', enabled: true, price: 20, minutes: 15, scaleWithSize: false, affectedBySoiling: false },
  ],
  soiling: [
    { level: 'normal', labourMultiplier: 1 },
    { level: 'tres_sale', labourMultiplier: 1.25 },
    { level: 'poils_taches', labourMultiplier: 1.4 },
  ],
  travelFreeRadiusKm: 10,
  travelFeePerKm: 1.2,
  travelMaxKm: 40,
  longJobThresholdMinutes: 240,
  depositEnabled: true,
  depositPercent: 30,
};

/** Créneaux générés localement, sans appel réseau — voir `BookingFlow`. */
export function demoSlotsForDay(day: string): readonly { start: string; end: string }[] {
  const hours = [9, 11, 14, 16];
  return hours.map((hour) => {
    const start = new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`);
    const end = new Date(start.getTime() + 90 * 60_000);
    return { start: start.toISOString(), end: end.toISOString() };
  });
}
