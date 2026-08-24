/**
 * Textes des pages légales.
 *
 * Les paragraphes ci-dessous sont vrais **aujourd'hui**, au vu de ce qui est
 * réellement en place dans le code. Ils doivent être relus à chaque fois que la
 * configuration change : ajouter un outil de mesure d'audience, un stockage ou
 * un sous-traitant impose de mettre à jour ce fichier dans le même commit.
 */

export const legalNoticePage = {
  eyebrow: 'Informations légales',
  title: 'Mentions légales',
  lead: 'Informations relatives à l’éditeur et à l’hébergeur du site.',
  pendingNotice:
    'Les informations d’identification de l’éditeur seront publiées ici avant la mise en ligne du site. Elles ne sont pas encore renseignées, et rien n’est affiché à leur place.',
} as const;

export const privacyPage = {
  eyebrow: 'Informations légales',
  title: 'Politique de confidentialité',
  lead: 'Ce que nous collectons, pourquoi, combien de temps, et comment exercer vos droits.',
} as const;

export type PrivacySection = {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly items?: readonly string[];
};

export const privacySections: readonly PrivacySection[] = [
  {
    id: 'principe',
    title: 'Le principe',
    paragraphs: [
      'Ce site collecte le strict nécessaire pour répondre aux personnes qui nous écrivent. Il n’y a pas d’espace client, pas de compte, pas de profilage, et aucune donnée n’est revendue.',
      'Lorsque vous consultez les pages, l’hébergeur traite les informations techniques indispensables à la livraison du site. Qualifyr ne crée aucun profil visiteur et ne conserve aucun historique de navigation.',
    ],
  },
  {
    id: 'donnees',
    title: 'Données collectées',
    paragraphs: [
      'Lorsque vous nous contactez, les données collectées sont celles que vous saisissez volontairement dans le formulaire de contact du site.',
      'Formulaire de contact : prénom et nom, adresse e-mail, entreprise si vous la renseignez, message.',
      /* Ajouté le 22/08/2026 avec le nouveau parcours d'estimation. Cette page
         ne transmettait rien jusque-là ; elle collecte désormais des données
         personnelles, ce que la politique doit énoncer avant que la première
         demande n'arrive — et non après. La liste correspond exactement au
         schéma `estimationSchema` de `lib/validation.ts`. */
      'Formulaire d’estimation : prénom, nom ou nom de l’entreprise, adresse e-mail, téléphone si vous le renseignez, nom de l’activité si vous le renseignez, ville ou zone d’intervention, ainsi que les réponses que vous avez données et l’offre qui vous a été recommandée.',
      'Le parcours d’estimation calcule sa recommandation sur votre appareil. Rien ne nous est transmis tant que vous ne demandez pas à la recevoir par e-mail.',
      /* Ajouté le 22/08/2026 avec Hermès. Cette page est lue par deux publics
         désormais : les visiteurs du site, et les entreprises qui reçoivent un
         message de prospection et viennent chercher d'où vient leur adresse.
         Le second public arrive avec une question précise, et doit trouver la
         réponse sans avoir à écrire. */
      'Prospection : lorsqu’un professionnel abonné analyse une zone, nous recensons les entreprises qui s’y trouvent à partir du répertoire public des entreprises (INSEE — Sirene), et nous relevons l’adresse électronique publiée sur leur site lorsqu’elle existe. Aucune adresse n’est devinée ni achetée à un tiers.',
      'Ces informations concernent des établissements, pas des particuliers. Elles servent uniquement à permettre au professionnel abonné de les contacter au sujet de son activité. Il est l’expéditeur de ces messages ; nous les acheminons pour son compte.',
      /* Ajouté le 24/08/2026 avec le classement par pertinence. Pour une
         entreprise individuelle, la raison sociale est le nom d'une personne
         (fréquent chez les VTC et les petits garages) : dire « aucune donnée
         personnelle » serait donc faux. Ce qui est vrai et vérifiable, c'est
         la liste exacte des champs transmis — jamais l'e-mail, jamais le
         jeton de désinscription. */
      'Lorsqu’un professionnel décrit son activité, un modèle de langage (Mistral) classe les entreprises recensées de sa zone par pertinence pour cette activité. Il reçoit uniquement les données publiques du répertoire des entreprises : raison sociale, code d’activité, ville, tranche d’effectif. Jamais l’adresse e-mail, jamais le jeton de désinscription. Il ne rédige aucun message et ne décide d’aucun envoi.',
      'Chaque message comporte un lien de désengagement. L’utiliser retire l’adresse pour l’ensemble des professionnels utilisant le service, et non pour le seul expéditeur du message reçu.',
      'Lorsqu’un lien de campagne est utilisé, le stockage de session peut aussi conserver la source, le support, le nom de campagne, le domaine référent et la page d’entrée. Ces éléments ne contiennent aucune coordonnée et sont joints à une demande uniquement pour comprendre son origine.',
      'L’adresse de la page depuis laquelle le formulaire a été envoyé est jointe au message, afin de savoir dans quel contexte vous nous avez écrit.',
      'Pour présélectionner la devise du configurateur, l’hébergeur déduit uniquement le code du pays à partir de la connexion. L’adresse IP n’est ni transmise au code applicatif de Qualifyr, ni enregistrée par le site pour cette fonction.',
    ],
  },
  {
    id: 'finalite',
    title: 'Pourquoi nous les collectons',
    paragraphs: [
      'Uniquement pour comprendre votre demande, préparer notre échange et vous répondre. Rien d’autre.',
      'Ces données ne servent ni à de la prospection automatisée, ni à de la publicité, ni à alimenter une quelconque liste de diffusion.',
      'Le code pays sert uniquement à afficher la devise et la grille tarifaire appropriées. Si cette indication est incorrecte, vous pouvez nous le signaler avant l’établissement du devis.',
    ],
  },
  {
    id: 'base-legale',
    title: 'Sur quelle base',
    paragraphs: [
      'Pour les formulaires, sur votre consentement, donné en cochant la case prévue avant l’envoi. Cette case n’est jamais pré-cochée, et le formulaire ne peut pas être envoyé sans elle.',
      'Pour l’affichage automatique de la devise, sur notre intérêt légitime à présenter une estimation adaptée à la zone de facturation, sans conservation du code pays.',
      'Vous pouvez retirer votre consentement à tout moment en nous écrivant : nous supprimons alors les échanges vous concernant.',
    ],
  },
  {
    id: 'destinataire',
    title: 'Qui reçoit vos messages',
    paragraphs: [
      'Les messages envoyés depuis le site arrivent dans la boîte e-mail de Qualifyr Agence. Ils ne sont transmis à aucun tiers.',
      'Les demandes ne sont pas enregistrées dans une base de données : elles existent uniquement sous forme d’e-mail.',
    ],
  },
  {
    id: 'conservation',
    title: 'Combien de temps',
    paragraphs: [
      'La durée de conservation des échanges n’est pas encore arrêtée.',
      'Nous préférons le reconnaître plutôt qu’annoncer une durée que nous ne tiendrions pas. Dans l’intervalle, vous pouvez demander la suppression de vos données à tout moment, et nous y donnons suite.',
    ],
  },
  {
    id: 'droits',
    title: 'Vos droits',
    paragraphs: [
      'Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation et d’opposition sur les données vous concernant, ainsi que du droit de retirer votre consentement.',
      'Pour les exercer, écrivez-nous. Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies et mesure d’audience',
    paragraphs: [
      'Ce site ne dépose aucun cookie. Ni cookie publicitaire, ni cookie de mesure, ni cookie de préférence. Le stockage de session utilisé par l’attribution de campagne n’est pas un cookie et disparaît avec la session du navigateur.',
      'Aucun fournisseur de mesure d’audience n’est installé. Le site émet seulement des événements techniques locaux, sans coordonnée ni réponse libre, afin de pouvoir accueillir ultérieurement un outil de mesure respectueux de la vie privée.',
      'C’est pourquoi aucune bannière de consentement ne vous est présentée : il n’y a rien à consentir.',
    ],
  },
  {
    /*
     * Réécrit le 24/08/2026 : les prestataires ne sont plus décrits en
     * prose ici, mais lus directement depuis `company.processors`
     * (src/app/politique-de-confidentialite/page.tsx) — un seul endroit à
     * tenir à jour, plutôt que deux qui peuvent diverger. Le paragraphe
     * d'intro reste ici parce qu'il ne dépend d'aucune valeur du code.
     */
    id: 'sous-traitants',
    title: 'Prestataires techniques',
    paragraphs: [
      'Chacun des prestataires ci-dessous traite des données pour notre compte, sur nos instructions, pour la finalité indiquée en face de son nom — jamais pour un usage qui lui serait propre. Tout nouveau prestataire apparaît ici dès qu’il est effectivement en place.',
    ],
  },
];
