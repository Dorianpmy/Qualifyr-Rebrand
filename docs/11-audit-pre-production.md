# 11 — Audit avant mise en production

Analyse du code au 22/08/2026, branche `feature/qualifyr-rebrand-v1`.

**Méthode.** Chaque ligne de ce document a été vérifiée dans le code : routes API,
fonctions serveur, migrations SQL, intégrations. Aucune fonctionnalité n'est
considérée comme opérationnelle parce qu'elle apparaît dans l'interface ou dans un
texte marketing. Les fichiers et numéros de ligne sont cités pour que chaque
affirmation soit re-vérifiable.

---

## 0. Les trois constats qui commandent tout le reste

### 0.1 « Hermès » n'existe pas

Recherche insensible à la casse sur `herm[eè]s` dans l'intégralité du projet
(`.ts`, `.tsx`, `.css`, `.md`, `.sql`) : **zéro occurrence.**

Aucun agent nommé Hermès n'est implémenté, ni référencé, ni prévu dans le code. Ce
qui existe s'appelle « l'agent d'acquisition » côté site
(`components/agency/AgentFlow.tsx`) et se réduit à deux routes
(`api/agent/scan`, `api/agent/process`).

La section 2 de la demande audite donc **l'agent réellement présent**. Si « Hermès »
désigne un produit à venir, rien n'en est écrit aujourd'hui ; s'il s'agit d'un
nouveau nom pour l'agent existant, ses capacités réelles sont décrites au §2.

### 0.2 Payer ne donne accès à rien

`api/billing/webhook/route.ts` vérifie la signature Stripe, lit le plan et la
périodicité, journalise l'événement — **et s'arrête là**. Le commentaire
`PROVISIONING` (lignes 167-182) le dit explicitement : aucun compte n'est créé,
aucun droit n'est enregistré.

Conséquence, aujourd'hui, en production :

1. un prospect paie 17, 49 ou 59 € par mois sur Stripe ;
2. Stripe encaisse et facture ;
3. **rien ne se passe côté Qualifyr** — aucun compte, aucun e-mail d'activation,
   aucun accès ;
4. le client doit être créé à la main en base pour pouvoir se connecter.

C'est le défaut le plus grave de l'audit. Il est bloquant pour la mise en
production : encaisser un abonnement sans livrer le service est un problème
commercial autant que juridique.

### 0.3 Le SaaS n'a aucune notion d'abonnement

Vérifié sur les quatorze migrations (`supabase/migrations/*.sql`) : **aucune table
`subscriptions`, aucune colonne `plan`, `stripe_customer_id`, `trial_ends_at` ou
équivalent.** `getDetailerForOwner` (`lib/detailing/dashboard.ts:69`) sélectionne
huit colonnes de `detailers` ; aucune ne concerne un abonnement.

L'accès à `/app` répond aujourd'hui à une seule question : **« existe-t-il une fiche
`detailers` dont `owner_id` est mon utilisateur Auth ? »** Si oui, tout le SaaS est
ouvert. Il n'existe aucun plan « Agent seul » techniquement distinct d'un « Pack
complet ».

**La demande §3 ne peut donc pas être implémentée en l'état** : on ne peut pas
filtrer par plan tant qu'aucun plan n'est enregistré nulle part. L'ordre correct est
donné au §7.

---

## 1. Promesses commerciales contre fonctionnalités réelles

Source des promesses : `components/agency/DarkPricing.tsx` (les trois offres) et
`components/agency/FeatureComparisonTable.tsx` (le tableau comparatif).

Légende de la colonne « Catégorie » :

- **1** — fonctionnel et réellement disponible ;
- **2** — partiellement fonctionnel, ou dépendant d'une intervention humaine / d'une
  configuration absente ;
- **3** — promis mais non disponible, ou techniquement impossible en l'état.

### 1.1 Offre « Agent seul » — 17 €/mois

| Promesse vendue | Fonctionnalité réellement disponible | L'agent peut-il l'exécuter ? | Fiabilité | Catégorie | Action recommandée |
|---|---|---|---|---|---|
| « Il travaille toutes vos communes, pas seulement la vôtre » | `nearbyPostalCodes()` (`api/agent/process/route.ts:44`) prend le code postal **± 1**, soit 3 codes postaux. Le rayon en km est reçu puis ignoré (`void radiusKm`, ligne 51) | Partiellement | Moyenne | **2** | Reformuler : « les codes postaux voisins du vôtre ». « Toutes vos communes » est faux |
| « Il vise les entreprises qui entretiennent vraiment : loueurs, VTC, concessions, flottes » | `SEGMENTS` dans `lib/agent/sirene.ts`, filtrage par code NAF | Oui | Bonne | **1** | Aucune |
| « Chaque chiffre vient du répertoire officiel Sirene » | Appels à l'API Sirene de l'INSEE, `INSEE_API_KEY` requise | Oui | Bonne | **1** | Aucune |
| « Un rapport de secteur par e-mail » | `reportHtml()` + envoi Resend (`api/agent/process/route.ts:184-199`) | Oui, si `RESEND_API_KEY` est configurée | Bonne | **1** | Aucune |
| « Première zone gratuite, sans carte bancaire » | `api/agent/scan` accepte une zone sans authentification ni paiement | Oui | Bonne | **1** | Aucune |

### 1.2 Offre « Système seul » — 49 €/mois

| Promesse vendue | Fonctionnalité réellement disponible | Exécution automatique ? | Fiabilité | Catégorie | Action recommandée |
|---|---|---|---|---|---|
| « Le client voit son prix et sa durée avant de réserver » | Calcul de devis (`lib/detailing/quote.ts`, couvert par `tests/detailing-quote.test.ts`) | Oui | Bonne | **1** | Aucune |
| « L'acompte est encaissé au moment du clic » | `api/detailing/checkout` + Stripe Connect, webhook `api/detailing/stripe-webhook` | Oui, si le professionnel a terminé son onboarding Connect | Bonne | **1** | Préciser « après activation de vos paiements » |
| « Un client qui n'a pas payé reçoit une relance automatique » | `api/detailing/booking-recovery` + `netlify/functions/booking-recovery-cron.ts` (toutes les 15 min) | Oui, si `CRON_SECRET` **et** l'envoi d'e-mail sont configurés | Moyenne | **2** | Vérifier que le planificateur tourne réellement en production avant de vendre ce point |
| « L'adresse est géocodée, la distance calculée » | `api/detailing/geocode` | Oui | Bonne | **1** | Aucune |
| « Vos demandes, vos avant/après et vos factures au même endroit » | `/app`, `/app/cases`, `/app/invoices` | Oui | Bonne | **1** | Aucune |
| « France et Suisse : euro ou franc, TVA et mentions au bon format » | `lib/detailing/einvoice.ts`, `api/app/invoices`, `pricing-region` | Oui | Bonne | **1** | Aucune |

### 1.3 Offre « Pack complet » — 59 €/mois

| Promesse vendue | Fonctionnalité réellement disponible | Exécution automatique ? | Fiabilité | Catégorie | Action recommandée |
|---|---|---|---|---|---|
| « Tout l'agent d'acquisition, sur toutes vos communes » | Voir §1.1 — même limite des 3 codes postaux | Partiellement | Moyenne | **2** | Même reformulation qu'au §1.1 |
| « Tout le système de réservation et sa facturation » | Voir §1.2 | Oui | Bonne | **1** | Aucune |
| **« Les rendez-vous trouvés par l'agent atterrissent dans le même agenda »** | **Rien.** L'agent écrit dans `agent_prospects` (des établissements Sirene) ; il ne crée aucune ligne dans `detailer_bookings`. Aucun code ne relie les deux tables | **Non** | Nulle | **3** | **Retirer ou réécrire.** L'agent ne prend aucun rendez-vous — il compte des entreprises et envoie un rapport |
| « Un seul abonnement, une seule facture, un seul écran » | Vrai côté Stripe | Oui | Bonne | **1** | Aucune |
| « Vos questions passent devant les autres » | Engagement humain, hors code | s.o. | s.o. | **2** | Tenable si Dorian s'y tient — aucune implémentation requise |

### 1.4 Tableau comparatif (`FeatureComparisonTable.tsx`)

| Ligne du tableau | Réalité | Catégorie |
|---|---|---|
| Agent de prospection | Comptage Sirene + rapport e-mail | **1** (mais voir la nuance de vocabulaire au §2.7) |
| Rapport de secteur par e-mail | Oui | **1** |
| Page de réservation en ligne | Oui (`/reservation/[slug]`) | **1** |
| Acompte encaissé au clic | Oui, via Connect | **1** |
| Relance automatique des devis abandonnés | Oui, si le planificateur tourne | **2** |
| Facturation France/Suisse | Oui | **1** |
| Galerie avant/après | Oui | **1** |
| **Rendez-vous trouvés par l'agent dans le même agenda** | **Inexistant** | **3** |
| Support standard / prioritaire | Engagement humain | **2** |

### 1.5 Promesse transverse la plus grave

| Promesse | Réalité | Catégorie |
|---|---|---|
| **Toute la page tarifs : « S'abonner » → accès au produit** | Le paiement aboutit, l'accès n'est jamais créé (§0.2) | **3** |

---

## 2. Audit de l'agent réellement présent

Rappel : aucun agent nommé Hermès n'existe (§0.1). L'audit porte sur l'agent
d'acquisition.

**Fichiers concernés :** `api/agent/scan/route.ts`, `api/agent/process/route.ts`,
`lib/agent/sirene.ts`, `lib/agent/zones.ts`, `lib/agent/dashboard.ts`,
`netlify/functions/agent-process-cron.ts`, migrations `010` et `013`.

| # | Capacité | Existe ? | Où | Route / fonction | Fonctionne de bout en bout ? | Limites | Promesse à reformuler ? |
|---|---|---|---|---|---|---|---|
| 2.1 | Comprendre une demande en langage naturel | **Non** | — | — | Non | L'agent ne reçoit qu'un code postal et un e-mail. **Aucun modèle de langage n'est appelé nulle part dans le projet** | Ne jamais le présenter comme conversationnel |
| 2.2 | Analyser les informations reçues | **Partiellement** | `lib/agent/sirene.ts` | `scanZone`, `countBySegment` | Oui | Il s'agit d'un filtrage par code NAF et d'un comptage, pas d'une analyse | Dire « il recense et classe », pas « il analyse » |
| 2.3 | Créer ou modifier des données | **Oui** | `api/agent/process/route.ts:162` | `insert` dans `agent_prospects`, `update` sur `agent_zones` | Oui | Écrit uniquement dans ces deux tables. **Ne touche jamais aux réservations** | — |
| 2.4 | Exécuter les actions annoncées | **Partiellement** | — | — | — | Recense et envoie un rapport : oui. Prend des rendez-vous : **non** | Oui — voir §1.3 |
| 2.5 | Utiliser les intégrations nécessaires | **Oui** | `lib/agent/sirene.ts`, `api/agent/process` | API Sirene (INSEE), Resend | Oui | Dépend de `INSEE_API_KEY` et `RESEND_API_KEY`. Sans Resend, le traitement va au bout mais **aucun rapport ne part** (`reportSent: false`) | — |
| 2.6 | Déclencher des automatisations | **Oui** | `netlify/functions/agent-process-cron.ts` | Planificateur, toutes les 15 min | Oui, si `CRON_SECRET` est posée | Une seule zone traitée par passage (`limit(1)`) : dix zones en file = 2 h 30 d'attente | Ne pas promettre de rapport « immédiat » |
| 2.7 | Contacter des prospects | **Non** | — | — | Non | Aucun envoi vers un prospect nulle part. Le seul e-mail part **vers le professionnel** | Le mot « prospection » est acceptable ; « il démarche » ne l'est pas |
| 2.8 | Envoyer des messages / notifications | **Partiellement** | `api/agent/process/route.ts:186` | `resend.emails.send` | Oui | Un seul e-mail, en fin d'analyse, vers le professionnel | — |
| 2.9 | Gérer les erreurs | **Oui, correctement** | `api/agent/process/route.ts:218-234` | `try/catch` | Oui | La zone repasse en `en_attente` (quota, réseau) plutôt qu'en échec définitif. Erreurs partielles conservées dans `error_message`. **C'est le point le plus solide de l'agent** | — |
| 2.10 | Demander une validation humaine | **Sans objet** | — | — | — | L'agent n'entreprend aucune action irréversible ni sortante : il n'y a rien à valider | — |
| 2.11 | Respecter les limites et permissions d'abonnement | **Non** | — | — | Non | **Aucun contrôle d'abonnement n'existe** (§0.3). `api/app/agent-zones` vérifie la session, jamais un plan | Bloquant pour vendre trois offres distinctes |
| 2.12 | Fonctionner de façon fiable en production | **Partiellement** | — | — | — | Dépend de 3 variables d'environnement et d'un planificateur actif. Fenêtre d'exécution de 60 s ; le budget est tenu par la limite à 3 codes postaux | Vérifier les variables avant lancement |

### Résumé honnête de l'agent

**Ce qu'il fait vraiment :** il interroge le répertoire Sirene de l'INSEE sur trois
codes postaux, retient jusqu'à 20 établissements par segment, les classe en quatre
catégories, les enregistre, et envoie au professionnel un e-mail récapitulatif avec
un décompte et quelques exemples.

**Ce qu'il ne fait pas :** comprendre du langage, converser, contacter qui que ce
soit, prendre un rendez-vous, apprendre de quoi que ce soit, ni s'adapter.

La formulation « Chaque refus lui apprend qui vous fait perdre du temps »
(`AgentFlow.tsx`, carte « Agent Mémoire ») décrit un apprentissage qui **n'existe
pas** : aucun mécanisme de rétroaction n'est implémenté. À retirer ou à réécrire.

---

## 3. Matrice de permissions proposée

À implémenter **après** le provisioning (§7). Colonnes = plans Stripe existants
(`lib/billing/stripe.ts:32`).

| Module / capacité | Route(s) à protéger | Agent seul (17 €) | Système seul (49 €) | Pack complet (59 €) |
|---|---|---|---|---|
| Prospection (zones, prospects) | `/app/prospection`, `api/app/agent-zones` | ✅ | ❌ | ✅ |
| Rapport de secteur | `api/agent/scan`, `api/agent/process` | ✅ | ❌ | ✅ |
| Tableau de bord des demandes | `/app` | ❌ | ✅ | ✅ |
| Planning | `/app/planning` | ❌ | ✅ | ✅ |
| Prestations et tarifs | `/app/prestations`, `api/app/pricing` | ❌ | ✅ | ✅ |
| Page de réservation publique | `/reservation/[slug]` | ❌ | ✅ | ✅ |
| Encaissement d'acompte | `api/detailing/checkout`, `api/app/stripe-connect` | ❌ | ✅ | ✅ |
| Factures | `/app/invoices`, `api/app/invoices` | ❌ | ✅ | ✅ |
| Galerie avant/après | `/app/cases`, `api/app/cases` | ❌ | ✅ | ✅ |
| Relance automatique | `api/detailing/booking-recovery` | ❌ | ✅ | ✅ |

**Point d'attention.** Un abonné « Agent seul » n'a, dans cette matrice, accès qu'à
la prospection — donc à un seul écran. `/app` étant aujourd'hui la page d'accueil de
l'espace pro, il faudra le rediriger vers `/app/prospection` à la connexion, sans
quoi il arriverait sur un écran verrouillé.

### États à gérer

| État | Origine | Comportement attendu |
|---|---|---|
| Essai | à créer (aucun mécanisme aujourd'hui) | Accès complet, durée bornée, date de fin visible |
| Actif | `customer.subscription.updated`, statut `active` | Accès selon le plan |
| Paiement échoué | statut `past_due` | Accès maintenu quelques jours + bandeau, puis restriction |
| Résilié | `customer.subscription.deleted` | Lecture seule, données conservées — jamais de suppression |
| Expiré | fin de période | Comme résilié |

---

## 4. Interface — ce qui existe et ce qui manque

**Existant et sain :** authentification vérifiée sur **toutes** les pages `/app`
(12/12) et **toutes** les routes `api/app` protégées (9/9, hors login/logout/session).
C'est solide, et cette base rendra l'ajout des permissions simple.

**Manquant, en totalité :**

- aucun état verrouillé, nulle part ;
- aucun message expliquant pourquoi un module serait indisponible ;
- aucun bouton de montée en gamme dans l'application ;
- aucun affichage du plan actif ni de son échéance.

Ce n'est pas un défaut d'implémentation : ces éléments n'ont jamais été écrits,
faute de plan à afficher.

**Charte graphique :** aucune régression détectée. Aucun jaune ni orange
parasite dans l'espace pro ; les correctifs du jour (barre d'onglets, pastilles de
filtre) ont au contraire retiré les dernières teintes chaudes de l'interface mobile.

---

## 5. Code non branché, à ne pas confondre avec des fonctionnalités

| Fichier | État | Remarque |
|---|---|---|
| `src/lib/agent/places.ts` | Non suivi par git, jamais importé | Intégration Google Places jamais branchée. `GOOGLE_PLACES_API_KEY` n'est donc utilisée nulle part en production |
| `src/lib/agent/email-extract.ts` | Non suivi par git, jamais importé | Extraction d'e-mails de prospects — non branchée |
| `src/components/agency/ServiceStack.tsx` | Non suivi par git | À vérifier |
| `supabase/migrations/013_agent_prospects_contact.sql` | Non suivi par git | Migration jamais appliquée en production |

Ces quatre éléments laissent penser qu'une prise de contact automatique des
prospects était en cours de construction. **Elle n'est ni terminée, ni déployée, ni
utilisable** — et ne doit donc rien promettre commercialement.

---

## 6. Variables d'environnement requises

Sans elles, les fonctionnalités correspondantes échouent silencieusement.

| Variable | Sert à | Effet si absente |
|---|---|---|
| `INSEE_API_KEY` | Agent — Sirene | Aucune analyse de zone possible |
| `RESEND_API_KEY` | Agent — rapport | L'analyse aboutit, **aucun rapport n'est envoyé** |
| `CRON_SECRET` | Planificateurs (agent, relance, avis) | Aucune automatisation ne tourne |
| `STRIPE_SECRET_KEY` | Abonnements | Aucun paiement possible |
| `STRIPE_PRICE_*` (6 identifiants) | Un par offre et périodicité | Erreur explicite au clic sur « S'abonner » |
| `STRIPE_BILLING_WEBHOOK_SECRET` | Webhook abonnements | Webhook en 503 |
| `STRIPE_WEBHOOK_SECRET` | Webhook acomptes clients | Acomptes jamais confirmés |
| `BOOKING_FROM_EMAIL` | Expéditeur | Repli sur un domaine Resend de test |

---

## 7. Ordre de travail recommandé

Le §3 de la demande (verrouillage par abonnement) ne peut pas être la première
étape : il n'y a rien à verrouiller tant qu'aucun plan n'est enregistré.

1. **Corriger les textes commerciaux faux** — sans dépendance technique, faisable
   immédiatement (§1.3, §2.7, §2.1).
2. **Modèle de données des abonnements** — table `subscriptions` ou colonnes sur
   `detailers` : plan, statut, identifiant client Stripe, échéance.
3. **Provisioning dans le webhook** — créer ou retrouver le compte, enregistrer le
   plan, révoquer à la résiliation (idempotent : `upsert`, jamais `insert`).
4. **Système central de permissions** — une fonction unique
   `can(plan, capability)`, consommée par le serveur **et** par l'interface.
5. **Contrôle serveur** — sur chaque route de la matrice §3. C'est ce contrôle-là
   qui protège : masquer un bouton n'empêche pas d'appeler l'URL.
6. **Contrôle interface** — états verrouillés, explication, bouton de montée en
   gamme.
7. **Gestion des états** — essai, échec de paiement, résiliation.
8. **Tests par plan** — un abonné « Agent seul » ne doit atteindre aucun autre
   module, ni par l'interface, ni par appel direct.

**Les étapes 2 à 8 sont un chantier de plusieurs heures qui touche
l'authentification, le schéma de base et toutes les routes.** Elles ne doivent pas
être lancées sans validation explicite du modèle de données.

---

## 8. Checklist avant mise en production

### Bloquant

- [ ] Le paiement d'un abonnement crée ou active un compte (§0.2)
- [ ] Retirer « Les rendez-vous trouvés par l'agent atterrissent dans le même agenda » (§1.3)
- [ ] Retirer « Chaque refus lui apprend qui vous fait perdre du temps » (§2)
- [ ] Reformuler « toutes vos communes » → « les codes postaux voisins » (§1.1)
- [ ] Enregistrer le plan actif en base (§0.3)
- [ ] Contrôle serveur des permissions sur chaque route de la matrice (§3)
- [ ] Les six identifiants de prix Stripe sont configurés
- [ ] `STRIPE_BILLING_WEBHOOK_SECRET` posée et webhook déclaré côté Stripe
- [ ] `CRON_SECRET` posée et planificateurs vérifiés en production

### Important

- [ ] `INSEE_API_KEY` et `RESEND_API_KEY` posées et testées de bout en bout
- [ ] Un abonné « Agent seul » est redirigé vers `/app/prospection` à la connexion
- [ ] États verrouillés visibles et explicites dans l'interface
- [ ] Comportement défini pour un paiement échoué et une résiliation
- [ ] Vérifier que le planificateur de relance tourne avant de vendre ce point

### À surveiller

- [ ] Décider du sort de `places.ts` et `email-extract.ts` : finir ou supprimer (§5)
- [ ] Mentions légales : `legalNoticeIsComplete()` renvoie `true` depuis le 22/08/2026 ✅
- [ ] Conditions générales de vente — **absentes**, obligatoires pour vendre un abonnement en ligne
- [ ] Facturation électronique : échéance septembre 2027 pour une micro-entreprise (voir `docs/10`)
