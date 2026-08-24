/**
 * Codes postaux couverts par un rayon — partagé entre `/api/agent/process`
 * (recensement Sirene) et `/api/agent/enrich` (rapprochement OpenStreetMap) :
 * les deux ont besoin de la même approximation d'une zone à partir d'un seul
 * code postal, et il n'y a aucune raison qu'elle diverge entre les deux.
 *
 * **Approximation assumée, et documentée dans le rapport.** Sirene cherche par
 * code postal, pas dans un cercle. Convertir un rayon en liste exacte de codes
 * postaux demanderait une base de contours communaux ; ici on prend le code
 * demandé et ses voisins immédiats par incrément numérique, ce qui couvre les
 * arrondissements d'une même ville et les communes limitrophes dans la plupart
 * des cas.
 *
 * Le rapport dit « autour du 69003 » et non « dans un rayon de 15 km
 * exactement » — la formulation doit refléter ce que la méthode fait vraiment.
 */
export function nearbyPostalCodes(postalCode: string, radiusKm: number): readonly string[] {
  const base = Number(postalCode);
  if (!Number.isFinite(base)) return [postalCode];

  // Un seul voisin de chaque côté : trois codes postaux au total. Au-delà, le
  // traitement dépasse la limite de durée des fonctions.
  const spread = 1;
  void radiusKm;
  const codes: string[] = [];

  for (let offset = -spread; offset <= spread; offset += 1) {
    const candidate = base + offset;
    if (candidate > 0) codes.push(String(candidate).padStart(postalCode.length, '0'));
  }

  return codes;
}
