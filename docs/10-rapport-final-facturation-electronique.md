# 10 — Rapport final : facturation électronique & Stripe (22/08/2026)

Rapport de synthèse, structuré sur les 12 points demandés. S'appuie sur `docs/08-...` et
`docs/09-...` (recherche déjà faite) et les complète sur les points 7-8 (solution retenue,
coûts). **Aucun fichier n'a été modifié, aucune migration lancée.** L'implémentation
n'a pas commencé et n'attend que : *« J'autorise l'implémentation en environnement de
test. »*

---

## 1. Architecture Stripe actuelle

- **Stripe Checkout** (page hébergée) en **mode `subscription`**, ce qui active
  automatiquement **Stripe Billing** côté Stripe (Customer + Subscription + Invoice
  générés à chaque cycle, sans configuration supplémentaire — confirmé par la doc Stripe
  officielle).
- Appels en REST direct, sans SDK (`src/lib/billing/stripe.ts`).
- Aucune collecte fiscale à la session (`billing_address_collection`, `tax_id_collection`,
  `automatic_tax` : absents des trois).
- Compte Stripe direct (pas Connect) — l'argent des abonnements va directement au compte
  Stripe de Qualifyr. À ne pas confondre avec `lib/detailing/stripe.ts`, qui gère les
  acomptes des clients finaux sur les comptes Connect des laveurs auto — hors périmètre de
  ce rapport.

## 2. Fichiers qui seront modifiés (si tu autorises E2)

Aucun modifié à ce jour. Liste prévisionnelle, en attente d'autorisation :

| Fichier | Nature du changement |
|---|---|
| `src/lib/billing/stripe.ts` | Ajout `billing_address_collection: 'required'`, `tax_id_collection[enabled]: true`, `custom_fields` (raison sociale) à `createSubscriptionCheckout` |
| `src/app/api/billing/webhook/route.ts` | Ajout des événements `invoice.finalized`, `invoice.paid`, `invoice.payment_failed`, `credit_note.created` à `handled`, et appel du connecteur |
| `src/lib/billing/pennylane.ts` *(nouveau)* | Client API vers Pennylane (pas de SDK, REST direct, même discipline que `stripe.ts`) |
| `src/content/company.ts` | Renseigner `legalForm`, `registrationNumber`, `vatNumber`, `address` — **préalable indépendant de Stripe, bloquant pour les mentions légales du site** |
| `docs/07-informations-legales-requises.md` | Mise à jour une fois `company.ts` renseigné |
| `.env.example` | Documentation des nouvelles variables (voir point 8) |

## 3. Migrations de base de données prévues

Une seule table nouvelle, Supabase, nom provisoire `invoices` :

```
invoices
  id                   uuid, pk
  stripe_invoice_id    text, unique   -- idempotence : upsert sur cette colonne
  stripe_subscription_id text
  external_provider    text           -- ex. 'pennylane'
  external_id           text           -- identifiant renvoyé par la plateforme
  status                text           -- draft | sent | acknowledged | error
  amount_ht             numeric
  amount_tva            numeric
  amount_ttc            numeric
  pdf_url               text
  acknowledged_at        timestamptz
  created_at             timestamptz default now()
```

Schéma exact à affiner une fois l'API Pennylane consultée en détail (les champs qu'elle
retourne peuvent différer légèrement) — **aucune migration n'est lancée avant ton
autorisation explicite**, et la première le sera d'abord sur une branche Supabase de test,
pas sur la base de production.

## 4. Webhooks Stripe utilisés

**Aujourd'hui** (`src/app/api/billing/webhook/route.ts`, endpoint séparé de celui des
acomptes clients, secret `STRIPE_BILLING_WEBHOOK_SECRET`) :
`checkout.session.completed`, `customer.subscription.updated`,
`customer.subscription.deleted`, `checkout.session.expired`.

**À ajouter** pour la facturation légale : `invoice.finalized` (déclenche l'envoi vers
Pennylane), `invoice.paid` (confirme le règlement), `invoice.payment_failed` (déclenche une
relance, pas un envoi), `credit_note.created` (avoirs, voir point 5).

**Rappel non résolu depuis `docs/09`** : la configuration réelle du Dashboard Stripe
(quels événements sont effectivement cochés sur l'endpoint) n'a pas pu être revérifiée
depuis cet environnement — à confirmer avant d'ajouter les nouveaux événements au code,
sans quoi ils seraient traités par du code mais jamais reçus.

## 5. Flux complet — création, paiement, remboursement, avoir

**Création & paiement (existant, inchangé)**
1. `POST /api/billing/checkout` → session Stripe Checkout.
2. Paiement sur la page Stripe. Stripe crée `Customer` + `Subscription` + `Invoice`.
3. Webhook `checkout.session.completed` : log + analytics (déjà en place).

**Facturation légale (nouveau, si E2 autorisée)**
4. Webhook `invoice.finalized` → le connecteur transmet les données à Pennylane →
   écriture dans `invoices` (statut `sent`).
5. Webhook `invoice.paid` → mise à jour du statut dans `invoices` (`acknowledged` une fois
   la confirmation de réception obtenue de Pennylane, si l'API le permet).

**Paiement échoué**
6. Webhook `invoice.payment_failed` → pas de transmission à Pennylane (rien à facturer
   tant que ce n'est pas payé) ; Stripe gère nativement les tentatives de relance
   (Smart Retries, si activé côté Dashboard — à vérifier, hors code).

**Remboursement**
7. Un remboursement Stripe (`charge.refunded` — **événement actuellement non écouté, à
   ajouter s'il doit déclencher un avoir**) ne modifie pas automatiquement la facture déjà
   transmise à la plateforme agréée. Il faut un avoir explicite (point suivant).

**Avoir**
8. Un avoir (`credit_note`) doit être créé côté Stripe (API Credit Notes) **et** transmis à
   Pennylane comme document lié à la facture d'origine — jamais une simple suppression ou
   modification de la facture initiale (la numérotation doit rester non destructive, voir
   point 9 de `docs/08`). Ce flux n'existe pas encore et doit être conçu avec le connecteur.

## 6. Données client obligatoires manquantes

Confirmé (`src/app/api/billing/checkout/route.ts`, `bodySchema`) : seuls `plan`,
`cadence`, et un `email` optionnel sont collectés aujourd'hui. Manquent, pour une facture
conforme :

- Raison sociale / nom du client
- Adresse de facturation complète
- SIRET (identifiant de l'entreprise cliente)
- Numéro de TVA intracommunautaire (si le client est un professionnel assujetti dans un
  autre État membre — pertinent puisque le site facture aussi en CHF, donc a minima des
  clients hors UE dont le régime de TVA diffère)
- Statut B2B/B2C explicite (aujourd'hui implicite, jamais déclaré)

Stripe sait collecter tout cela nativement à la session Checkout
(`billing_address_collection`, `tax_id_collection`, `custom_fields`) — un changement de
configuration, pas un nouveau système à construire.

## 7. Solution de plateforme agréée retenue, avec vérification DGFiP

**Solution retenue pour la recommandation : Pennylane.**

Justification, avec sources vérifiées de première main aujourd'hui :

- **Immatriculation DGFiP confirmée** deux fois : sur le PDF officiel « Liste des
  opérateurs satisfaisant à l'ensemble des conditions, incluant les tests
  d'interopérabilité » ([impots.gouv.fr](https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees),
  entrée « PENNYLANE », immatriculée le 11/12/2025), et sur le badge officiel « Plateforme
  agréée » que Pennylane affiche elle-même sur ses pages `tarifs` et `integrations/stripe-billing`.
- **Partenariat Stripe confirmé de première main** : Pennylane publie une page dédiée
  [« Stripe Billing x Pennylane »](https://www.pennylane.com/fr/integrations/stripe-billing)
  sur son propre site, nommant explicitement Stripe Billing (pas juste « Stripe » générique)
  comme partenaire technique. Ce n'est pas une déduction depuis un blog tiers.
- **Nuance technique importante, à vérifier avant contractualisation** : d'après le centre
  d'aide officiel Pennylane, le connecteur Stripe documenté fonctionne dans le sens
  **Stripe → Pennylane** — il récupère les transactions et factures déjà générées par
  Stripe dans le module Ventes de Pennylane. Cela suffit pour la comptabilité et la
  réconciliation, mais **je n'ai pas pu confirmer si ce flux transmet automatiquement une
  facture au format conforme (Factur-X) via le canal PDP, ou s'il faut créer/finaliser la
  facture directement dans Pennylane (en rapprochant seulement le paiement Stripe) pour
  bénéficier de la transmission réglementaire.** C'est la première question à poser au
  support Pennylane avant de t'engager — je ne veux pas trancher ce point sur une simple
  supposition.

**Solutions alternatives, également immatriculées** (au cas où la nuance ci-dessus s'avère
bloquante) : Tiime (18/12/2025), Indy (09/01/2026), Qonto (18/12/2025) — toutes trois
confirmées sur le même PDF officiel, toutes trois des outils de facturation/comptabilité
que des TPE utilisent déjà, donc avec la même logique de consolidation d'outils.

## 8. Coûts et limites de cette solution

**Coûts** (source primaire : [pennylane.com/fr/tarifs](https://www.pennylane.com/fr/tarifs), consultée aujourd'hui) :

| Plan | Prix HT/mois | Pertinent si |
|---|---|---|
| **0 €** | Gratuit | Qualifyr est une micro-entreprise (statut à confirmer, point D de `docs/08`) — inclut réception/émission conforme, jusqu'à 1200 factures/an |
| Starter | 7 € | Indépendant, besoins basiques |
| Basique | 14 € | + acomptes, factures partielles |
| Essentiel | 24 € | + relances automatisées, API et intégrations |

Tous les plans (y compris gratuit) incluent la facturation électronique conforme, sans
surcoût. Sans engagement, résiliable à tout moment — cohérent avec le besoin de
réversibilité (point 12).

**Limites connues** :
- Plafond de 1200 factures/an sur tous les plans payants listés — à surveiller si le volume
  d'abonnements Qualifyr croît fortement (au-delà, contact commercial nécessaire, tarif non
  public).
- La nuance du point 7 (sens de la synchronisation Stripe → Pennylane) peut impliquer un
  changement de processus (facturer depuis Pennylane plutôt que laisser Stripe le faire
  seul) — impact à chiffrer une fois la question posée au support.
- Développement du connecteur (`src/lib/billing/pennylane.ts`) et de la table `invoices`
  non chiffrés ici (dépend du temps de développement, pas un coût Pennylane).

## 9. Risques fiscaux, techniques et RGPD

**Fiscaux** — *tous à valider par ton expert-comptable, aucun ne doit être tranché depuis
ce rapport* :
- Statut TVA non tranché (assujetti / franchise en base) : bloque le choix des mentions
  obligatoires exactes.
- Échéance d'émission réelle (1er septembre 2027 si PME/TPE/micro — à confirmer avec ta
  forme juridique et ton chiffre d'affaires).
- Sanctions en cas de non-conformité : 15 €/facture non conforme (plafond 15 000 €/an),
  250 €/transmission e-reporting manquante (plafond 45 000 €/an) — chiffres du décret
  d'application, à faire confirmer par ton expert-comptable pour ta situation précise.

**Techniques** :
- Double source de vérité (Stripe = paiement, Pennylane = facture légale) : sans
  réconciliation surveillée, une facture peut échouer côté Pennylane sans que Qualifyr
  s'en aperçoive — d'où la table `invoices` et son statut `error` prévu au point 3.
- Le webhook Stripe doit répondre 200 même si l'appel sortant vers Pennylane échoue
  (sinon Stripe considère le webhook en échec et peut le désactiver après trop d'échecs
  consécutifs) — la logique de réessai doit vivre côté connecteur, pas bloquer la réponse
  au webhook.
- Idempotence : `upsert` sur `stripe_invoice_id`, jamais un `insert` (un événement Stripe
  peut arriver plus d'une fois).

**RGPD** :
- Transmettre des données de facturation (nom, adresse, SIRET) à Pennylane constitue un
  nouveau flux vers un sous-traitant — `src/content/company.ts` liste `processors` (voir
  `docs/07-...`) devra être mis à jour avec Pennylane (finalité, lieu de traitement).
  Pennylane est une société française (contrairement à Resend/Vercel, déjà signalés comme
  hors UE dans `docs/07-...`) — pas de clause de transfert hors UE à rédiger pour ce
  sous-traitant précis.
- Minimisation : ne transmettre que les champs strictement nécessaires à la facture
  (pas l'historique de navigation, pas de données au-delà de l'identité de facturation).

## 10. Points nécessitant obligatoirement la validation de ton expert-comptable

1. Forme juridique exacte et statut TVA (assujetti / franchise en base / exonéré).
2. Répartition réelle de la clientèle B2B France / B2C / UE / hors UE.
3. Date exacte à laquelle l'obligation d'émission s'applique à Qualifyr (dépend de 1 et du
   chiffre d'affaires).
4. Les mentions obligatoires exactes selon le statut retenu — la liste du point 4 de
   `docs/08-...` est indicative, pas une liste arrêtée avec autorité juridique.
5. Le choix définitif entre le plan gratuit Pennylane (si micro-entreprise) et un plan
   payant, une fois 1 tranché.
6. La nuance de synchronisation Stripe → Pennylane (point 7) — la réponse du support
   Pennylane devrait idéalement être revue avec ton expert-comptable avant engagement, pas
   seulement techniquement.

## 11. Plan de déploiement en environnement de test

Toutes les étapes suivantes utilisent exclusivement des **clés Stripe de test**
(`sk_test_...`) et des **données fictives** — aucune ne touche la production tant que tu
n'as pas donné l'autorisation explicite pour cette phase, puis une autorisation séparée
pour la bascule en production.

1. Créer un compte Pennylane d'essai (15 jours gratuits, sans engagement, confirmé sur
   leur page tarifs) — pas de carte bancaire requise à ce stade d'après leur FAQ publique.
2. Ajouter `billing_address_collection`/`tax_id_collection`/`custom_fields` à
   `createSubscriptionCheckout`, déployé sur une branche, testé avec le compte Stripe en
   mode Test uniquement.
3. Passer une session Checkout de test complète (carte de test Stripe `4242 4242 4242 4242`,
   raison sociale et SIRET fictifs) → vérifier que ces champs apparaissent sur la facture
   Stripe de test générée.
4. Étendre le webhook avec les nouveaux événements, derrière `BILLING_PROVIDER_ENABLED=false`
   par défaut même en test, pour valider le déploiement sans déclencher d'appel sortant.
5. Basculer `BILLING_PROVIDER_ENABLED=true` en test uniquement, rejouer l'événement via
   `stripe trigger invoice.finalized` (Stripe CLI, mode test) et vérifier l'écriture dans
   `invoices` + l'appel vers l'environnement sandbox Pennylane (si disponible — à confirmer
   avec leur documentation API).
6. Simuler un paiement échoué et un avoir de test, vérifier qu'aucun des deux ne casse le
   webhook existant.
7. Rejouer deux fois le même événement de test, vérifier l'absence de duplication dans
   `invoices` (idempotence).
8. Revue manuelle des résultats avec toi avant toute discussion de bascule en production.

## 12. Plan de retour arrière

- **Avant l'étape 2** : aucun changement n'existe encore, rien à annuler.
- **Entre les étapes 2 et 4** : les nouveaux champs Checkout (`billing_address_collection`
  etc.) sont un ajout de configuration, sans effet sur le flux de paiement existant — un
  retrait de ces lignes dans `lib/billing/stripe.ts` suffit à revenir à l'état actuel,
  déployable en un commit.
- **À partir de l'étape 5** : `BILLING_PROVIDER_ENABLED=false` désactive immédiatement
  tout appel sortant vers Pennylane, sans redéploiement — Stripe continue de facturer
  normalement, seule la transmission externe s'arrête. C'est le mécanisme de retour arrière
  principal, testé dès l'environnement de test.
- **Table `invoices`** : additive, ne modifie ni ne supprime aucune table existante — un
  retour arrière peut la laisser en place sans risque (elle reste vide/inutilisée si le
  connecteur est désactivé).
- **Aucune étape ne modifie ni ne supprime de données déjà écrites côté Stripe.**

---

**Statut : en attente.** Aucun fichier modifié, aucune migration lancée. J'implémente
uniquement en environnement de test, uniquement après avoir lu de ta part :
*« J'autorise l'implémentation en environnement de test. »*
