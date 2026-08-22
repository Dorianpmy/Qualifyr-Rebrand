# 09 — Audit facturation électronique, approfondi (22/08/2026)

Suite de `docs/08-audit-facturation-electronique.md`, sur les 10 points demandés.
**Toujours aucun code modifié.** Sources primaires uniquement (documentation Stripe,
impots.gouv.fr) — les points qui reposent sur des sources secondaires sont marqués
comme tels, pas présentés comme confirmés.

---

## 1. Confirmation exacte : Stripe Checkout et Stripe Billing

Confirmé par lecture du code (`src/lib/billing/stripe.ts`, `createSubscriptionCheckout`)
et par la documentation Stripe officielle (`docs.stripe.com/receipts`, `docs.stripe.com/billing`) :

- La session est créée avec `mode: 'subscription'` sur l'endpoint `/v1/checkout/sessions`.
  C'est **Stripe Checkout** — la page de paiement hébergée.
- Un `mode: 'subscription'` fait automatiquement intervenir **Stripe Billing** : Stripe crée
  le `Customer`, la `Subscription`, et génère une `Invoice` à chaque échéance — c'est le
  comportement par défaut de l'API, pas une option à activer séparément. Citation de la doc
  Stripe : *« For subscriptions, Stripe generates invoices automatically »*.
- Ce n'est **pas** la fonctionnalité « Stripe Invoicing » au sens de facture personnalisée/
  autonome (créée manuellement via l'API Invoices, hors abonnement) — ici les factures sont
  un sous-produit de l'abonnement, avec le template et les réglages par défaut du compte.

## 2. Schéma des événements reçus par les webhooks

**Ce que le code traite** (`src/app/api/billing/webhook/route.ts`, tableau `handled`) :

| Événement | Traitement actuel |
|---|---|
| `checkout.session.completed` | Log + événement analytics `payment_completed`. Aucune écriture de facture. |
| `customer.subscription.updated` | Log + événement analytics `subscription_updated`. |
| `customer.subscription.deleted` | Log + événement analytics `subscription_updated`. Pas de révocation d'accès (aucun accès `/app` n'est encore lié à un abonnement). |
| `checkout.session.expired` | Relance par e-mail si consentement — inerte aujourd'hui (voir `docs/08...`, `consent_collection.promotions` retiré). |
| Tout autre type | Accepté silencieusement (`{ received: true }`), sans traitement — évite que Stripe ne rejoue indéfiniment un événement volontairement ignoré. |

**Ce que je ne peux pas confirmer depuis cet environnement** : la liste exacte des
événements **cochés dans le Dashboard Stripe** pour l'endpoint de webhook — c'est une
configuration côté Dashboard, indépendante du code, et je n'ai pas d'accès Stripe direct
ici. D'après l'historique de cette session (travail effectué plus tôt via Claude Code en
local), l'endpoint « QualifyrNettoyage » avait été configuré avec exactement ces 4
événements — mais **à reconfirmer en direct**, un événement peut avoir été ajouté/retiré
depuis. Aucun événement `invoice.*` (`invoice.paid`, `invoice.payment_failed`,
`invoice.finalized`) n'est aujourd'hui écouté : c'est un manque si une solution de
facturation légale doit se déclencher sur la finalisation réelle d'une facture plutôt que
sur le paiement de la session Checkout.

## 3. Confirmation de la génération actuelle des factures Stripe

Confirmé par la doc Stripe : les abonnements génèrent une facture Stripe automatiquement
à chaque cycle (`Invoice` object). Ce que je **ne peux pas confirmer sans accès au
Dashboard Stripe** :

- Si l'envoi automatique de la facture au client est activé (Dashboard → **Settings → Business → Customer emails** → bascule « Successful payments »). Si elle est désactivée, la facture existe côté Stripe mais n'est jamais transmise au client.
- Si les informations affichées (Dashboard → **Settings → Business → Business details → Public details**) sont renseignées : nom légal, adresse de support, e-mail de support, URL de politique de confidentialité — la doc Stripe les liste comme obligatoires *pour compliance reasons* sur tout reçu/facture émis, indépendamment de la réforme française.

**Point de confusion à éviter** : `src/content/company.ts` (toujours vide, voir `docs/07...`)
n'a **aucun effet** sur les factures Stripe. Ce fichier alimente uniquement les mentions
légales du **site web** Qualifyr. Les factures Stripe tirent leurs informations du
Dashboard Stripe lui-même (**Settings → Business**), un réglage entièrement séparé. Les
deux doivent être renseignés, indépendamment l'un de l'autre.

## 4. Mentions obligatoires — présentes ou absentes

D'après les exigences déclaratives standards pour une facture française (art. 242 nonies A
du CGI — **à faire valider par un expert-comptable**, je ne suis pas qualifié pour arrêter
cette liste avec autorité juridique) :

| Mention | Statut connu | Source |
|---|---|---|
| Identité du vendeur (nom, forme juridique, adresse) | **Inconnu/absent** côté Dashboard Stripe (non vérifié), **absent** côté site (`company.ts` vide) | À vérifier dans Stripe |
| SIREN/SIRET du vendeur | Absent des deux | — |
| Numéro de TVA intracommunautaire du vendeur (si assujetti) ou mention de franchise en base | Absent des deux — **dépend du statut fiscal, non tranché (docs/08, point D.3)** | — |
| Identité de l'acheteur (nom/raison sociale, adresse) | **Non collecté** à la session Checkout (aucun `billing_address_collection`) | Code |
| N° de TVA intracommunautaire de l'acheteur, si B2B UE | **Non collecté** (`tax_id_collection` absent) | Code |
| Date de la facture | Généré par Stripe automatiquement | Comportement Stripe par défaut |
| Numéro de facture unique et chronologique | Généré par Stripe (numérotation Stripe, pas une numérotation Qualifyr propre) | Comportement Stripe par défaut |
| Désignation du produit/service | Généré à partir du nom du Price Stripe | Code (`lib/billing/stripe.ts`) |
| Prix unitaire HT, taux et montant de TVA, prix TTC | **Dépend de `automatic_tax`/Stripe Tax, non confirmé activé** | À vérifier dans Stripe |
| Mentions spécifiques micro-entreprise (« TVA non applicable, art. 293 B du CGI ») si applicable | Absent — dépend du statut fiscal | — |

## 5. Distinction des flux B2B France / B2C / UE / hors UE

Aujourd'hui, **aucune distinction n'existe dans le code**. Éléments factuels :

- Le prix affiché sur le site (EUR/CHF) est déterminé par géolocalisation IP côté
  visiteur (`src/lib/offer-configurator.ts`, `/api/pricing-region`) — **c'est un affichage
  de prix, pas une donnée transmise à Stripe ni une classification du client**.
- La session Checkout ne transmet aucun pays de facturation, aucun type de client
  (B2B/B2C), aucune donnée permettant de distinguer une vente France, UE ou hors UE au
  moment de la création.
- Si Stripe Tax n'est pas activé sur le compte (non confirmé), Stripe ne calcule ni
  n'applique de TVA différenciée selon la localisation du client.
- **Conséquence réglementaire** : l'e-invoicing obligatoire (PDP) ne concerne que le B2B
  France entre assujettis. Le B2C et l'international relèvent de l'e-reporting (données de
  transaction, pas d'échange de facture structurée). Sans savoir *qui* achète, il est
  aujourd'hui impossible de savoir quelle proportion de l'activité tombe sous quelle
  obligation — d'où l'importance du point D (docs/08) et du point 6 ci-dessous.

## 6. Données client manquantes

Confirmé par lecture de `bodySchema` (`src/app/api/billing/checkout/route.ts`) : seuls
`plan`, `cadence`, et un `email` optionnel sont reçus. **Aucune** des données suivantes
n'est collectée à ce jour :

- Raison sociale / nom légal du client
- Adresse de facturation complète
- SIREN/SIRET
- Numéro de TVA intracommunautaire
- Statut B2B/B2C (implicite : c'est un professionnel qui s'abonne à un SaaS professionnel, donc très probablement B2B — mais jamais déclaré explicitement nulle part)

Techniquement, Stripe Checkout sait collecter tout cela nativement, sans développement
côté Qualifyr, via des paramètres de session déjà documentés par Stripe :
`billing_address_collection: 'required'`, `tax_id_collection[enabled]: true`, et des
`custom_fields` pour la raison sociale. C'est un ajout de configuration, pas un nouveau
système — voir solution E1/E2 dans `docs/08...`.

## 7. Comparaison de solutions compatibles avec Stripe

Trois familles, illustrées avec des acteurs **vérifiés sur la liste officielle DGFiP**
(voir point 8) plutôt que choisis sur un article commercial :

### a. Outil comptable/facturation (déjà utilisé par beaucoup de TPE)
Des outils de comptabilité/facturation que beaucoup de micro-entreprises utilisent déjà
(Pennylane, Tiime, Indy, Qonto...) sont **eux-mêmes devenus plateformes agréées**. Le
principe : Qualifyr continuerait à utiliser Stripe pour le paiement, mais s'appuierait sur
l'outil de facturation/comptabilité (souvent déjà utilisé pour la propre comptabilité de
Qualifyr) pour émettre la facture légale et la transmettre.
- Avantage : un seul outil pour la compta ET la conformité facturation, pas de nouveau
  prestataire technique pur.
- Limite : l'intégration Stripe → outil comptable est parfois manuelle ou via Zapier/API
  tierce plutôt qu'un connecteur natif temps réel — à vérifier au cas par cas selon l'outil
  retenu.

### b. Plateforme agréée « pure » (spécialisée e-invoicing/API)
Des opérateurs spécialisés (ex. Billit, Yooz PDP, Esker, Généralement plus orientés
intégration technique que comptabilité) exposent une API dédiée à laquelle Qualifyr se
raccorderait directement depuis son webhook Stripe existant.
- Avantage : contrôle fin, pas de dépendance à un logiciel de compta que Qualifyr n'utilise
  pas forcément par ailleurs.
- Limite : demande le développement du connecteur (voir §9), même limité.

### c. Intégration via API / connecteur custom
Construire soi-même l'appel API vers la plateforme agréée choisie (peu importe laquelle),
déclenché par les événements `invoice.*` du webhook Stripe déjà en place. C'est la
mécanique commune aux deux familles ci-dessus dès qu'on regarde sous le capot — la vraie
question n'est pas « API ou pas API » mais **quel opérateur**, et si son intégration Stripe
existe déjà en marque blanche (ex. via le Stripe App Marketplace) ou doit être écrite à la
main.

**Non retenu comme confirmé** : plusieurs sources spécialisées (non officielles) citent
Billit comme partenaire Stripe référencé sur le Stripe App Marketplace. Billit **est bien
immatriculé DGFiP** (confirmé point 8), mais je n'ai pas pu charger le Stripe App
Marketplace depuis cet environnement (page nécessitant JavaScript) pour confirmer le
partenariat de première main — **à vérifier directement sur `marketplace.stripe.com` avant
tout engagement.**

## 8. Vérification officielle du statut auprès de la DGFiP

Liste consultée directement depuis la source primaire officielle : [Je consulte la liste
des plateformes agréées — impots.gouv.fr](https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees),
fichier PDF « Liste des opérateurs satisfaisant à l'ensemble des conditions, incluant les
tests d'interopérabilité » (liste des immatriculations **définitives**, pas seulement des
dossiers déposés).

Statut vérifié pour les noms cités dans ce rapport (extrait du PDF officiel, tel que publié
au 22/08/2026) :

| Plateforme | Immatriculée définitivement | Date d'immatriculation |
|---|---|---|
| BILLIT | Oui | 19/12/2025 |
| PENNYLANE | Oui | 11/12/2025 |
| TIIME (« TIIME PDP ») | Oui | 18/12/2025 |
| INDY | Oui | 09/01/2026 |
| QONTO | Oui | 18/12/2025 |
| SAGE | Oui | 22/12/2025 |
| CEGID | Oui | 18/12/2025 |
| SELLSY (« TeamSystem Sellsy ») | Oui | 24/12/2025 |
| YOOZ (« YOOZ PDP ») | Oui | 11/12/2025 |
| ESKER | Oui | 11/12/2025 |

**Important** : cette liste change régulièrement (nouvelles immatriculations, éventuels
retraits). Le PDF a été consulté à l'instant, mais impots.gouv.fr reste la seule source à
revérifier avant de signer quoi que ce soit — cite le site officiel dans le rapport, pas ce
document, le jour où tu contractualises.

## 9. Architecture cible — Stripe conservé comme système de paiement

```
Client → Stripe Checkout (paiement, inchangé)
              │
              ▼
   Stripe Billing (Subscription + Invoice, inchangé)
              │
              ▼  webhook (existant, à étendre)
   /api/billing/webhook
     ├─ événements actuels (déjà traités)
     └─ NOUVEAU : invoice.finalized / invoice.paid / invoice.payment_failed
              │
              ▼
   NOUVEAU connecteur (src/lib/billing/[plateforme].ts)
     — transmet les données de facture à la plateforme agréée choisie
     — enregistre le résultat (id externe, statut, accusé) dans Supabase
              │
              ▼
   NOUVELLE table Supabase `invoices`
     (stripe_invoice_id, external_id, status, ht, tva, ttc, pdf_url, acknowledged_at)
```

Principes :
- Stripe reste l'unique moteur de paiement et d'abonnement — rien ne change côté client,
  aucune migration de moyen de paiement.
- La plateforme agréée ne reçoit jamais de données de carte bancaire — uniquement des
  données de facturation (montants, identité, TVA).
- Le webhook existant est étendu, pas remplacé : les événements déjà traités
  (`checkout.session.completed` etc.) continuent de fonctionner à l'identique.

## 10. Plan de migration réversible et plan de tests

**Réversibilité** : chaque étape est un ajout, jamais une suppression du chemin existant.
À tout moment, désactiver le connecteur vers la plateforme agréée (variable d'environnement
`BILLING_PROVIDER_ENABLED=false`, par exemple) fait revenir exactement au comportement
actuel — Stripe continue de facturer, seul l'envoi vers la plateforme s'arrête.

**Étapes** (détail des fichiers en attente de ta validation sur la solution E1/E2/E3) :

1. **Renseigner `src/content/company.ts`** (préalable bloquant, indépendant de Stripe) —
   déploiement isolé, sans risque, vérifiable visuellement sur `/mentions-legales`.
2. **Configurer le Dashboard Stripe** : Business details (Public details), Customer emails
   (envoi automatique), et Stripe Tax si le statut TVA le justifie — aucune ligne de code,
   à faire directement dans le Dashboard.
3. **Ajouter la collecte de facturation à la session Checkout** (`billing_address_collection`,
   `tax_id_collection`, `custom_fields` pour la raison sociale) — testable en environnement
   Stripe test (mode « Test data »), sans toucher la production.
4. **Choisir et souscrire à la plateforme agréée** (dépend du point D et de la
   vérification Marketplace du point 7).
5. **Étendre le webhook** avec les événements `invoice.*` et le connecteur — déployé
   derrière la variable d'activation, testable en mode test Stripe avant bascule.
6. **Créer la table `invoices`** et vérifier la réconciliation sur un lot de test.
7. **Activer en production**, sur un sous-ensemble d'abonnements si la plateforme choisie
   le permet, avant bascule complète.

**Plan de tests** (avant toute activation en production) :
- Mode test Stripe (clés `sk_test_...`) : session Checkout complète avec collecte
  d'adresse/TVA/raison sociale, vérifier que ces champs apparaissent bien sur la facture
  Stripe de test.
- Webhook : rejouer manuellement un événement `invoice.finalized` de test (Stripe CLI,
  `stripe trigger invoice.finalized`) et vérifier l'écriture dans la table `invoices` et
  l'appel sortant vers la plateforme agréée (environnement sandbox de la plateforme si elle
  en propose un).
- Idempotence : rejouer deux fois le même événement, vérifier qu'aucune duplication
  n'apparaît (upsert sur `stripe_invoice_id`).
- Cas d'échec : simuler un paiement refusé (`invoice.payment_failed`) et un avoir, vérifier
  que le connecteur ne casse pas le webhook existant en cas d'indisponibilité de la
  plateforme agréée (répondre 200 à Stripe malgré l'échec de transmission côté plateforme,
  avec une file de réessai — sinon Stripe considère le webhook en échec et le désactive
  après trop d'échecs consécutifs).
- Vérification manuelle d'une facture réelle (compte Stripe en mode live, montant
  symbolique) avant bascule complète du volume.

---

## Ce qu'il te reste à fournir avant que je code quoi que ce soit

- **Fichiers concernés** : listés en détail dans `docs/08-audit-facturation-electronique.md`, section G — inchangés par cet approfondissement.
- **Migrations prévues** : une seule nouvelle table Supabase, `invoices` (schéma exact à écrire une fois la plateforme choisie, les champs qu'elle retourne variant d'un opérateur à l'autre).
- **Variables d'environnement** : au minimum une clé API pour la plateforme agréée choisie (nom exact dépendant de l'opérateur), plus `BILLING_PROVIDER_ENABLED` pour la réversibilité.
- **Coûts et dépendances** : abonnement à la plateforme agréée (tarification propre à chacune, à demander directement — non traité ici pour ne pas citer un tarif non vérifié), temps de développement du connecteur et de la table `invoices`.
- **Points à valider avec ton expert-comptable, avant que je code quoi que ce soit** :
  1. Forme juridique exacte et statut TVA (assujetti / franchise en base / exonéré) — bloque tout le reste.
  2. Répartition réelle B2B France / B2C / UE / hors UE de ta clientèle.
  3. Les mentions obligatoires exactes à faire figurer selon ton statut (liste du point 4 à confirmer juridiquement, je ne l'ai pas arrêtée avec autorité).
  4. La date à laquelle l'obligation d'émission te concerne réellement (1er septembre 2027 si tu relèves de la catégorie PME/TPE/micro-entreprise — à confirmer avec ta forme juridique et ton chiffre d'affaires).

Dis-moi comment trancher ces points et quelle solution (E1/E2/E3, `docs/08`) retenir — je code seulement après.
