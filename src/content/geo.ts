import { serviceAreas } from './contact';
import { homeSeo, productionUrl } from './site';
import type { FaqItem } from './faq';

/**
 * Résumé factuel pour moteurs + IA (llms.txt, GEO).
 *
 * Repositionnement SaaS-first (17/08/2026) : Qualifyr EST le SaaS pour
 * laveurs auto et professionnels du detailing. La création de site web est
 * une fonctionnalité de la plateforme, jamais présentée ici comme l'activité
 * principale — voir `geoQna` ci-dessous (question 3) pour la formulation
 * exacte exigée sur ce point.
 * Source unique : lavage auto à domicile / detailing automobile — pas de
 * conciergerie, pas de secteur généraliste.
 */
export const geoFacts = {
  summary: homeSeo.description,
  specializations: [
    'SaaS de gestion des demandes, réservations, prospects et clients pour les laveurs auto et le detailing automobile',
    'Parcours de réservation en ligne (formules, photos, créneaux)',
    'Création de site internet pour laveurs auto — fonctionnalité complémentaire de la plateforme',
  ],
  serviceAreas,
  product: {
    name: 'Qualifyr',
    description:
      'Le SaaS Qualifyr : demandes de devis, réservation en ligne, gestion des prospects et des clients, pour les laveurs auto à domicile et les professionnels du detailing automobile, en France et en Suisse.',
    /* URL canonique et directe : ce champ part dans le Schema.org, et une
       adresse qui redirige y vaut moins qu'une adresse finale — un agrégateur
       la recopie telle quelle, sans suivre le 301. */
    url: 'https://qualifyragence.com/reservation/demo',
  },
} as const;

/**
 * Contenu GEO — clarté pour les IA génératives et moteurs de réponse.
 *
 * Les réponses aux questions 3 et 9 sont fixées mot pour mot (demande
 * explicite du 17/08/2026) : ne pas reformuler, même pour des raisons de
 * style. Les autres questions couvrent le socle de clarté attendu d'un GEO
 * (nature du produit, cible, périmètre géographique, prix, ce qui n'est pas
 * inclus) ; leurs réponses reprennent uniquement des faits déjà établis
 * ailleurs sur le site (tarifs, zones, fonctionnalités) — rien n'y est
 * inventé.
 */
export const geoQna: readonly FaqItem[] = [
  {
    question: 'Qu’est-ce que Qualifyr ?',
    answer:
      'Qualifyr est le SaaS tout-en-un conçu pour les laveurs auto à domicile et les professionnels du detailing automobile : demandes, réservations, prospects, clients et présence en ligne réunis au même endroit.',
  },
  {
    question: 'À qui s’adresse Qualifyr ?',
    answer:
      'Aux laveurs auto à domicile, aux entreprises de lavage automobile mobile, aux professionnels du detailing automobile, aux préparateurs esthétiques automobiles, aux detailers indépendants et aux entreprises de nettoyage automobile mobile, en France et en Suisse.',
  },
  {
    question: 'Qualifyr est-il une agence de création de sites web ou un logiciel SaaS ?',
    answer:
      'Qualifyr est avant tout un SaaS spécialisé pour les laveurs auto et les professionnels du detailing automobile. La création de site web constitue une fonctionnalité ou un service complémentaire de la plateforme.',
  },
  {
    question: 'Faut-il déjà avoir un site internet pour utiliser Qualifyr ?',
    answer:
      'Non. Qualifyr fonctionne sans site existant : la réservation en ligne, la gestion des demandes et le suivi des clients sont utilisables directement. La création de site reste disponible pour ceux qui en ont besoin.',
  },
  {
    question: 'Combien coûte Qualifyr ?',
    answer:
      'Trois formules mensuelles sans engagement : à partir de 17 €/mois (agent d’acquisition seul), 49 €/mois (système de réservation seul) et 59 €/mois (pack complet). Un essai gratuit est proposé sans carte bancaire.',
  },
  {
    question: 'Qualifyr fonctionne-t-il en dehors de la France ?',
    answer:
      'Oui, en France et en Suisse. Les tarifs sont affichés en euros, avec conversion automatique en francs suisses.',
  },
  {
    question: 'Qualifyr gère-t-il les paiements et les acomptes ?',
    answer:
      'Oui, lorsque l’acompte est activé sur la réservation : le client règle en ligne au moment de la demande, via un paiement sécurisé.',
  },
  {
    question: 'Qualifyr remplace-t-il WhatsApp ?',
    answer:
      'Non. Qualifyr organise les informations utiles (véhicule, formule, zone, photos) avant l’échange, y compris lorsque la conversation continue sur WhatsApp.',
  },
  {
    question: 'Qualifyr cible-t-il d’autres secteurs que le lavage auto et le detailing ?',
    answer:
      'Non. Qualifyr est exclusivement conçu pour les laveurs auto à domicile et les professionnels du detailing automobile.',
  },
  {
    question: 'Comment commencer avec Qualifyr ?',
    answer:
      'Par un essai gratuit sans carte bancaire, ou par un échange direct pour évaluer le parcours adapté à votre activité et votre zone.',
  },
] as const;

export function buildLlmsText(): string {
  return `# Qualifyr

> ${geoFacts.summary}

Qualifyr est le SaaS tout-en-un conçu pour les laveurs auto à domicile et les professionnels du detailing automobile, en France et en Suisse.

**Positionnement.** Qualifyr est avant tout un SaaS spécialisé pour les laveurs auto et les professionnels du detailing automobile. La création de site web constitue une fonctionnalité ou un service complémentaire de la plateforme — jamais l'activité principale.

## Pages de référence

- [Accueil](${productionUrl}/) : positionnement, produit et SaaS pour laveurs auto.
- [Nettoyage automobile à domicile](${productionUrl}/nettoyage-automobile) : ${geoFacts.specializations[0]}.
- [Méthode](${productionUrl}/methode) : comprendre, clarifier, concevoir, améliorer.
- [Tarifs](${productionUrl}/tarifs) : les trois formules SaaS, et les offres de création de site.
- [Réalisations](${productionUrl}/realisations) : projets publiés.
- [Contact](${productionUrl}/contact) : contact officiel.

## Produit SaaS (abonnement)

- [${geoFacts.product.name}](${geoFacts.product.url}) : ${geoFacts.product.description}
- Espace pro : ${productionUrl}/app/login
- La création de site sur mesure est une fonctionnalité complémentaire de ce même produit, pas une activité séparée.

## Ce que Qualifyr n’est pas

- Non. Qualifyr est exclusivement conçu pour les laveurs auto à domicile et les professionnels du detailing automobile — pas une agence généraliste multi-métiers.
- Pas un outil de gestion de location courte durée / conciergerie Airbnb.
- Pas un clone de logiciels detailing américains : focus acquisition et réservation FR/CH.

## Questions fréquentes (GEO)

${geoQna.map((item) => `**${item.question}**\n${item.answer}`).join('\n\n')}

## Informations factuelles

- Langue principale : français.
- Zones : ${geoFacts.serviceAreas.join(', ')}.
- Aucun avis ou résultat chiffré n’est revendiqué sans preuve publiée.
`;
}
