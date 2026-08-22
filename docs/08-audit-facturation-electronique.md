# 08 — Audit Stripe / facturation électronique (22/08/2026)

Document de travail, demandé explicitement. **Aucun code n'a été modifié pour cette
partie.** Rapport A→G uniquement, comme demandé — l'implémentation attend ta validation.

Portée : la facturation des **abonnements SaaS Qualifyr** (`lib/billing/stripe.ts`,
compte Stripe direct). Le flux d'acomptes clients des laveurs auto (`lib/detailing/stripe.ts`,
Stripe Connect) est un système différent, non couvert ici sauf mention contraire.

---

## A. Architecture Stripe actuelle

- **Stripe Checkout, mode `subscription`** — pas de SDK, appels REST directs
  (`src/lib/billing/stripe.ts`, `createSubscriptionCheckout`). Un `mode: 'subscription'`
  fait tourner **Stripe Billing** en arrière-plan : Stripe crée le `Customer`,
  la `Subscription` et une `Invoice` à chaque cycle, automatiquement.
- **Stripe Invoicing en tant que fonctionnalité distincte (branding, mentions
  personnalisées, numérotation dédiée) : non configuré.** Rien dans le code n'appelle
  l'API Invoices pour personnaliser quoi que ce soit — ce sont les factures Stripe
  par défaut, telles que Stripe les génère pour toute souscription.
- **Aucune collecte fiscale à la création de session** : ni `tax_id_collection`, ni
  `billing_address_collection`, ni `automatic_tax`, ni `customer_creation` explicite.
  Seul un e-mail optionnel est transmis (`customer_email`).
- **Webhook** (`src/app/api/billing/webhook/route.ts`) : signature vérifiée
  (HMAC, comparaison à temps constant), événements traités —
  `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `checkout.session.expired`. Écrit dans les logs
  et dans `analytics_events` ; **n'écrit aucune facture, aucun montant, aucune
  donnée client dans Supabase.**
- **Idempotence** : la vérification de signature protège contre la falsification,
  pas contre le rejeu. Le commentaire `PROVISIONING` dans le webhook documente déjà
  que l'écriture future devra être un `upsert` sur l'identifiant Stripe — mais cette
  écriture n'existe pas encore, il n'y a donc rien à rejouer pour l'instant.
- **Aucun modèle de données `subscriptions` ou `invoices` dans Supabase.** Un
  abonnement payé est facturé côté Stripe mais n'active rien automatiquement côté
  Qualifyr (le commentaire du webhook le dit explicitement — c'est un chantier
  connu, pas un oubli de cet audit).

## B. Flux de paiement et de facturation, tel qu'il existe aujourd'hui

1. Le prospect clique sur une offre (`SubscribeButton` / `DarkPricing` / `PricingTable`).
2. `POST /api/billing/checkout` crée une session Stripe Checkout et redirige.
3. Le paiement se fait entièrement sur la page hébergée par Stripe — aucune donnée
   de carte ne transite par Qualifyr (zéro obligation PCI de notre côté, c'est
   volontaire et documenté).
4. Stripe crée le `Customer`, la `Subscription`, et génère une **facture Stripe
   par défaut** (PDF + reçu), envoyée par Stripe au client si les paramètres du
   compte Stripe le prévoient.
5. Le webhook reçoit l'événement, le journalise, ne fait **aucun provisioning**
   (l'accès à `/app` n'est pas automatiquement lié à un abonnement payé).
6. Rien n'est retransmis à une plateforme agréée. Rien n'est stocké côté Qualifyr
   au-delà d'un log d'événement.

## C. Écarts de conformité identifiés

| # | Écart | Gravité | Échéance réglementaire |
|---|---|---|---|
| 1 | Aucune collecte du statut B2B/B2C, SIREN/SIRET, n° TVA intracommunautaire, adresse de facturation à la souscription | Élevée | Avant émission de factures conformes |
| 2 | Facture Stripe par défaut = un reçu commercial, **pas une facture électronique structurée conforme à la réforme** (Factur-X / UBL / CII) et **pas transmise via une plateforme agréée** | Élevée pour le B2B France, faible pour le B2C | 1er septembre 2027 (émission PME/TPE/micro) si Qualifyr facture des professionnels français assujettis à la TVA |
| 3 | Aucun raccordement à une plateforme agréée (PDP) ni à un opérateur de dématérialisation | Élevée si concerné | idem |
| 4 | Statut fiscal de Qualifyr (TVA / franchise en base) et forme juridique **non renseignés dans le code** (`src/content/company.ts` — tous les champs légaux sont à `null`, volontairement, voir `docs/07-informations-legales-requises.md`) | Bloquant en amont de tout le reste | Déjà en retard — le site est en ligne sans mentions légales complètes |
| 5 | Aucune numérotation de facture propre à Qualifyr (on dépend entièrement de la numérotation Stripe) | Moyenne | À trancher avant tout développement |
| 6 | Aucune conservation de la facture, de son statut, d'un identifiant externe ou d'un accusé de réception côté Qualifyr | Moyenne | Utile dès aujourd'hui pour le support client, indépendamment de la réforme |
| 7 | Pas de webhook dédié aux événements `invoice.*` (`invoice.paid`, `invoice.payment_failed`, `invoice.finalized`) — seuls des événements `checkout.*`/`customer.subscription.*` sont écoutés | Moyenne | À corriger si un système de facturation est branché |

## D. Informations manquantes — je ne peux pas les déduire du code

Ce sont des faits sur *ton* entreprise, pas des détails techniques. Aucun ne doit
être deviné ni approximé.

1. **Forme juridique** de Qualifyr (micro-entreprise, EI, SASU, autre) — `legalForm` est `null`.
2. **SIREN/SIRET** — `registrationNumber` est `null`.
3. **Statut TVA** : assujetti, en franchise en base (art. 293 B du CGI), ou exonéré — `vatNumber` est `null`. **À valider par un expert-comptable.**
4. **Type de clientèle réel** : à ce jour, le site vend à des professionnels (laveurs auto, souvent micro-entreprises ou EI) — c'est donc très probablement du **B2B France** pour l'essentiel, éventuellement un peu de B2C si un particulier souscrit. Cette répartition doit être confirmée, pas supposée.
5. **Zone géographique des clients** : le site affiche des prix en EUR et CHF (`src/lib/offer-configurator.ts`) — donc potentiellement de la vente hors UE (Suisse). Impact e-reporting international à vérifier. **À valider par un expert-comptable.**
6. **Compte Stripe** : déclaré en France (confirmé indirectement — c'est la restriction qui a cassé `consent_collection.promotions` plus tôt cette session), mais je n'ai pas vérifié dans le Dashboard Stripe si Stripe Tax ou Stripe Invoicing (fonctionnalité) sont activés, ni la configuration de numérotation/mentions des factures Stripe actuelles. **Je n'ai pas d'accès au Dashboard Stripe depuis cet environnement — à vérifier par toi, ou via Claude Code comme pour les Price IDs plus tôt cette session.**

## E. Trois solutions possibles

### E1 — Minimale
Garder Stripe Billing tel quel. Activer et personnaliser **Stripe Invoicing**
(mentions légales de Qualifyr sur le template de facture Stripe, numéro de TVA
si assujetti, adresse). Ajouter la collecte d'adresse de facturation et de SIRET/TVA
à la session Checkout (`tax_id_collection`, `billing_address_collection: 'required'`).
Ne raccorde **aucune** plateforme agréée.
- Couvre : mentions légales correctes sur chaque facture, meilleure preuve commerciale.
- Ne couvre pas : l'obligation d'e-invoicing structurée/transmise via PDP pour le
  B2B France à partir de septembre 2027, ni l'e-reporting.
- Adapté si : la clientèle B2B France reste minoritaire ou si le volume est encore
  faible d'ici l'échéance, le temps de construire la solution recommandée.

### E2 — Recommandée
E1 + raccordement à une **plateforme agréée par la DGFiP** compatible avec Stripe,
pour couvrir l'émission B2B France et l'e-reporting B2C/international à partir de
2027. Stripe reste le seul système de paiement/abonnement ; la plateforme agréée
devient le système de facturation légale, alimenté par les événements Stripe
(`invoice.finalized`, `invoice.paid`) via le webhook déjà en place. Ajout d'un
modèle `invoices` côté Supabase pour conserver identifiant externe, statut, et
accusé de réception.
- Plusieurs plateformes agréées existent (liste officielle sur l'espace Partenaire
  d'impots.gouv.fr). Certaines communiquent sur une intégration Stripe déjà prête
  (ex. Billit, cité comme partenaire Stripe sur l'App Marketplace par plusieurs
  sources spécialisées — **à vérifier directement sur le Stripe App Marketplace et
  sur la liste officielle des plateformes immatriculées avant tout choix**, je n'ai
  pas pu confirmer cette intégration depuis une source primaire dans cette session).
- Couvre : l'essentiel de l'obligation réglementaire pour un volume B2B France
  raisonnable, sans construire de plateforme.

### E3 — Complète
E2 + Qualifyr devient « maître de la facture » : Qualifyr génère et numérote
lui-même les factures (structure conforme, Factur-X/UBL/CII), les stocke, gère
avoirs et annulations en interne, et ne délègue à la plateforme agréée que la
transmission réglementaire et l'e-reporting. Nécessite un vrai modèle de données
facturation (numérotation chronologique non modifiable, TTC/HT/TVA par ligne,
avoirs liés à la facture d'origine, statuts, archivage légal 6 à 10 ans selon le
document).
- Couvre tout, y compris un futur où Qualifyr facturerait pour le compte de tiers
  (à surveiller si Qualifyr elle-même devient un jour un intermédiaire de
  facturation pour les laveurs auto — hors sujet actuel, mais l'architecture y
  resterait compatible).
- Coût de développement et de maintenance nettement supérieur à E2 pour un
  bénéfice marginal tant que Qualifyr n'agit que comme éditeur de son propre SaaS.

## F. Solution recommandée (E2) — détail

**Coûts.** Abonnement à une plateforme agréée (tarification généralement au volume
de factures, souvent quelques dizaines d'euros/mois pour un volume TPE/PME) +
temps de développement pour le connecteur webhook → plateforme et le modèle
`invoices`. Pas de coût Stripe additionnel identifié (Stripe Invoicing de base est
inclus dans les frais de transaction existants).

**Risques.**
- Dépendance à un prestataire tiers pour une obligation légale — vérifier sa
  pérennité et son immatriculation active avant de s'engager (`impots.gouv.fr`
  publie la liste à jour).
- Double source de vérité (Stripe = paiement, plateforme = facture légale) : le
  webhook doit être idempotent et la réconciliation surveillée, sinon des factures
  peuvent manquer côté plateforme sans que Qualifyr s'en aperçoive.
- Le statut fiscal de Qualifyr (point D.3) n'étant pas encore fixé, une partie de
  ce travail ne peut pas commencer avant qu'un expert-comptable tranche.

**Dépendances.** Réponses aux points D (statut juridique/fiscal, type de clientèle
réel) avant de choisir la plateforme agréée précise — le bon choix dépend du
volume, du prix, et de la compatibilité Stripe déjà éprouvée ou non.

**Limites.** Ne couvre pas un scénario où Qualifyr facturerait pour le compte de
tiers (voir E3) — hors sujet à ce stade.

## G. Fichiers à modifier (si E2 validée)

- `src/lib/billing/stripe.ts` — ajouter `tax_id_collection`, `billing_address_collection: 'required'` à `createSubscriptionCheckout`.
- `src/app/api/billing/webhook/route.ts` — ajouter les événements `invoice.finalized`, `invoice.paid`, `invoice.payment_failed`, `credit_note.created` (avoirs) à la liste `handled`, et le provisioning correspondant.
- `src/content/company.ts` — renseigner `legalForm`, `registrationNumber`, `vatNumber`, `address` (préalable bloquant, indépendant de Stripe).
- Nouvelle migration Supabase — table `invoices` (identifiant Stripe, identifiant externe plateforme agréée, statut, montants HT/TVA/TTC, URL PDF, accusé de réception).
- Nouveau fichier `src/lib/billing/[nom-plateforme].ts` — client API de la plateforme agréée choisie, sur le modèle de `lib/billing/stripe.ts` (pas de SDK sauf nécessité, comme le reste du projet).
- `docs/07-informations-legales-requises.md` — mettre à jour une fois D.1-D.3 tranchés.

---

**Aucune implémentation n'a été faite.** Dis-moi comment tu veux trancher les points D, et quelle solution (E1/E2/E3) retenir, et je code en conséquence.
