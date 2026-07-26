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
      'Si vous vous contentez de lire les pages, nous ne collectons rien du tout.',
    ],
  },
  {
    id: 'donnees',
    title: 'Données collectées',
    paragraphs: [
      'Les seules données collectées sont celles que vous saisissez volontairement dans l’un des deux formulaires du site.',
      'Formulaire de contact : prénom et nom, adresse e-mail, entreprise si vous la renseignez, message.',
      'Formulaire de diagnostic : prénom et nom, nom de l’entreprise, adresse e-mail, téléphone si vous le renseignez, ville ou zone d’intervention, adresse de votre site si vous en avez un, ancienneté de l’activité, manière dont vous recevez vos réservations, objectif prioritaire, principal blocage, message libre.',
      'L’adresse de la page depuis laquelle le formulaire a été envoyé est jointe au message, afin de savoir dans quel contexte vous nous avez écrit.',
    ],
  },
  {
    id: 'finalite',
    title: 'Pourquoi nous les collectons',
    paragraphs: [
      'Uniquement pour comprendre votre demande, préparer notre échange et vous répondre. Rien d’autre.',
      'Ces données ne servent ni à de la prospection automatisée, ni à de la publicité, ni à alimenter une quelconque liste de diffusion.',
    ],
  },
  {
    id: 'base-legale',
    title: 'Sur quelle base',
    paragraphs: [
      'Sur votre consentement, donné en cochant la case prévue avant l’envoi. Cette case n’est jamais pré-cochée, et le formulaire ne peut pas être envoyé sans elle.',
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
      'Ce site ne dépose aucun cookie. Ni cookie publicitaire, ni cookie de mesure, ni cookie de préférence.',
      'Aucun outil de mesure d’audience n’est installé : nous ne savons ni combien de personnes visitent le site, ni d’où elles viennent, ni ce qu’elles y font.',
      'C’est pourquoi aucune bannière de consentement ne vous est présentée : il n’y a rien à consentir.',
    ],
  },
  {
    id: 'sous-traitants',
    title: 'Prestataires techniques',
    paragraphs: [
      'Aucun prestataire ne traite vos données à ce jour : le service d’envoi d’e-mail et l’hébergeur ne sont pas encore mis en service.',
      'Dès qu’un prestataire sera en place, il sera nommé ici, avec la raison de son intervention et le lieu de traitement des données.',
    ],
  },
];
