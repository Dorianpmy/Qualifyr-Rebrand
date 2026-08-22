# 12 — Mise en conformité avant production : rapport final

Chantier exécuté le 22/08/2026, à partir de l'audit `docs/11-audit-pre-production.md`.

**Ce document n'est pas un résumé de l'audit.** Il dit ce qui a été fait, ce qui
a été vérifié, et ce qui reste bloquant. L'audit reste la référence pour le
constat ; celui-ci l'est pour l'état du code.

---

## 1. Ce qui a changé, et pourquoi

### 1.1 Les promesses commerciales

Retirées, faute d'implémentation :

| Promesse | Où elle était | Pourquoi elle était fausse |
|---|---|---|
| « Les rendez-vous trouvés par l'agent atterrissent dans le même agenda » | `DarkPricing`, `FeatureComparisonTable` | L'agent n'écrit que dans `agent_prospects`. Aucun code ne relie cette table à `detailer_bookings` |
| « Chaque refus lui apprend qui vous fait perdre du temps » | `AgentFlow` | Aucun mécanisme de rétroaction n'existe |
| « Il apprend votre terrain » | `AgentGrid` | Idem |
| « Il répond avant vous », « le premier message part sans vous » | `AgentGrid` | Aucun modèle de langage n'est appelé nulle part dans le projet |
| « Répond aux premières questions » | `services-content`, `/fonctionnalites` | Idem |
| « Il démarche votre secteur » | page d'accueil, `TrustStrip`, `/app/prospection`, `services-content` | Aucun envoi sortant vers un prospect. Le seul e-mail part **vers le professionnel** |
| « Vous n'avez plus à démarcher » | `TrustStrip` | L'agent produit la liste ; les appels restent à faire |

Reformulées :

| Avant | Après | Raison |
|---|---|---|
| « Toutes vos communes » | « Les codes postaux voisins de votre zone » | `nearbyPostalCodes()` prend le code postal ±1 et ignore le rayon en km (`void radiusKm`) |
| « L'agent IA » | « L'agent » | Rien ici ne relève de l'intelligence artificielle |
| Nœud « Créneau réservé — 289 € — Acompte encaissé » | « Rapport de secteur — par e-mail » | C'était la représentation la plus trompeuse du site : le schéma faisait aboutir l'agent à une réservation payée |

Les cellules remplacées décrivent des faits vérifiables : le décompte par
segment produit par `reportHtml()`, et la traçabilité des lignes (SIRET, code
d'activité, commune) stockée par la migration 010.

### 1.2 Le modèle d'abonnement

`supabase/migrations/015_subscriptions.sql`, idempotente.

Table `subscriptions` rattachée à **`auth.users`**, et non à `detailers` : un
abonné « Agent seul » ne vend rien, n'a donc pas de fiche detailer, et
n'aurait pas pu être provisionné autrement.

- contraintes `check` sur `plan` et `status` — plutôt qu'un type énuméré, qu'on
  ne peut pas étendre dans la même transaction que son usage ;
- index sur `owner_id`, `stripe_customer_id`, `status` ;
- **index unique partiel sur `stripe_subscription_id`** — c'est lui qui rend le
  webhook idempotent ;
- **unicité d'un seul abonnement vivant par propriétaire** (`trialing`,
  `active`, `past_due`), les états terminaux restant empilables pour conserver
  l'historique ;
- `updated_at` tenu par un déclencheur, pas par l'application ;
- RLS : **lecture seule pour le propriétaire, écriture pour personne.** Accorder
  une écriture, même restreinte à ses propres lignes, permettrait à un client de
  passer son plan de `agent` à `complete` depuis son navigateur. Seule la clé de
  service écrit, et elle ne vit que dans le webhook.

### 1.3 Le provisioning

`api/billing/webhook/route.ts` + `lib/billing/provisioning.ts`.

Avant : la route journalisait et s'arrêtait. Un client payait, Stripe
encaissait, et **rien** ne se passait côté Qualifyr.

Maintenant :

1. signature vérifiée ;
2. l'événement est traduit en ligne d'abonnement par une fonction **pure**
   (`buildSubscriptionRow`), ce qui rend la partie délicate testable sans
   environnement ;
3. le compte est retrouvé par identifiant client Stripe, puis à défaut par
   e-mail (comparaison en minuscules) ;
4. écriture en `upsert` sur `stripe_subscription_id` — rejouer un événement met
   la ligne à jour au lieu d'en créer une seconde ;
5. `customer.subscription.created` et `invoice.payment_failed` sont désormais
   traités ; une résiliation met le statut à jour et **ne supprime rien**.

**Deux refus explicites**, tous deux journalisés sans accorder de droit :

- plan illisible (métadonnée absente **et** prix inconnu) — choisir un plan par
  défaut aurait été la faille la plus coûteuse du système ;
- compte introuvable — accorder l'accès au mauvais compte est pire que de n'en
  accorder aucun.

### 1.4 Le système de permissions

`lib/billing/entitlements.ts` — une seule autorité, partagée par le serveur et
l'interface.

`canAccess(entitlement, capability, { write })` **refuse par défaut** sur toutes
ses sorties : pas d'abonnement, plan inconnu, capacité inconnue, statut
terminal. L'option `write` vaut `true` par défaut, pour qu'un appel négligent
n'ouvre pas plus qu'un appel explicite.

Fichiers : `plans.ts` (vocabulaire et traduction Stripe), `entitlements.ts`
(règle), `subscription.ts` (lecture en base), `guard.ts` (routes),
`page-guard.ts` (pages).

**Deux vocabulaires cohabitent, et c'est assumé.** Stripe porte les
identifiants français historiques (`complet`, `systeme`, et les noms de
variables `STRIPE_PRICE_SYSTEME_*`) ; la base porte `agent`, `system`,
`complete`. Les renommer côté Stripe aurait orphelin toute session de paiement
déjà créée. La traduction se fait dans `planFromStripe()`, en un seul endroit.

---

## 2. Matrice finale des permissions

| Capacité | Agent seul | Système seul | Pack complet |
|---|:--:|:--:|:--:|
| `agent.prospecting` | ✅ | ❌ | ✅ |
| `agent.report` | ✅ | ❌ | ✅ |
| `dashboard` | ❌ | ✅ | ✅ |
| `planning` | ❌ | ✅ | ✅ |
| `services` | ❌ | ✅ | ✅ |
| `booking.public` | ❌ | ✅ | ✅ |
| `payments.deposit` | ❌ | ✅ | ✅ |
| `invoices` | ❌ | ✅ | ✅ |
| `gallery` | ❌ | ✅ | ✅ |
| `booking.recovery` | ❌ | ✅ | ✅ |

### Comportement par statut

| Statut | Accès | Raison |
|---|---|---|
| `trialing` | Complet selon le plan | — |
| `active` | Complet selon le plan | — |
| `past_due` | **Maintenu**, avec avertissement | Une carte expirée est le cas le plus banal du paiement récurrent. Couper au premier échec ferait perdre un client qui n'a rien fait de mal ; Stripe réessaie plusieurs jours |
| `canceled` | **Lecture seule** | Une résiliation ne doit jamais faire disparaître un historique de factures |
| `unpaid`, `incomplete`, `incomplete_expired` | Bloqué | — |
| Aucun abonnement | Bloqué, avec invitation à choisir une offre | — |

---

## 3. Routes protégées

### Avec session (`requireCapability` → 401 / 403)

| Route | Capacité |
|---|---|
| `api/app/agent-zones` | `agent.prospecting` |
| `api/app/invoices` | `invoices` |
| `api/app/invoices/[id]/xml` | `invoices` |
| `api/app/cases` | `gallery` |
| `api/app/pricing` | `services` |
| `api/app/bookings/complete` | `dashboard` |
| `api/app/bookings/[id]/status` | `dashboard` |
| `api/app/stripe-connect` (2 verbes) | `payments.deposit` |

### Sans session — droit du **propriétaire de la fiche** (`detailerHasCapability`)

| Route | Capacité | Pourquoi ce contournement |
|---|---|---|
| `api/detailing/checkout` | `payments.deposit` | Le client final appelle la route ; le droit d'encaisser appartient au professionnel. Sans ce contrôle, un abonné « Agent seul » encaisserait via sa page publique |
| `api/detailing/booking-recovery` | `booking.recovery` | Appelée par le planificateur, sans utilisateur. Le contrôle se fait ligne par ligne, sur le propriétaire de chaque réservation |

### Volontairement non protégées

| Route | Raison |
|---|---|
| `api/agent/scan` | C'est l'offre d'appel vendue : « première zone gratuite, sans carte bancaire ». Exiger un abonnement supprimerait la promesse. L'abus est borné par une limite de débit, pas par un droit. La demande **depuis l'espace pro** passe, elle, par `api/app/agent-zones`, qui exige `agent.prospecting` |
| `api/agent/process` | Appelée par le planificateur avec un secret partagé, sur une file de zones **déjà autorisées à l'entrée** |

### Pages (`pageAccess` → redirection ou écran verrouillé)

`/app`, `/app/planning`, `/app/prestations`, `/app/invoices`, `/app/cases`,
`/app/prospection`. `/app/abonnement` reste **volontairement ouverte** : c'est
la seule page atteignable sans droit, sinon un compte sans abonnement se
retrouverait enfermé dehors sans rien pour agir.

`/app` redirige un abonné « Agent seul » vers `/app/prospection` plutôt que de
lui montrer un écran verrouillé juste après son paiement.

---

## 4. Interface

- **plan actif, statut et échéance** sur `/app/abonnement`, avec la liste de ce
  que l'offre inclut ;
- **écrans verrouillés** (`LockedModule`) qui disent *pourquoi*, pas seulement
  *que* — chaque cause a son message, et le cas « pas dans l'offre » nomme
  l'offre qui débloque ;
- **rien n'est masqué en silence** : la barre d'onglets continue d'afficher le
  module, et l'écran explique. Faire disparaître l'entrée aurait été plus propre
  visuellement, mais un client qui ne voit pas ce qu'il rate ne comprend pas la
  différence entre les offres qu'on lui vend ;
- **bouton de montée en gamme visible sans être insistant** : un lien bordé, pas
  un aplat plein ;
- **charte respectée** : fond sombre, texte clair, céladon pour l'avertissement.
  Aucun rouge, aucun orange, aucun jaune ajouté.

---

## 5. Fichiers modifiés

### Créés

| Fichier | Rôle |
|---|---|
| `supabase/migrations/015_subscriptions.sql` | Table `subscriptions`, contraintes, index, RLS |
| `src/lib/billing/plans.ts` | Plans, statuts, traduction Stripe → base |
| `src/lib/billing/entitlements.ts` | `canAccess` et la matrice |
| `src/lib/billing/subscription.ts` | Lecture de l'abonnement |
| `src/lib/billing/provisioning.ts` | Traduction d'un événement Stripe en ligne (fonction pure) |
| `src/lib/billing/guard.ts` | Garde des routes d'API |
| `src/lib/billing/page-guard.ts` | Garde des pages serveur |
| `src/components/app/LockedModule.tsx` | Écran d'un module verrouillé |
| `src/app/app/abonnement/page.tsx` | Plan, statut, échéance, contenu de l'offre |
| `src/content/terms.ts` | Texte des conditions générales de vente |
| `src/app/conditions-generales-de-vente/page.tsx` | Page CGV |
| `tests/entitlements.test.ts` | 30 tests |
| `tests/pricing-matches-entitlements.test.ts` | 3 tests |
| `docs/12-mise-en-conformite-rapport-final.md` | Ce document |

### Modifiés

**Marketing :** `DarkPricing.tsx`, `FeatureComparisonTable.tsx`, `AgentFlow.tsx`,
`AgentGrid.tsx`, `services-content.tsx`, `TrustStrip.tsx`,
`BeforeAfterSection.tsx`, `app/page.tsx`, `app/fonctionnalites/page.tsx`.

**Facturation :** `api/billing/webhook/route.ts`.

**Routes protégées :** `api/app/agent-zones`, `api/app/invoices`,
`api/app/invoices/[id]/xml`, `api/app/cases`, `api/app/pricing`,
`api/app/bookings/complete`, `api/app/bookings/[id]/status`,
`api/app/stripe-connect`, `api/detailing/checkout`,
`api/detailing/booking-recovery`.

**Documentation de routes :** `api/agent/scan`, `api/agent/process`.

**Pages protégées :** `app/app/page.tsx`, `app/app/planning`,
`app/app/prestations`, `app/app/invoices`, `app/app/cases`,
`app/app/prospection`.

**Divers :** `components/app/AppShell.tsx` (entrée Abonnement),
`content/site.ts`, `content/navigation.ts`, `types/index.ts` (route CGV).

---

## 6. Variables d'environnement

| Variable | Sans elle |
|---|---|
| `STRIPE_SECRET_KEY` | Aucun paiement |
| `STRIPE_PRICE_*` (6) | Erreur au clic sur « S'abonner » |
| `STRIPE_BILLING_WEBHOOK_SECRET` | Webhook en 503 → **aucun droit ne sera jamais accordé** |
| `SUPABASE_SERVICE_ROLE_KEY` | Le webhook ne peut pas écrire ; les droits ne peuvent pas être lus |
| `STRIPE_WEBHOOK_SECRET` | Acomptes clients jamais confirmés |
| `CRON_SECRET` | Aucune automatisation |
| `INSEE_API_KEY` | Aucune analyse de zone |
| `RESEND_API_KEY` | L'analyse aboutit, **aucun rapport n'est envoyé** |

**Le webhook doit être déclaré côté Stripe sur six événements :**
`checkout.session.completed`, `checkout.session.expired`,
`customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, `invoice.payment_failed`.

---

## 7. Tests

`npm run typecheck` ✅ · `npx vitest run` ✅ — **12 fichiers, 105 tests**.

| # de la demande | Scénario | Couvert |
|---|---|---|
| 1 | Un utilisateur `agent` n'accède pas au planning | ✅ |
| 2 | Un utilisateur `agent` n'appelle pas l'API des factures | ✅ (règle) |
| 3 | Un utilisateur `system` n'accède pas aux routes agent | ✅ |
| 4 | Un utilisateur `complete` accède à tout | ✅ |
| 5 | Sans abonnement : refus | ✅ |
| 6 | Abonnement résilié : lecture seule | ✅ |
| 7 | Un paiement produit une ligne exploitable | ✅ |
| 8 | Deux fois le même webhook : pas de doublon | ✅ (déterminisme + contrainte SQL) |
| 9 | Pas d'accès aux données d'un autre propriétaire | ⚠️ voir ci-dessous |
| 10 | Les cartes tarifaires correspondent aux permissions | ✅ |

**Ce que les tests ne couvrent pas, et pourquoi.** Ils portent sur la règle
d'accès, pas sur un appel HTTP réel : la décision d'autoriser vit entièrement
dans `canAccess`, une fonction pure, et les gardes ne font que la transporter.
Vérifier un `403` réel demanderait un environnement Supabase et Stripe, absent
de cette suite.

Le point 9 (isolation entre propriétaires) repose sur trois mécanismes en place
mais non testés automatiquement : le filtre `owner_id` de `getEntitlement`, la
politique RLS de la migration 015, et les filtres `detailer_id` déjà présents
dans les routes. **À vérifier manuellement avec deux comptes** avant ouverture.

---

## 8. Ce qui reste bloquant

| # | Point | Qui |
|---|---|---|
| 1 | **Appliquer la migration 015** en production. Sans elle, `getEntitlement` échoue et **tout est refusé** | Dorian |
| 2 | Déclarer le webhook sur les six événements et poser `STRIPE_BILLING_WEBHOOK_SECRET` | Dorian |
| 3 | Créer les six Prices Stripe et renseigner les variables | Dorian |
| 4 | **Tester un paiement de bout en bout en environnement de test** : payer → vérifier la ligne en base → vérifier l'accès | Dorian |
| 5 | Vérifier l'isolation avec deux comptes distincts (point 9 ci-dessus) | Dorian |
| 6 | Faire relire les CGV par un professionnel du droit, en particulier sur le droit de rétractation | Dorian |
| 7 | Décider du sort de `places.ts` et `email-extract.ts` : finir ou supprimer | Dorian |

**Un compte existant n'a aujourd'hui aucun abonnement en base — il perdra donc
l'accès dès la migration appliquée.** C'est le comportement voulu (refus par
défaut), mais il faut créer sa ligne `subscriptions` à la main avant, sans quoi
le compte de test se retrouvera verrouillé.

---

## 9. Checklist avant mise en production

### Bloquant

- [ ] Migration 015 appliquée en production
- [ ] Ligne `subscriptions` créée pour les comptes existants
- [ ] Six Prices Stripe créés et variables renseignées
- [ ] Webhook déclaré sur les six événements + secret posé
- [ ] `SUPABASE_SERVICE_ROLE_KEY` posée
- [ ] Paiement de test complet : payer → ligne en base → accès ouvert
- [ ] Un compte « Agent seul » ne peut atteindre ni `/app/invoices`, ni son API
- [ ] Un compte « Système seul » ne peut atteindre ni `/app/prospection`, ni son API
- [ ] Un compte « Pack complet » conserve tous ses accès
- [ ] Isolation vérifiée avec deux comptes

### Important

- [ ] `CRON_SECRET`, `INSEE_API_KEY`, `RESEND_API_KEY` posées et testées
- [ ] Planificateurs vérifiés en production
- [ ] CGV relues par un juriste
- [ ] Comportement vérifié sur un paiement échoué et une résiliation

### Déjà fait

- [x] Promesses commerciales alignées sur le produit réel
- [x] Table d'abonnements, contraintes, index, RLS
- [x] Provisioning idempotent avec refus explicites
- [x] Permissions centralisées, refus par défaut
- [x] Contrôle serveur sur toutes les routes de la matrice
- [x] Écrans verrouillés, page d'abonnement, redirections
- [x] CGV publiées et liées depuis le pied de page
- [x] Mentions légales complètes (`legalNoticeIsComplete()` renvoie `true`)
- [x] 105 tests au vert
