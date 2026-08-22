# 13 — Plan de validation exécutable

Ce document ne prouve rien. Il dit **quoi exécuter, dans quel ordre, et à quoi
reconnaître un succès.** Chaque point « non prouvé » des rapports précédents y
devient soit une commande, soit une requête SQL, avec le résultat attendu.

Rien ici ne suppose un accès à ton environnement : tout est à lancer depuis ta
machine ou depuis ton tableau de bord Supabase.

---

## 1. Migration

### 1.1 Compatibilité avec les migrations précédentes — vérifiée

| Dépendance de `015` | Fournie par | État |
|---|---|---|
| `auth.users` (clé étrangère) | Supabase, schéma natif | ✅ |
| `gen_random_uuid()` | `pgcrypto`, activée par défaut sur Supabase | ✅ |
| Aucune table applicative | — | ✅ `015` ne référence ni `detailers`, ni `detailer_bookings` |

`015` est **indépendante** : elle crée une table neuve et ne modifie aucune
table existante. Elle peut donc s'appliquer avant ou après n'importe laquelle
des autres, sans risque d'ordre.

### 1.2 Risques SQL identifiés — corrigés

| Risque | Effet s'il était resté | Correctif |
|---|---|---|
| Index unique **partiel** sur `stripe_subscription_id` | PostgreSQL n'infère un index partiel dans `on conflict (colonne)` que si le prédicat y est répété ; PostgREST ne l'émet jamais. **Chaque écriture du webhook aurait échoué** — aucun abonnement jamais enregistré | Index rendu total. Deux `null` restent distincts dans un index unique, le comportement voulu est conservé |
| `subscriptions_one_live_per_owner` contre un changement d'offre | Une montée en gamme crée un nouvel abonnement Stripe ; l'écriture violait la contrainte, la route renvoyait 500, Stripe rejouait en boucle | Le webhook clôture l'abonnement vivant précédent avant d'écrire |

**Aucune migration corrective n'est nécessaire** : `015` n'ayant jamais été
appliquée, elle a été corrigée sur place. Le `drop index if exists` qu'elle
contient la rend malgré tout rejouable si une version antérieure avait été
appliquée.

### 1.3 Application — base de test uniquement

**Ne jamais lancer ceci sur la base de production sans avoir lu le §1.5.**

Option A — tableau de bord Supabase (le plus simple) :

1. ouvrir le projet **de test**, onglet **SQL Editor** ;
2. coller le contenu de `supabase/migrations/015_subscriptions.sql` ;
3. exécuter.

Option B — CLI Supabase, depuis la racine du dépôt :

```bash
supabase link --project-ref <REF_DU_PROJET_DE_TEST>
supabase db push
```

### 1.4 Vérifications après application

```sql
-- 1. La table existe, avec ses 14 colonnes.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'subscriptions'
order by ordinal_position;
-- Attendu : 14 lignes, dont owner_id (uuid, NOT NULL) et plan (text, NOT NULL).

-- 2. Les contraintes de valeurs.
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.subscriptions'::regclass and contype = 'c';
-- Attendu : subscriptions_plan_check (agent, system, complete),
--           subscriptions_status_check (7 statuts),
--           subscriptions_interval_check (month, year).

-- 3. Les index.
select indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename = 'subscriptions';
-- Attendu : 5 index. Vérifier surtout que
-- subscriptions_stripe_subscription_id_key n'a AUCUN « WHERE » :
-- c'est le défaut corrigé au §1.2.

-- 4. RLS activée, et une seule politique, en lecture.
select relrowsecurity from pg_class where oid = 'public.subscriptions'::regclass;
-- Attendu : true.
select policyname, cmd, qual from pg_policies
where schemaname = 'public' and tablename = 'subscriptions';
-- Attendu : UNE ligne, cmd = SELECT. Aucune politique INSERT/UPDATE/DELETE :
-- c'est ce qui empêche un client de changer son propre plan.

-- 5. La migration est rejouable.
-- Ré-exécuter tout le fichier : aucune erreur ne doit apparaître.
```

### 1.5 Impossibilité pour un client de modifier son abonnement

Depuis le **SQL Editor**, en se plaçant dans le rôle d'un utilisateur connecté :

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<UUID_UTILISATEUR_TEST>","role":"authenticated"}';

-- Doit renvoyer ses lignes, et seulement les siennes.
select id, plan, status from public.subscriptions;

-- Doit ÉCHOUER : aucune politique d'écriture n'existe.
update public.subscriptions set plan = 'complete' where owner_id = '<UUID_UTILISATEUR_TEST>';
-- Attendu : « new row violates row-level security policy »
--           ou 0 ligne affectée. Si une ligne est modifiée, ARRÊTER : faille.

rollback;
```

### 1.6 Avant de toucher à la production

Un compte existant n'a **aucune ligne** dans `subscriptions`. Dès la migration
appliquée, `getEntitlement` renvoie `null` et **tous ses accès sont refusés** —
comportement voulu, mais à anticiper :

```sql
-- À exécuter AVANT d'ouvrir l'espace pro, pour chaque compte à conserver.
insert into public.subscriptions
  (owner_id, plan, status, billing_interval, current_period_end)
values
  ('<UUID_DU_COMPTE>', 'complete', 'active', 'month', now() + interval '1 year');
```

---

## 2. Build et tests

Scripts réellement présents dans `package.json` :

| Besoin | Commande | Exécutée ici | Résultat observé |
|---|---|---|---|
| Tests | `npm test` | ✅ | 15 fichiers, 123 tests, tous verts |
| Types | `npm run typecheck` | ✅ | aucune erreur |
| Lint | `npm run lint` | ✅ | 1 erreur, sur `scratch-einvoice-test.ts` (brouillon gitignoré) |
| Lint (code réel) | `npx eslint src tests` | ✅ | propre |
| Variables | `npm run check:env` | ✅ | complètes en mode développement |
| Variables (prod) | `npm run check:env -- --prod` | ✅ | **10 manquantes** — détail au §5 |
| Build | `npm run build` | ❌ | **bloqué par l'environnement** : `Failed to fetch Inter from Google Fonts`, blocage réseau du bac à sable, sans rapport avec le code. **À relancer chez toi.** |

Il n'existe **aucun script de test d'intégration** : la suite est entièrement
composée de tests unitaires, sans base ni réseau. C'est une limite assumée,
pas un oubli — mais c'est aussi pourquoi les §3 et §4 ci-dessous restent
manuels.

---

## 3. Scénario Stripe en mode test

**Prérequis :** les six `STRIPE_PRICE_*` et `STRIPE_SECRET_KEY` en `sk_test_…`
sont absents de ton `.env.local` (vérifié au §5). Ce scénario ne peut pas être
lancé avant de les avoir renseignés.

### 3.1 Écouter les webhooks en local

```bash
stripe login
stripe listen --forward-to localhost:3000/api/billing/webhook
```

La commande affiche un secret `whsec_…`. Le poser dans `.env.local` :

```bash
STRIPE_BILLING_WEBHOOK_SECRET=whsec_…
```

Puis **redémarrer** `npm run dev` — Next ne relit pas `.env.local` à chaud.

### 3.2 Créer un client et un abonnement de test

```bash
# 1. Client, avec l'e-mail EXACT d'un compte Supabase existant :
#    c'est par cet e-mail que le webhook retrouve le propriétaire.
stripe customers create --email "ton-compte-test@exemple.fr"
# → note l'identifiant cus_…

# 2. Abonnement, avec le plan en métadonnée.
stripe subscriptions create \
  --customer cus_… \
  --items "[{\"price\":\"$STRIPE_PRICE_AGENT_MONTHLY\"}]" \
  --metadata "plan=agent,cadence=month"
# → note l'identifiant sub_…
```

Stripe émet `customer.subscription.created`, que `stripe listen` transmet.

### 3.3 Vérifier la ligne créée

```sql
select owner_id, plan, status, billing_interval,
       stripe_customer_id, stripe_subscription_id, current_period_end
from public.subscriptions
where stripe_subscription_id = 'sub_…';
```

**Attendu :** une ligne, `plan = 'agent'`, `status = 'active'`, `owner_id`
correspondant au compte Supabase de l'e-mail utilisé.

**Si zéro ligne :** lire les journaux du serveur. Deux messages possibles,
tous deux volontaires :

- `provisioning refusé (unknown-plan)` → la métadonnée `plan` manque **et**
  l'identifiant de prix n'est pas reconnu ;
- `compte introuvable` → aucun utilisateur Supabase ne porte cet e-mail.

### 3.4 Vérifier l'accès réellement obtenu

Se connecter à `/app/login` avec ce compte, puis :

| Vérification | Attendu |
|---|---|
| Arrivée après connexion | `/app/prospection` — **pas** `/app` |
| `/app` | écran verrouillé, « Pas inclus dans votre offre » |
| `/app/invoices` | écran verrouillé |
| `/app/abonnement` | « Agent seul », statut et échéance affichés |

Puis l'appel direct, qui est le vrai test :

```bash
# Récupérer le cookie de session dans l'inspecteur du navigateur.
curl -i -X POST http://localhost:3000/api/app/invoices \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-access-token=…' \
  -d '{"clientName":"Test","description":"Test","unitPriceHt":100}'
```

**Attendu : `HTTP/1.1 403`** avec `{"error":"forbidden","reason":"plan-excludes"}`.
Un `200` signifierait que le contrôle serveur ne fonctionne pas — **arrêter
tout et me le signaler**.

### 3.5 Rejouer le même événement — pas de doublon

```bash
stripe events resend evt_…   # identifiant lisible dans la sortie de `stripe listen`
```

```sql
select count(*) from public.subscriptions where stripe_subscription_id = 'sub_…';
```

**Attendu : `1`.** Un `2` signifierait que l'`upsert` n'a pas trouvé l'index
unique — le défaut corrigé au §1.2 serait revenu.

### 3.6 Changement d'offre

```bash
stripe subscriptions update sub_… \
  --items "[{\"price\":\"$STRIPE_PRICE_COMPLET_MONTHLY\"}]" \
  --metadata "plan=complete"
```

```sql
select plan, status from public.subscriptions where owner_id = '<UUID>' order by created_at desc;
```

**Attendu :** un seul abonnement `active`, en `complete`. Les éventuels
précédents sont en `canceled`, jamais supprimés.

### 3.7 Résiliation

```bash
stripe subscriptions cancel sub_…
```

```sql
select status from public.subscriptions where stripe_subscription_id = 'sub_…';
```

**Attendu : `canceled`.** La ligne existe toujours — aucune donnée supprimée.
Dans l'interface : les factures restent consultables, la création est refusée.

---

## 4. Isolation entre propriétaires

### 4.1 Ce qui est déjà prouvé automatiquement

`tests/owner-isolation.test.ts` — 6 tests, exécutés et verts. Un double du
client Supabase enregistre les filtres réellement construits :

| Vérification | Prouvé |
|---|---|
| L'abonnement est lu avec un filtre `owner_id` | ✅ |
| La réservation d'un autre n'est pas reconnue comme sienne | ✅ deux filtres, `id` **et** `detailer_id` |
| Une erreur de base ne vaut jamais autorisation | ✅ |
| Le changement de statut filtre sur les deux colonnes | ✅ |
| Un statut non autorisé est refusé avant toute requête | ✅ |

Ces tests prouvent que **la requête est bien construite**. Ils ne prouvent pas
que PostgreSQL l'applique — d'où le §4.2.

### 4.2 Ce qui demande deux comptes réels

Créer deux comptes, A et B, chacun avec sa fiche et au moins une réservation.
Connecté en **A**, avec un identifiant appartenant à **B** :

| Test | Commande | Attendu |
|---|---|---|
| Lire une facture de B | ouvrir `/app/invoices/<ID_DE_B>` | 404 ou redirection |
| Modifier une réservation de B | `POST /api/app/bookings/<ID_DE_B>/status` | échec, aucune modification |
| Rattacher une réservation de B à une facture de A | `POST /api/app/invoices` avec `bookingId` de B | **404 « Réservation introuvable »** |
| Lire une zone de prospection de B | ouvrir `/app/prospection/<ID_DE_B>` | aucune donnée |

Vérification finale, en base :

```sql
select i.number, i.detailer_id, b.detailer_id as booking_detailer
from public.invoices i
left join public.detailer_bookings b on b.id = i.booking_id
where i.booking_id is not null and i.detailer_id <> b.detailer_id;
-- Attendu : ZÉRO ligne. Toute ligne ici est un rattachement croisé.
```

---

## 5. Variables d'environnement

`.env.example` documente les 22 variables : rôle, obligation en développement,
obligation en production, et **comportement en cas d'absence** — c'est cette
dernière colonne qui compte, aucune de ces absences ne provoquant d'erreur
bruyante.

Contrôle exécutable :

```bash
npm run check:env            # développement
npm run check:env -- --prod  # production, exige tout
```

Il n'affiche que des **noms**, jamais de valeurs : utilisable dans une chaîne
de déploiement sans risque de fuite. Il sort en code 1 si une variable manque.

**Résultat réellement observé le 22/08/2026 sur ce dépôt :**

- mode développement → complètes ;
- mode production → **10 manquantes** : les six `STRIPE_PRICE_*`,
  `STRIPE_SECRET_KEY`, `STRIPE_BILLING_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`,
  `BOOKING_FROM_EMAIL`.

Conséquence directe : **le scénario du §3 ne peut pas être lancé en l'état.**
`CRON_SECRET`, `INSEE_API_KEY` et `RESEND_API_KEY` sont, elles, présentes.

Ce contrôle est volontairement **non bloquant au démarrage** : couper la page
d'accueil parce que la clé Resend manque serait une régression, pas une
protection.

---

## 6. Origine des identités propriétaires — audit complet

Règle : toute identité doit venir de la session, de la base ou d'un secret
serveur. Jamais d'un champ libre du navigateur.

| Route | Identité utilisée | Origine | Verdict |
|---|---|---|---|
| `api/app/agent-zones` | `detailer.id` | `getDetailerForOwner(session.id)` | ✅ |
| `api/app/cases` | `detailer.id` | session | ✅ |
| `api/app/pricing` | `detailer.id` | session | ✅ |
| `api/app/invoices` | `detailer.id` | session | ✅ |
| `api/app/invoices` — `bookingId` | fourni par le client | **vérifié** depuis le 22/08/2026 | ✅ corrigé |
| `api/app/invoices/[id]/xml` | `detailer.id` | session | ✅ |
| `api/app/bookings/[id]/status` | `detailer.id` + `id` d'URL | filtre sur les **deux** colonnes | ✅ |
| `api/app/bookings/complete` | `bookingId` du corps | comparé à `owned.id` avant écriture | ✅ |
| `api/app/stripe-connect` | `detailer.id` | session | ✅ |
| `api/detailing/checkout` | `bookingId` du corps | route publique ; le droit est celui du **propriétaire de la fiche**, relu en base | ✅ |
| `api/detailing/[slug]/bookings` | `slug` d'URL | droit du propriétaire, relu en base | ✅ depuis le 22/08/2026 |
| `api/detailing/booking-recovery` | `row.detailer_id` | lu en base, jamais reçu | ✅ |
| `api/billing/webhook` | `owner_id` | résolu par identifiant client Stripe puis e-mail, après vérification de signature | ✅ |

**Une anomalie a été trouvée et corrigée pendant cet audit** :
`api/app/invoices` acceptait un `bookingId` du navigateur sans vérifier qu'il
appartenait au professionnel. Aucune donnée d'autrui n'était lue — la page de
facture ne joint pas la réservation — mais la clé étrangère pouvait pointer
vers les données d'un autre, et toute jointure ajoutée plus tard aurait
transformé l'anomalie en fuite.
