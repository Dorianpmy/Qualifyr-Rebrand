/**
 * Recensement des variables d'environnement obligatoires.
 *
 * **Pourquoi ce fichier existe.** Aucune des variables ci-dessous ne provoque
 * d'erreur au démarrage quand elle manque. Elles se manifestent bien plus
 * tard, et de la pire façon : un client paie et n'obtient aucun droit
 * (`STRIPE_BILLING_WEBHOOK_SECRET`), une analyse aboutit sans que le rapport
 * ne parte (`RESEND_API_KEY`), ou l'espace pro refuse tout le monde comme si
 * personne n'avait payé (`SUPABASE_SERVICE_ROLE_KEY`). Ces pannes silencieuses
 * se découvrent en production, par un client mécontent.
 *
 * **Pourquoi ce n'est pas un contrôle bloquant au démarrage.** Faire échouer
 * le démarrage sur une variable manquante rendrait le site entièrement
 * indisponible pour une fonctionnalité secondaire — couper la page d'accueil
 * parce que la clé Resend manque serait une régression, pas une protection.
 * Le contrôle est donc explicite et volontaire (`npm run check:env`), à
 * lancer avant un déploiement.
 *
 * Ce module ne lit aucune valeur : il ne vérifie que la **présence**. Aucun
 * secret ne peut donc fuir par ses messages.
 */

export type EnvRequirement = {
  readonly name: string;
  /** Ce qui cesse de fonctionner sans elle. */
  readonly consequence: string;
  /** Obligatoire en production. Toutes ne le sont pas en développement. */
  readonly requiredInDev: boolean;
};

export const REQUIRED_ENV: readonly EnvRequirement[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    consequence: 'aucune connexion possible : l’espace pro est inutilisable',
    requiredInDev: true,
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    consequence: 'la connexion par lien magique échoue sans message',
    requiredInDev: true,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    consequence:
      'le webhook ne peut rien écrire et tous les droits sont refusés, y compris aux abonnés légitimes',
    requiredInDev: true,
  },
  {
    name: 'STRIPE_SECRET_KEY',
    consequence: 'aucun abonnement ne peut être souscrit',
    requiredInDev: false,
  },
  {
    name: 'STRIPE_BILLING_WEBHOOK_SECRET',
    consequence:
      'le webhook répond 503 : un client paie, Stripe encaisse, et aucun droit n’est accordé',
    requiredInDev: false,
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    consequence: 'les acomptes payés ne sont jamais confirmés',
    requiredInDev: false,
  },
  {
    name: 'STRIPE_PRICE_AGENT_MONTHLY',
    consequence: 'l’offre Agent seul en mensuel n’est pas souscriptible',
    requiredInDev: false,
  },
  {
    name: 'STRIPE_PRICE_AGENT_ANNUAL',
    consequence: 'l’offre Agent seul en annuel n’est pas souscriptible',
    requiredInDev: false,
  },
  {
    name: 'STRIPE_PRICE_SYSTEME_MONTHLY',
    consequence: 'l’offre Système seul en mensuel n’est pas souscriptible',
    requiredInDev: false,
  },
  {
    name: 'STRIPE_PRICE_SYSTEME_ANNUAL',
    consequence: 'l’offre Système seul en annuel n’est pas souscriptible',
    requiredInDev: false,
  },
  {
    name: 'STRIPE_PRICE_COMPLET_MONTHLY',
    consequence: 'l’offre Pack complet en mensuel n’est pas souscriptible',
    requiredInDev: false,
  },
  {
    name: 'STRIPE_PRICE_COMPLET_ANNUAL',
    consequence: 'l’offre Pack complet en annuel n’est pas souscriptible',
    requiredInDev: false,
  },
  {
    name: 'CRON_SECRET',
    consequence: 'aucune tâche planifiée ne s’exécute : ni analyse, ni relance, ni avis',
    requiredInDev: false,
  },
  {
    name: 'INSEE_API_KEY',
    consequence: 'aucune analyse de secteur n’aboutit',
    requiredInDev: false,
  },
  {
    name: 'RESEND_API_KEY',
    consequence:
      'l’analyse aboutit mais aucun rapport n’est envoyé — le professionnel ne reçoit rien',
    requiredInDev: false,
  },
  {
    /*
     * Le repli `onboarding@resend.dev` n'est pas seulement mauvais pour la
     * réputation : ce domaine partagé ne livre qu'à l'adresse du compte
     * Resend. Sans cette variable, aucun rapport de secteur ni aucune
     * confirmation de réservation n'atteint son destinataire.
     */
    name: 'BOOKING_FROM_EMAIL',
    consequence:
      'repli sur un domaine de test qui ne livre qu’au propriétaire du compte Resend : les rapports et confirmations n’arrivent chez personne',
    requiredInDev: false,
  },
  {
    /*
     * Les trois variables ci-dessous manquaient à ce recensement, et c'est
     * précisément pour cela que leur absence en production est passée
     * inaperçue jusqu'au 22/08/2026 : `npm run check:env` répondait « tout
     * va bien » alors que les formulaires répondaient 503 depuis la mise en
     * ligne. Un contrôle incomplet est plus dangereux qu'un contrôle absent,
     * parce qu'on lui fait confiance.
     */
    name: 'CONTACT_TO_EMAIL',
    consequence: 'les formulaires de contact et d’estimation répondent 503 : aucun message ne vous parvient',
    requiredInDev: false,
  },
  {
    name: 'CONTACT_FROM_EMAIL',
    consequence:
      'même effet, plus la perte silencieuse des confirmations de demande de zone et des relances d’abonnement',
    requiredInDev: false,
  },
  {
    name: 'RESEND_WEBHOOK_SECRET',
    consequence:
      'aucun rebond ni aucune plainte n’alimente la liste de suppression : Hermès continue d’écrire à des adresses mortes',
    requiredInDev: false,
  },
  {
    /*
     * Adresse d'expédition d'Hermès. Elle doit pointer vers un **sous-domaine
     * dédié** (`contact.qualifyragence.com`), distinct de celui des factures
     * et des confirmations de réservation.
     *
     * La raison n'est pas cosmétique : la réputation d'expéditeur se calcule
     * par domaine. Si la prospection fait chuter celle du domaine principal,
     * ce ne sont pas seulement les messages de démarchage qui tombent en
     * indésirables — ce sont les confirmations de rendez-vous et les factures
     * de tous les professionnels. Deux domaines, deux réputations : l'une peut
     * brûler sans emporter l'autre.
     *
     * Son absence n'est pas un repli sur `BOOKING_FROM_EMAIL` : la route
     * refuse d'envoyer, car ce repli serait exactement la contamination qu'on
     * cherche à éviter.
     */
    name: 'HERMES_FROM_EMAIL',
    consequence:
      'la prospection Hermès n’envoie rien — aucun repli sur le domaine transactionnel, pour ne pas exposer sa réputation',
    requiredInDev: false,
  },
];

export type EnvCheckResult = {
  readonly ok: boolean;
  readonly missing: readonly EnvRequirement[];
};

/**
 * Vérifie la présence — jamais la valeur — des variables requises.
 *
 * @param env Table des variables. Injectée plutôt que lue depuis
 *   `process.env`, ce qui rend la fonction testable sans toucher au
 *   processus courant.
 * @param mode `production` exige tout ; `development` n'exige que le
 *   strict nécessaire au démarrage local.
 */
export function checkEnv(
  env: Readonly<Record<string, string | undefined>>,
  mode: 'development' | 'production',
): EnvCheckResult {
  const missing = REQUIRED_ENV.filter((requirement) => {
    if (mode === 'development' && !requirement.requiredInDev) return false;
    const value = env[requirement.name];
    return value === undefined || value.trim() === '';
  });

  return { ok: missing.length === 0, missing };
}
