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
      'La durée de conservation des échanges n’est pas encore arrêtée. Elle sera précisée ici avant la mise en ligne du site.',
      'Nous préférons le reconnaître plutôt qu’annoncer une durée que nous ne tiendrions pas. Dans l’intervalle, vous pouvez demander la suppression de vos données à tout moment.',
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
    id: 'sous-traitants',
    title: 'Prestataires techniques',
    paragraphs: [
      'Netlify assure l’hébergement et la distribution du site. Dans ce cadre, Netlify traite les informations techniques nécessaires à la réception et à la sécurisation des requêtes, et fournit au site le code pays utilisé pour la présélection tarifaire.',
      'Tout nouveau prestataire traitant des données sera nommé ici avec la raison de son intervention.',
    ],
  },
];
