import { serviceAreas } from './contact';
import { homeSeo, productionUrl } from './site';

/**
 * Résumé factuel destiné aux formats textuels lisibles par les moteurs.
 * Les pages HTML et leurs données structurées restent la source de référence.
 */
export const geoFacts = {
  summary: homeSeo.description,
  specializations: [
    'Création de sites internet pour les professionnels du nettoyage automobile mobile et du detailing à domicile',
    'Création de sites internet pour les conciergeries',
  ],
  serviceAreas,
  realCase: {
    name: 'SW Carcleaning',
    description:
      'Réalisation réelle pour une activité de lavage et detailing à domicile à Fribourg.',
    url: `${productionUrl}/realisations/sw-car-cleaning`,
  },
} as const;

export function buildLlmsText(): string {
  return `# Qualifyr Agence

> ${geoFacts.summary}

Qualifyr clarifie l’offre, construit l’identité et conçoit le site et le parcours de contact des entreprises de services.

## Pages de référence

- [Accueil](${productionUrl}/) : présentation de Qualifyr, de sa méthode et de sa réalisation publiée.
- [Nettoyage automobile mobile et detailing](${productionUrl}/nettoyage-automobile) : ${geoFacts.specializations[0]}.
- [Conciergeries](${productionUrl}/conciergerie) : ${geoFacts.specializations[1]}.
- [Méthode](${productionUrl}/methode) : étapes suivies pour comprendre, clarifier, concevoir et améliorer un parcours.
- [Contact](${productionUrl}/contact) : point de contact officiel de Qualifyr Agence.

## Réalisation publiée

- [${geoFacts.realCase.name}](${geoFacts.realCase.url}) : ${geoFacts.realCase.description}

## Informations factuelles

- Langue principale : français.
- Zones d’accompagnement : ${geoFacts.serviceAreas.join(', ')}.
- Les études signalées comme « concept » dans le laboratoire sont des démonstrations créatives et non des projets clients livrés.
- Aucun avis, résultat chiffré ou client supplémentaire n’est revendiqué sans preuve publiée.
`;
}
