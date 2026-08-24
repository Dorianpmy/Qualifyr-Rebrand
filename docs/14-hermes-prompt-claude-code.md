# Hermès — prompt de reprise pour Claude Code

Copie tout ce qui suit la ligne de séparation dans Claude Code, à la racine de
`Qualifyr-Rebrand`.

Ce document existe pour une raison précise : Hermès envoie des e-mails à des
entreprises qui n'ont rien demandé, au nom d'un client. Une reprise mal
informée peut casser une garantie sans que rien ne le signale — et la
conséquence n'est pas un bug d'affichage, c'est une plainte et un domaine
d'expédition brûlé. Les cinq règles de la section « Ce qu'il ne faut pas
casser » ne sont pas des préférences de style.

---

Tu travailles sur Qualifyr (`~/Developer/Qualifyr-Rebrand`), branche
`feature/qualifyr-rebrand-v1`. Next.js 16 (Turbopack), TypeScript strict,
Tailwind v4, Supabase, Stripe, Resend, vitest.

**Réponds toujours en français.**

## Contexte

Qualifyr vend trois offres SaaS. L'offre « Agent seul » donne accès à
**Hermès** : un automate qui recense les entreprises d'une zone via le
répertoire Sirene, relève leur adresse e-mail publique, puis **leur écrit
automatiquement au nom du professionnel abonné**, sans validation de sa part.
Le professionnel reçoit les réponses directement.

Hermès est fonctionnellement complet et committé. Il n'a jamais tourné en
production.

## Ce qui existe

**Base** — `supabase/migrations/016_hermes_outreach.sql` (non appliquée) :

- `hermes_campaigns` — ce que le professionnel a signé une fois : nom
  d'expéditeur, adresse de réponse, objet, corps, quota quotidien (1 à 40),
  `paused_at` (son interrupteur), `suspended_at` (le tien), `terms_accepted_at`.
  Rattachée à `auth.users`, pas à `detailers` — un abonné « Agent seul » n'a
  pas de fiche detailer.
- `hermes_messages` — journal de chaque envoi, avec l'adresse et le corps
  recopiés au moment de l'envoi. Unicité `(campaign_id, prospect_id)`.
- `hermes_suppressions` — adresses à ne plus jamais contacter, **portée
  globale, tous comptes confondus**.

`agent_prospects` (migration 010/013) contenait déjà `email`,
`unsubscribe_token`, `opted_out_at`, `contacted_at`, `replied_at`, `source`,
`legal_basis`. La migration 021 (24/08/2026, voir plus bas) y ajoute
`email_source` et `enrichment_attempts`, et ajoute `enrichment_attempted_at`
à `agent_zones`. La migration 022 (24/08/2026, voir plus bas) ajoute deux
tables séparées : `agent_imported_prospects` et `agent_import_attestations`.

**Code**

| Fichier | Rôle |
|---|---|
| `src/lib/agent/outreach-message.ts` | Fonctions pures : `fillTemplate`, `composeMessage`. Sans `server-only`, donc testable et utilisable dans l'aperçu. Le pied de page varie selon `OutreachCandidate.emailSource` — voir plus bas. |
| `src/lib/agent/outreach.ts` | Quota, liste de suppression, désinscription, sélection des candidats (`nextCandidates`, avec dédoublonnage d'adresse — voir plus bas), `campaignCanSend`. |
| `src/app/api/agent/outreach/route.ts` | Route planifiée. Une campagne par passage, 5 messages à la fois. |
| `src/app/api/app/hermes/route.ts` | `GET` / `PUT` / `PATCH` des réglages. |
| `src/app/app/hermes/page.tsx` | Écran de configuration, protégé par `agent.prospecting`. |
| `src/components/app/HermesSettings.tsx` | Formulaire + aperçu du message réel. |
| `src/app/desinscription/[token]/page.tsx` | Désinscription en un clic. |
| `src/lib/agent/osm-enrich.ts` | Enrichissement e-mail/téléphone par OpenStreetMap (24/08/2026) : requête Overpass, extraction sur site, liste noire, seuil de partage. |
| `src/lib/agent/company-match.ts` | Rapprochement de noms Sirene/OSM, fonction pure et testée. |
| `src/lib/agent/postal-codes.ts` | `nearbyPostalCodes`, partagé entre `/api/agent/process` et `/api/agent/enrich`. |
| `src/app/api/agent/enrich/route.ts` | Route planifiée de l'enrichissement, son propre cron (`agent-enrich-cron.ts`, 30 min). |
| `src/lib/agent/import-prospects.ts` | Import de listes (24/08/2026) : validation ligne par ligne, plafonds, attestation, insertion, consultation, suppression. |
| `src/app/api/app/hermes/import/route.ts` | `GET` / `POST` / `DELETE` des listes importées. |
| `src/components/app/ImportProspects.tsx` | Formulaire d'import, attestation affichée en toutes lettres, liste et suppression. |
| `tests/hermes-outreach.test.ts`, `tests/osm-enrich.test.ts`, `tests/company-match.test.ts`, `tests/import-prospects.test.ts` | Tests Hermès et enrichissement. |

**Textes** — article « Prospection automatisée » dans `content/terms.ts`,
collecte décrite dans `content/legal.ts`, offre « Agent seul » réécrite dans
`PricingTable.tsx`, `content/estimation-offers.ts` et `content/agents.ts`.

## Ce qu'il ne faut pas casser

1. **La liste de suppression est globale.** Une entreprise qui se désinscrit
   d'un message envoyé par un laveur ne doit plus être contactée par aucun
   autre. Elle ne sait pas — et n'a pas à savoir — qu'ils utilisent le même
   outil. Recevoir un second message après s'être désinscrit, c'est ce qui
   déclenche un signalement, et un signalement porte sur le domaine, donc sur
   tous les comptes.

2. **Quand une vérification échoue, rien ne part.** Quota illisible vaut zéro
   (`if (error) return 0`), liste de suppression injoignable vaut adresse
   interdite (`if (error) return true`), désinscription non enregistrée se
   signale comme échouée. Inverser l'un de ces replis est indétectable en
   relecture et catastrophique en production.

3. **`HERMES_FROM_EMAIL` doit rester distinct de `BOOKING_FROM_EMAIL`.** La
   réputation d'expéditeur se calcule par domaine : si la prospection fait
   chuter celle du domaine principal, ce sont les confirmations de réservation
   et les factures de tous les clients qui tombent en indésirables. Aucun repli
   n'est autorisé — un test l'interdit.

4. **Le pied de page des messages n'est pas modifiable par le client.** Il
   porte l'identité de l'expéditeur, l'origine des données (article 14 du
   RGPD — collecte indirecte) et le lien d'opposition. Le laisser à sa main,
   c'est parier que trois cents artisans le rédigeront correctement.

5. **Les prospects sont filtrés par le périmètre du compte.** Via
   `agent_zones` retrouvées par e-mail, puis `zone_id`. Une version antérieure
   interrogeait `agent_prospects` sans filtre : la campagne d'un laveur aurait
   écrit aux entreprises recensées par un autre. Trois assertions le
   verrouillent.

## Enrichissement e-mail/téléphone (ajouté le 24/08/2026)

**Le constat qui a déclenché ce travail : `agent_prospects.email` n'était
jamais renseigné.** Sirene (le recensement) ne fournit ni e-mail ni
téléphone — ce sont des registres d'entreprises, pas des annuaires de
contact — et `nextCandidates` exige `email is not null`. Hermès, jusque-là,
n'avait littéralement personne à qui écrire : les cinq mécanismes ci-dessus
protégeaient un moteur dont la file d'entrée était vide par construction.

**La source : OpenStreetMap**, gratuite et sans clé (choix de Dorian, couverture
partielle assumée). `src/lib/agent/osm-enrich.ts` interroge Overpass — une
requête par zone, jamais par entreprise, le débit d'Overpass ne le permettrait
pas — puis `src/lib/agent/company-match.ts` rapproche les noms localement
(normalisation, coefficient de Dice, containment ; le doute tranche contre le
rapprochement). Deux segments seulement (`concessions`, `loueurs`) : `vtc`
(taxi ≠ VTC en droit français, mauvais tag) et `flottes` (sièges
d'entreprise, aucun tag OSM fiable) restent à 0 % par cette voie — une limite
de la source, pas un défaut du rapprochement. Route dédiée
`/api/agent/enrich`, son propre cron toutes les 30 minutes, jamais mêlée à
`/api/agent/process` (budget Sirene) ni à `/api/agent/outreach` (décision
d'envoi) — même raisonnement que pour `/api/agent/relevance`.

**Trois points qu'une reprise doit connaître avant d'y toucher :**

- **`email_source` (`'osm_tag' | 'site_web'`) n'est pas un détail technique,
  c'est ce qui rend le pied de page honnête.** Une adresse portée directement
  par le tag `email` d'OpenStreetMap n'a jamais été vue par Qualifyr sur le
  site du prospect ; dire « publiée sur votre site » serait alors faux, même
  si un contributeur OSM l'y a recopiée à l'origine. `composeMessage`
  (`outreach-message.ts`) choisit la phrase d'origine selon cette colonne —
  ne jamais la rendre optionnelle ni lui donner une valeur par défaut qui
  masquerait la vraie source.
- **`nextCandidates` dédoublonne par adresse, pas seulement par prospect.**
  Une adresse peut être légitimement partagée (une franchise, un groupe —
  voir `MAX_SHARED_EMAIL_ATTRIBUTIONS` dans `osm-enrich.ts`, qui refuse
  seulement l'attribution au-delà d'une dizaine de SIRET distincts, pas entre
  un et dix). L'unicité `(campaign_id, prospect_id)` de `hermes_messages` ne
  suffit pas à empêcher deux messages identiques dans la même boîte le même
  jour si deux prospects distincts la partagent — c'est le dédoublonnage
  explicite dans `nextCandidates` (sur le lot en cours de constitution, et sur
  l'historique `hermes_messages.to_email` de la campagne) qui l'empêche. Le
  retirer réintroduirait exactement le profil d'envoi qui déclenche un
  signalement.
- **`enrichment_attempts` plafonne à 10 tentatives par prospect, en nombre de
  passages et non en âge écoulé** — à la différence du renvoi de rapport
  (`report-retry.ts`). Voir la migration 021 pour pourquoi cette différence
  est délibérée.

## Import de listes (ajouté le 24/08/2026)

**Pourquoi.** Le recensement automatique ne couvre que la France, et
l'enrichissement OSM que deux segments sur quatre (voir plus haut) : un
professionnel qui connaît déjà les transporteurs ou les flottes de sa région
— ou qui exerce en Suisse, jamais recensée — n'avait aucun moyen de les
apporter. `src/lib/agent/import-prospects.ts` ouvre cette voie.

**Deux tables, deux régimes de suppression, et c'est le point à ne jamais
inverser.** `agent_imported_prospects` porte des données personnelles de
tiers : effaçables à la demande, une route `DELETE` existe pour ça.
`agent_import_attestations` est la preuve d'un engagement contractuel : **elle
ne doit jamais être supprimée par une route applicative**, même quand plus une
seule adresse de l'import qu'elle couvrait n'existe. Un professionnel qui
supprime sa liste après une réclamation ne doit pas effacer au passage la
preuve qu'il avait certifié en connaître l'origine. La contrainte
`on delete restrict` de la migration 022 protège contre une régression future,
pas contre un usage prévu — aucun code de ce dépôt ne doit jamais tenter de
supprimer une ligne de cette table.

**L'attestation est écrite par le serveur, jamais reçue du client.** Le
client envoie `attestationAccepted: true` ; c'est
`IMPORT_ATTESTATION_TEXT` (la formulation exacte, pas un résumé) que le
serveur stocke — même principe que `terms_accepted_at` dans
`api/app/hermes/route.ts`. Exigée à **chaque** import, jamais une fois pour
toutes.

**Périmètre par `owner_id`, pas par zone ni par e-mail.** Une liste importée
n'a pas de zone à réconcilier : elle est toujours créée par un compte
authentifié. `nextCandidates` (`outreach.ts`) fusionne ce second bassin avec
celui des prospects recensés avant le tri et le dédoublonnage — un prospect
importé passe par exactement les mêmes barrières qu'un prospect recensé
(suppression globale, quota, dédoublonnage par adresse), aucune ne lui est
propre.

**Deux plafonds, vérifiés côté serveur avant d'écrire quoi que ce soit** :
`MAX_IMPORT_SIZE` (500 adresses par import) et
`MAX_TOTAL_IMPORTED_PROSPECTS` (2 000 par compte, tous imports cumulés).
Aucun téléphone n'est collecté sur ces listes — Hermès n'appelle personne, et
le rapport de secteur qui justifie ce champ pour les prospects recensés ne
les concerne pas.

## Ce qui reste à faire

### 1. Mise en production (à faire dans cet ordre)

1. Appliquer `016_hermes_outreach.sql` sur Supabase.
2. Créer le sous-domaine d'expédition `contact.qualifyragence.com` dans
   Resend, avec SPF, DKIM et DMARC. Renseigner `HERMES_FROM_EMAIL`.
3. Brancher le planificateur sur `POST /api/agent/outreach` avec l'en-tête
   `Authorization: Bearer $CRON_SECRET`. Fréquence conseillée : toutes les
   30 minutes en heures ouvrées.
4. **Chauffer le domaine.** Créer une campagne sur le compte de Dorian, quota
   à 5, pendant deux semaines, avant d'ouvrir à un client. Un domaine neuf qui
   part à 40 messages par jour est classé en spam immédiatement, et la
   réputation se répare beaucoup plus lentement qu'elle ne se casse.

### 2. Ce qui manque encore

- **Traitement des rebonds et des plaintes.** Le webhook Resend
  (`email.bounced`, `email.complained`) n'existe pas. Aujourd'hui une adresse
  invalide n'est supprimée que si le message d'erreur de l'envoi le laisse
  deviner (`/invalid|not exist|bounce/i`), ce qui est fragile. C'est la
  priorité numéro un après le premier envoi réel.
- **Rien ne remonte au professionnel.** Aucun écran ne montre ce qui a été
  envoyé ni combien ont répondu. `hermes_messages` et `replied_at` existent,
  personne ne les lit.
- **`replied_at` n'est jamais renseigné.** Il faudrait une boîte de réception
  surveillée ou un webhook, sinon le champ reste décoratif.
- ~~`src/lib/agent/email-extract.ts` et `places.ts` ne sont pas suivis par
  git.`~~ Résolu le 24/08/2026 : ces deux fichiers n'avaient jamais été
  branchés à rien (`agent_prospects.email` restait vide, voir la section
  ci-dessous) et ont été supprimés comme code mort. L'enrichissement
  existe désormais pour de vrai, committé, dans `src/lib/agent/osm-enrich.ts`.
- **Tests d'intégration.** `remainingQuota`, `isSuppressed` et
  `campaignCanSend` sont vérifiés par lecture de code, faute de base
  PostgreSQL de test. À remplacer par de vrais tests dès qu'une base existe.

### 3. Point commercial à trancher

Dorian veut vendre Hermès comme « une IA ». **Ce n'en est pas une** : aucun
modèle de langage n'est appelé nulle part dans le projet. Hermès interroge
Sirene, relève des adresses, remplit un gabarit écrit par le client, et envoie.
Le test `tests/no-false-promises.test.ts` interdit d'ailleurs les formulations
« agent IA » et « agent d'intelligence artificielle ».

Deux issues : garder « agent » et « automatisé », qui décrivent la réalité ; ou
ajouter réellement un modèle — par exemple pour rédiger le message à partir de
l'activité du client, ou l'adapter au secteur du destinataire. Ne pas trancher
en écrivant « IA » sans le second.

## Conventions du projet

- Réponses en français.
- Commentaires en français, et ils expliquent **pourquoi**, pas quoi. Le code
  dit déjà ce qu'il fait.
- Ne jamais inventer une donnée : un champ inconnu vaut `null` et ne s'affiche
  pas (voir `content/company.ts`).
- Ne jamais promettre une capacité que le code n'a pas. Les tests
  `no-false-promises` et `pricing-matches-entitlements` comparent le discours
  commercial à la matrice de permissions.
- Migrations idempotentes (`if not exists` partout).
- Avant chaque commit : `npx tsc --noEmit`, `npx vitest run`, `npx eslint src tests`.
- `npm run build` échoue hors réseau (polices Google). Pour vérifier le reste,
  neutraliser temporairement `src/lib/fonts.ts`, puis le restaurer.

État actuel : **161 tests**, `tsc` 0 erreur, `eslint` 0 avertissement.
