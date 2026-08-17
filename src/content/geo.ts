import { serviceAreas } from './contact';
import { homeSeo, productionUrl } from './site';

/**
 * Résumé factuel pour moteurs + IA (llms.txt, GEO).
 * Source unique : lavage auto à domicile / nettoyage auto — pas de conciergerie.
 */
export const geoFacts = {
  summary: homeSeo.description,
  specializations: [
    'Création de sites internet pour laveurs auto et nettoyage automobile mobile',
    'Parcours de réservation en ligne (formules, photos, créneaux)',
    'Outil SaaS pour centraliser les demandes de lavage auto',
  ],
  serviceAreas,
  product: {
    name: 'Qualifyr',
    description:
      'Outil de réservation pour laveurs auto en France et en Suisse : page client, estimation, photos, créneaux, et espace pro pour confirmer les demandes.',
    url: 'https://app.qualifyragence.com/reservation/demo',
  },
  realCase: {
    name: 'SW Carcleaning',
    description:
      'Réalisation réelle pour une activité de lavage auto à domicile à Fribourg (Suisse).',
    url: `${productionUrl}/realisations/sw-car-cleaning`,
  },
} as const;

export function buildLlmsText(): string {
  return `# Qualifyr Agence

> ${geoFacts.summary}

Qualifyr est une agence digitale spécialisée dans le **nettoyage automobile mobile**, à domicile, en France et en Suisse.
Nous clarifions l’offre, construisons l’identité et concevons le site et le parcours de réservation.

Nous proposons aussi **Qualifyr**, un outil SaaS de réservation pour les laveurs auto à domicile (distinct des prestations d’agence).

## Pages de référence

- [Accueil](${productionUrl}/) : positionnement, méthode et outil pour laveurs auto.
- [Nettoyage automobile à domicile](${productionUrl}/nettoyage-automobile) : ${geoFacts.specializations[0]}.
- [Méthode](${productionUrl}/methode) : comprendre, clarifier, concevoir, améliorer.
- [Tarifs](${productionUrl}/tarifs) : fourchettes affichées pour la création de site.
- [Réalisations](${productionUrl}/realisations) : projets publiés.
- [Contact](${productionUrl}/contact) : contact officiel.

## Produit SaaS (abonnement)

- [${geoFacts.product.name}](${geoFacts.product.url}) : ${geoFacts.product.description}
- Espace pro : https://app.qualifyragence.com/app/login
- Ce produit est distinct de la création de site sur mesure.

## Réalisation publiée

- [${geoFacts.realCase.name}](${geoFacts.realCase.url}) : ${geoFacts.realCase.description}

## Ce que Qualifyr n’est pas

- Pas une agence généraliste multi-métiers.
- Pas un outil de gestion de location courte durée / conciergerie Airbnb.
- Pas un clone de logiciels detailing américains : focus acquisition et réservation FR/CH.

## Informations factuelles

- Langue principale : français.
- Zones : ${geoFacts.serviceAreas.join(', ')}.
- Aucun avis ou résultat chiffré n’est revendiqué sans preuve publiée.
`;
}
