/**
 * Conditions générales de vente — abonnements Qualifyr.
 *
 * **Pourquoi elles existent.** Vendre un abonnement à distance à des
 * professionnels sans CGV expose l'éditeur : le code de la consommation et le
 * code de commerce imposent d'informer sur le prix, la durée, la résiliation
 * et les réclamations avant la souscription. L'audit d'avant mise en
 * production (`docs/11`) les listait comme absentes et obligatoires.
 *
 * **Ce texte décrit le produit réel, pas le produit vendu sur la page
 * d'accueil.** Chaque affirmation ci-dessous a été vérifiée dans le code : les
 * limites de l'agent, l'absence de garantie de résultat, ce que le
 * professionnel reste seul à faire. Des CGV qui promettraient plus que le
 * logiciel ne fait aggraveraient le problème qu'elles sont censées régler.
 *
 * **Ce n'est pas un avis juridique.** Le texte est rédigé à partir des
 * obligations d'information courantes pour un abonnement logiciel en France ;
 * il doit être relu par un professionnel du droit avant la première vente,
 * en particulier sur le droit de rétractation, qui dépend du statut exact des
 * clients (professionnels au sens du code de la consommation ou non).
 */

import { mediator } from '@/content/company';

export type TermsSection = {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
};

/**
 * Date de dernière mise à jour, affichée en tête de page.
 *
 * Écrite en clair plutôt que calculée : une date générée automatiquement
 * changerait à chaque déploiement, y compris quand le texte n'a pas bougé —
 * ce qui, sur un document contractuel, revient à mentir. À modifier
 * **manuellement**, et seulement quand une clause change.
 */
export const termsUpdatedAt = '24 août 2026';

export const termsIntro =
  'Les présentes conditions régissent la souscription et l’utilisation des abonnements Qualifyr. Elles sont acceptées au moment du paiement.';

export const termsSections: readonly TermsSection[] = [
  {
    id: 'objet',
    title: 'Objet et champ d’application',
    paragraphs: [
      'Qualifyr est un logiciel accessible en ligne, proposé par abonnement à des professionnels du lavage et de la préparation automobile. Il réunit deux ensembles distincts : un agent de recensement d’entreprises, et un système de réservation et de facturation.',
      'Ces conditions s’appliquent à toute souscription réalisée depuis le site. Elles ne couvrent pas les prestations de conception de site réalisées sur devis, qui font l’objet d’un contrat séparé.',
    ],
  },
  {
    id: 'offres',
    title: 'Offres et contenu des abonnements',
    paragraphs: [
      'Trois offres sont proposées : « Agent seul », « Système seul » et « Pack complet ». Le détail des fonctionnalités incluses dans chacune figure sur la page Tarifs, et est repris dans l’espace professionnel, à la page Abonnement.',
      'Une offre ne donne accès qu’aux fonctionnalités qu’elle comprend. Les modules non inclus restent visibles dans l’interface mais verrouillés, avec l’indication de l’offre qui les débloque.',
      'L’agent de recensement interroge le répertoire Sirene de l’INSEE sur le code postal indiqué et les codes postaux immédiatement voisins, retient les établissements dont l’activité déclarée correspond aux segments retenus, et adresse un rapport par courrier électronique. Il ne contacte aucun prospect, ne prend aucun rendez-vous et n’engage aucune conversation.',
      'Le nombre d’établissements remontés dépend du contenu du répertoire officiel et des quotas de son interface de programmation. Aucun volume minimal n’est garanti.',
    ],
  },
  {
    id: 'prix',
    title: 'Prix et facturation',
    paragraphs: [
      'Les prix sont indiqués en euros et hors taxes sur la page Tarifs. L’éditeur relève de la franchise en base de taxe sur la valeur ajoutée : la mention « TVA non applicable, article 293 B du code général des impôts » figure sur les factures. En Suisse, la taxe applicable est celle du droit local.',
      'L’abonnement mensuel est facturé chaque mois. L’abonnement annuel est payé en une fois, à la souscription, pour douze mois.',
      'Le paiement est traité par Stripe. Aucune coordonnée bancaire ne transite ni n’est conservée par Qualifyr. Une facture est émise automatiquement à chaque échéance et adressée par courrier électronique.',
      'Les prix peuvent être modifiés. Tout changement est notifié au moins trente jours avant son entrée en vigueur, et ne s’applique qu’à compter de l’échéance suivante ; le client peut résilier d’ici là.',
    ],
  },
  {
    id: 'duree',
    title: 'Durée, renouvellement et résiliation',
    paragraphs: [
      'L’abonnement est conclu sans engagement de durée pour la formule mensuelle, et pour douze mois pour la formule annuelle. Il se renouvelle par tacite reconduction à chaque échéance.',
      'La résiliation peut être demandée à tout moment. Elle prend effet à la fin de la période en cours, déjà payée : aucun remboursement au prorata n’est pratiqué, et l’accès est maintenu jusqu’à cette date.',
      'Après résiliation, les données restent consultables en lecture seule. Rien n’est supprimé du fait de la résiliation.',
    ],
  },
  {
    id: 'paiement',
    title: 'Défaut de paiement',
    paragraphs: [
      'En cas d’échec de prélèvement, l’accès est maintenu le temps des nouvelles tentatives effectuées par Stripe, et le client en est informé dans son espace.',
      'Passé ce délai sans régularisation, l’accès est suspendu. Il est rétabli dès le paiement, sans frais ni intervention.',
    ],
  },
  {
    id: 'obligations',
    title: 'Obligations du client',
    paragraphs: [
      'Le client est responsable de l’exactitude des informations qu’il publie sur sa page de réservation, notamment ses prix, ses durées et sa zone d’intervention.',
      'Il demeure seul responsable de la relation avec ses propres clients, de l’exécution de ses prestations, de sa facturation et de ses obligations fiscales et sociales.',
      'L’usage des données d’entreprises issues du répertoire Sirene relève de la responsabilité du client. Il lui appartient de respecter les règles applicables à la prospection, en particulier l’obligation d’information et le droit d’opposition des personnes concernées.',
    ],
  },
  {
    /*
     * Section ajoutée le 22/08/2026 avec Hermès.
     *
     * **C'est l'article le plus important des présentes conditions**, parce
     * que c'est le seul où le client engage sa responsabilité vis-à-vis de
     * tiers qui n'ont rien demandé. Sans lui, la question « qui répond d'un
     * message reçu par une entreprise ? » n'aurait pas de réponse écrite — et
     * la réponse par défaut serait l'éditeur, puisque c'est son infrastructure
     * qui envoie.
     *
     * Il dit trois choses, dans cet ordre : qui est l'expéditeur, ce que
     * l'éditeur impose quoi qu'il arrive, et ce qui entraîne la coupure.
     */
    id: 'prospection',
    title: 'Prospection automatisée',
    paragraphs: [
      'Le client peut activer une fonction de prospection qui adresse des messages électroniques, en son nom, aux entreprises recensées dans ses zones d’analyse. Il en définit le contenu, l’expéditeur affiché et l’adresse de réponse.',
      'Le client est l’expéditeur de ces messages et en assume le contenu. L’éditeur agit comme sous-traitant au sens de l’article 28 du règlement général sur la protection des données : il traite les données pour le compte du client, sur ses instructions, et ne les utilise à aucune autre fin.',
      /*
       * Ajouté le 24/08/2026 avec l'import de listes. Le recensement
       * automatique ne couvre que la France, et seulement deux segments sur
       * quatre par OpenStreetMap : un client qui connaît déjà des
       * entreprises hors de ce périmètre doit pouvoir les apporter
       * lui-même. Le partage de responsabilité y est le même que pour le
       * reste de cet article (le client responsable de traitement,
       * l'éditeur sous-traitant) — seule l'origine de la donnée change, et
       * c'est précisément ce que l'attestation rend vérifiable après coup.
       */
      'Le client peut également importer sa propre liste d’entreprises à démarcher. Sur cette liste, l’éditeur n’a jamais collecté la moindre adresse : à chaque import, le client certifie l’avoir obtenue licitement, qu’elle ne concerne que des entreprises, et il répond des réclamations relatives à son origine. Une taille maximale par import et un plafond par compte s’appliquent, communiqués dans l’espace professionnel.',
      /*
       * Ajouté le 24/08/2026 : sans cette phrase, cet article et la
       * politique de confidentialité auraient décrit deux réalités
       * différentes dès l'introduction du classement par pertinence — la
       * politique nommant Mistral, les CGV restant muettes sur le fait que
       * l'éditeur recourt lui-même à un sous-traitant ultérieur pour une
       * partie du traitement. L'article 28.4 du RGPD impose précisément que
       * les mêmes garanties s'appliquent à ce sous-traitant ultérieur.
       */
      'Pour classer les entreprises recensées par pertinence, l’éditeur recourt à un sous-traitant ultérieur (Mistral AI), dans les mêmes conditions : sur instruction, pour cette seule finalité, sans droit d’usage propre sur les données. Le détail de ce qui lui est transmis figure dans la politique de confidentialité.',
      'L’éditeur ajoute automatiquement à chaque message, sans possibilité de retrait par le client, l’identité de l’expéditeur, l’origine des données de contact et un lien de désengagement fonctionnel. Une entreprise qui se désengage cesse d’être contactée par l’ensemble des clients du service, et non par le seul expéditeur du message reçu.',
      'Le client s’interdit d’utiliser cette fonction pour adresser des contenus sans rapport avec son activité, trompeurs, ou destinés à des personnes physiques agissant en dehors de leur activité professionnelle.',
      'Un volume quotidien maximal est appliqué à chaque compte. L’éditeur peut suspendre la fonction, sans préavis, en cas de signalement d’abus, de taux de rejet anormal ou d’atteinte à la réputation d’expédition du service. La suspension ne donne lieu à aucun remboursement au prorata lorsqu’elle résulte d’un manquement du client.',
      'Aucun résultat n’est garanti : le nombre de réponses obtenues dépend du contenu rédigé par le client, de son marché et de sa zone.',
    ],
  },
  {
    id: 'disponibilite',
    title: 'Disponibilité et limites',
    paragraphs: [
      /*
       * Supabase ajouté le 24/08/2026 : sans base de données ni
       * authentification, l'espace professionnel est entièrement
       * inutilisable — omis jusqu'ici alors que Stripe et INSEE, moins
       * centraux, y figuraient déjà. Mistral n'y figure délibérément pas :
       * son indisponibilité ne dégrade jamais le service (voir l'article
       * sur la prospection automatisée et CLAUDE.md, garde-fou n°3).
       */
      'Le service est fourni sans garantie de disponibilité ininterrompue. Il dépend de services tiers — hébergement, base de données, Stripe, INSEE, service d’envoi de courrier électronique — dont les interruptions peuvent l’affecter.',
      'Aucun résultat commercial n’est garanti. Le nombre de demandes, de réservations ou de clients obtenus ne dépend pas du logiciel seul.',
      'La responsabilité de l’éditeur, en cas de manquement établi, est limitée aux sommes effectivement versées au titre de l’abonnement sur les douze mois précédant le fait générateur.',
    ],
  },
  {
    id: 'donnees',
    title: 'Données personnelles',
    paragraphs: [
      'Le traitement des données est décrit dans la politique de confidentialité. Le client reste responsable de traitement pour les données de ses propres clients ; l’éditeur agit comme sous-traitant pour ce qui transite par le logiciel.',
      'Chacun exerce ses droits d’accès, de rectification et d’effacement auprès de l’éditeur, aux coordonnées figurant dans les mentions légales.',
    ],
  },
  {
    id: 'reclamations',
    title: 'Réclamations et droit applicable',
    paragraphs: [
      'Toute réclamation est adressée à l’éditeur, par courrier électronique, aux coordonnées des mentions légales. Une réponse est apportée dans un délai raisonnable.',
      'Les présentes conditions sont soumises au droit français. À défaut d’accord amiable, le litige relève des juridictions compétentes.',
    ],
  },
  /*
   * Ajoutée le 24/08/2026, mais n'apparaît sur la page que si `mediator`
   * (content/company.ts) est renseigné — voir le commentaire de ce champ.
   * Une clause à moitié écrite, citant un médiateur qui n'existe pas, serait
   * une fausse information juridique ; l'absence de clause, en attendant,
   * ne l'est pas.
   */
  ...(mediator
    ? [
        {
          id: 'mediation',
          title: 'Médiation de la consommation',
          paragraphs: [
            'Conformément aux articles L. 616-1 et R. 616-1 du code de la consommation, un client agissant en qualité de consommateur peut recourir gratuitement à un médiateur de la consommation pour la résolution amiable d’un litige qui n’aurait pas abouti directement auprès de l’éditeur, dans les conditions prévues à l’article précédent.',
            `Médiateur désigné : ${mediator.name}, saisissable à ${mediator.contact}.`,
            'Cette voie de recours ne concerne que les litiges avec un client agissant comme consommateur au sens du code de la consommation ; elle est sans effet sur les relations avec un client agissant pour les besoins de son activité professionnelle.',
          ],
        },
      ]
    : []),
];
