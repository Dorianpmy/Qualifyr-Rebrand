# 11 — Variables d'environnement

**Aucun secret n'est versionné.** `.env.example` est le seul fichier d'environnement dans le
dépôt, et il ne contient **aucune valeur**. `.env`, `.env.local` et `.env.*.local` sont
ignorés par Git.

**Comment lire ce document.** Trois provenances, marquées à chaque fois :

- **[dépôt]** — vérifiable directement dans le code au moment de la rédaction (24/08/2026) :
  `src/lib/env-check.ts`, `.env.example`, les appels `process.env` eux-mêmes.
- **[Dorian, 24/08/2026]** — confirmé par le propriétaire du projet, non vérifiable depuis le
  dépôt : ce document n'a accès ni à Netlify, ni à Resend, ni à Supabase.
- **[à vérifier]** — ni l'un ni l'autre. Un état à constater avant de s'y fier, pas une
  hypothèse à traiter comme acquise.

Ce dernier chantier de mise à jour (24/08/2026) fait suite à un incident réel : trois
variables (`CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`) manquaient au
recensement `REQUIRED_ENV` pendant que la production tournait sans elles, sans qu'aucun
contrôle ne le signale — voir `src/lib/env-check.ts` et le commit `8d61b4c`. Un document qui
affirme un état non constaté produit exactement ce genre d'incident.

---

## 1. Recensement complet — `REQUIRED_ENV` **[dépôt]**

`npm run check:env` (`scripts/check-env.mjs`) lit `src/lib/env-check.ts` et vérifie la seule
**présence** de chaque variable — jamais sa valeur, pour qu'aucun secret ne puisse fuir par
ses messages. 21 variables recensées à ce jour.

| Variable | Requise en dev | Sans elle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | oui | Aucune connexion possible : l'espace pro est inutilisable |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | La connexion par lien magique échoue sans message |
| `SUPABASE_SERVICE_ROLE_KEY` | oui | Le webhook ne peut rien écrire ; tous les droits sont refusés, y compris aux abonnés légitimes |
| `STRIPE_SECRET_KEY` | non | Aucun abonnement ne peut être souscrit |
| `STRIPE_BILLING_WEBHOOK_SECRET` | non | Le webhook répond 503 : un client paie, Stripe encaisse, aucun droit n'est accordé |
| `STRIPE_WEBHOOK_SECRET` | non | Les acomptes payés ne sont jamais confirmés |
| `STRIPE_PRICE_AGENT_MONTHLY` | non | L'offre Agent seul en mensuel n'est pas souscriptible |
| `STRIPE_PRICE_AGENT_ANNUAL` | non | L'offre Agent seul en annuel n'est pas souscriptible |
| `STRIPE_PRICE_SYSTEME_MONTHLY` | non | L'offre Système seul en mensuel n'est pas souscriptible |
| `STRIPE_PRICE_SYSTEME_ANNUAL` | non | L'offre Système seul en annuel n'est pas souscriptible |
| `STRIPE_PRICE_COMPLET_MONTHLY` | non | L'offre Pack complet en mensuel n'est pas souscriptible |
| `STRIPE_PRICE_COMPLET_ANNUAL` | non | L'offre Pack complet en annuel n'est pas souscriptible |
| `CRON_SECRET` | non | Aucune tâche planifiée ne s'exécute : ni analyse, ni relance, ni avis, ni prospection |
| `INSEE_API_KEY` | non | Aucune analyse de secteur n'aboutit |
| `RESEND_API_KEY` | non | L'analyse aboutit mais aucun rapport n'est envoyé |
| `BOOKING_FROM_EMAIL` | non | Repli sur un domaine de test Resend qui ne livre qu'au propriétaire du compte : rapports et confirmations n'arrivent chez personne |
| `CONTACT_TO_EMAIL` | non | Formulaires de contact et d'estimation en 503 |
| `CONTACT_FROM_EMAIL` | non | Même effet, plus la perte silencieuse des confirmations de zone et des relances d'abonnement |
| `RESEND_WEBHOOK_SECRET` | non | Aucun rebond ni plainte n'alimente la liste de suppression Hermès |
| `HERMES_FROM_EMAIL` | non | La prospection Hermès n'envoie rien — aucun repli sur le domaine transactionnel |
| `MISTRAL_API_KEY` | non | Le classement des prospects par pertinence ne s'applique pas ; ordre d'origine conservé |

Pour le détail de chaque variable — dans quels cas précis un repli silencieux serait
dangereux, pourquoi certaines n'en ont délibérément aucun — lire les commentaires en tête de
chaque entrée dans `src/lib/env-check.ts` : c'est la source, ce tableau n'en est qu'un miroir.

**Variables publiques, hors `REQUIRED_ENV`** (préfixe `NEXT_PUBLIC_`, jamais un secret) :
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_INDEXABLE`, `NEXT_PUBLIC_QUALIFYR_BOOKING_URL`,
`NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER`, `GOOGLE_SITE_VERIFICATION`, `WHATSAPP_TOKEN`,
`WHATSAPP_PHONE_NUMBER_ID` — non bloquantes, chacune dégrade une fonctionnalité secondaire
sans elle. Détail en section 4.

**Aucune variable secrète ne porte le préfixe `NEXT_PUBLIC_`.** Ce préfixe expose la valeur
au navigateur.

---

## 2. État en production **[Dorian, 24/08/2026, sauf mention contraire]**

Dorian confirme que les six variables suivantes sont posées en production :

| Variable | Confirmée posée |
|---|---|
| `RESEND_API_KEY` | oui |
| `CONTACT_FROM_EMAIL` | oui |
| `CONTACT_TO_EMAIL` | oui |
| `BOOKING_FROM_EMAIL` | oui |
| `HERMES_FROM_EMAIL` | oui |
| `RESEND_WEBHOOK_SECRET` | oui |

**Les 15 autres variables de `REQUIRED_ENV` — Supabase (×3), Stripe (×8), `CRON_SECRET`,
`INSEE_API_KEY`, `MISTRAL_API_KEY` — n'ont pas été confirmées posées dans ce cadrage.** Le
site dépend visiblement de Supabase et Stripe pour fonctionner (espace pro accessible,
abonnements proposés), ce qui les rend probables — mais « probable » n'est pas « confirmé »,
et ce document ne transforme pas l'un en l'autre. **[à vérifier]** : lister ces 15 variables
dans Netlify (Site configuration → Environment variables) et confirmer chacune.

### Domaines d'envoi Resend

Deux domaines distincts existent chez Resend, à des fins différentes — le principe (deux
domaines, deux réputations, l'un ne doit jamais contaminer l'autre) est documenté dans le
code, voir `HERMES_FROM_EMAIL` dans `src/lib/env-check.ts` :

- `contact.qualifyragence.com` — expédition Hermès (`HERMES_FROM_EMAIL`). Nom du sous-domaine
  **[dépôt]** : cité dans `src/lib/env-check.ts`, `src/app/api/agent/outreach/route.ts` et
  `docs/14-hermes-prompt-claude-code.md` comme le sous-domaine attendu ; son existence
  effective chez Resend et la validité de ses enregistrements DNS (SPF, DKIM, DMARC) sont
  **[Dorian, 24/08/2026]**.
- `notifications.qualifyragence.com` — transactionnel (`BOOKING_FROM_EMAIL`,
  `CONTACT_FROM_EMAIL`). Nom **[Dorian, 24/08/2026]** uniquement : aucune trace de ce
  sous-domaine précis dans le dépôt, qui ne code que le nom de variable, jamais la valeur.

**[à vérifier]** : que les deux domaines sont bien vérifiés chez Resend (DNS propagés, statut
« Verified », pas seulement créés) — un domaine créé mais non vérifié fait échouer l'envoi
silencieusement côté Resend.

---

## 3. Détail par variable

### Supabase — **[dépôt]** pour le rôle, **[à vérifier]** pour la présence en production

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publiques par construction
  (préfixe `NEXT_PUBLIC_`), mais **pas dans le tableau des variables publiques** de la
  section 1 : elles sont dans `REQUIRED_ENV` avec `requiredInDev: true`, donc bloquantes même
  en local.
- `SUPABASE_SERVICE_ROLE_KEY` — **secrète**, contourne les politiques RLS. Ne jamais
  l'exposer côté client ; `src/lib/detailing/supabase-server.ts` est le seul point qui la lit.

### Stripe — **[dépôt]** pour le rôle, **[à vérifier]** pour la présence en production

`STRIPE_SECRET_KEY` (secrète) et `STRIPE_BILLING_WEBHOOK_SECRET` /
`STRIPE_WEBHOOK_SECRET` (secrètes, deux webhooks distincts — abonnements Qualifyr d'un côté,
acomptes clients des professionnels via Stripe Connect de l'autre, voir
`src/lib/billing/stripe.ts` et `src/lib/detailing/stripe.ts`). Les six `STRIPE_PRICE_*`
attendent chacune un identifiant de Price Stripe (`price_...`) — détail complet, y compris
les montants attendus, dans `docs/15-etude-extension-verticale.md` si renseigné, sinon à
établir séparément.

### `CRON_SECRET` — **[dépôt]** pour le rôle, **[Dorian]** pour hermes-outreach-cron uniquement

Secret partagé entre les cinq fonctions planifiées Netlify (`netlify/functions/*.ts`) et les
routes qu'elles appellent : `agent-process-cron`, `booking-recovery-cron`,
`review-dispatch-cron`, `hermes-outreach-cron`, `agent-relevance-cron`. Sans lui, chaque route
répond `401` et la fonction planifiée elle-même répond `500` sans jamais journaliser le
secret — voir le commentaire d'en-tête de chaque fichier `netlify/functions/*-cron.ts`.

Dorian confirme que `hermes-outreach-cron` tourne sur Netlify **[Dorian, 24/08/2026]**. Les
quatre autres fonctions planifiées sont présentes dans le dépôt mais leur exécution effective
en production n'a pas été confirmée dans ce cadrage — **[à vérifier]** : Netlify → Functions →
onglet Scheduled, pour chacune des cinq.

### `INSEE_API_KEY`

Clé de l'API Sirene de l'INSEE, pour le recensement d'entreprises (`lib/agent/sirene.ts`).

### `RESEND_API_KEY`

Partagée entre tous les usages Resend du projet (formulaires, réservations, Hermès, webhook).
Une seule clé, à portée d'envoi uniquement — inutile de lui donner les droits de lecture ou
d'administration de domaine.

> **Si cette clé fuite**, la révoquer immédiatement chez Resend. Une clé exposée permet
> d'envoyer depuis les deux domaines vérifiés.

### `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL`

Les trois variables `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` vont ensemble —
`emailEnv()` (`src/lib/env.ts`) ne renvoie une configuration que si les trois sont présentes.
Une seule manquante suffit à considérer l'envoi comme non configuré. Voir la section 5 pour le
comportement exact selon l'environnement.

### `BOOKING_FROM_EMAIL`

Expéditeur des e-mails de réservation (confirmation client, notification professionnel,
relance de panier abandonné — `src/lib/detailing/email.ts`). **Aucun repli en production** :
si absente, ces trois fonctions d'envoi refusent explicitement plutôt que de retomber sur le
domaine de test Resend (`onboarding@resend.dev`), qui accepte l'envoi sans erreur mais ne
livre qu'au propriétaire du compte Resend — un faux succès. Repli conservé hors production
uniquement, pour dérouler le parcours sans configuration.

### `HERMES_FROM_EMAIL`

Expédition Hermès, sur `contact.qualifyragence.com` — voir section 2. Distincte de
`BOOKING_FROM_EMAIL` sans aucune exception : un repli de l'une vers l'autre contaminerait la
réputation du domaine transactionnel avec celle de la prospection.

### `RESEND_WEBHOOK_SECRET`

Vérifie la signature Svix des événements Resend (`email.bounced`, `email.complained`) reçus
sur `/api/agent/outreach/webhook`. Sans elle, aucun rebond ni plainte n'alimente
`hermes_suppressions` : Hermès continue d'écrire à des adresses mortes jusqu'à ce que l'erreur
de l'envoi lui-même le laisse deviner.

### `MISTRAL_API_KEY`

Classement des prospects Hermès par pertinence (`lib/agent/relevance.ts`), calculé une fois
par zone, jamais dans la route d'envoi. Absente : la file reste dans son ordre d'origine, rien
ne bloque — voir `CLAUDE.md`, section Hermès, garde-fou 3.

---

## 4. Variables publiques (hors `REQUIRED_ENV`)

### `NEXT_PUBLIC_SITE_URL`

URL canonique, sans barre oblique finale. Sans elle, repli sur `https://qualifyragence.com`
(`src/lib/env.ts`, `siteUrl()`) — le vrai domaine de production, pas une valeur de test.
`netlify.toml` la fixe explicitement à `https://qualifyragence.com` dans les trois contextes
(`production`, `deploy-preview`, `branch-deploy`) **[dépôt]**.

### `NEXT_PUBLIC_SITE_INDEXABLE`

Interrupteur SEO. `netlify.toml` la fixe à `"true"` pour le contexte **production** et
`"false"` pour `deploy-preview` et `branch-deploy` **[dépôt]**. Vérifié directement contre le
site en production le 24/08/2026 : `robots.txt` autorise l'indexation (pas de blocage
global), et `sitemap.xml` contient 30 URL (17 pages déclarées dans `pageMeta` plus les articles
de blog) **[vérifié en production, 24/08/2026]** — cohérent avec un contexte de déploiement
production actif.

### `GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_QUALIFYR_BOOKING_URL`,
### `NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

Chacune dégrade une fonctionnalité secondaire sans casser le reste — détail dans
`.env.example`, en commentaire au-dessus de chaque ligne.

---

## 5. Les trois variables d'e-mail « contact » vont ensemble

| Situation | Comportement |
|---|---|
| Les trois présentes | Resend. Notification à Qualifyr + accusé de réception. |
| Incomplet, **hors production** | Transport console : l'e-mail est écrit dans le terminal avec la liste des variables manquantes. Aucun accusé de réception. |
| Incomplet, **en production** | Réponse `503`. Jamais de faux succès. |

Mieux vaut dire franchement qu'on ne peut pas envoyer que laisser croire qu'un message est
parti — c'est le même principe qui gouverne `BOOKING_FROM_EMAIL` et `HERMES_FROM_EMAIL` : voir
`src/lib/email/transport.ts` (`resolveTransport()`) pour l'implémentation de référence, reprise
telle quelle par les deux autres.

---

## 6. En développement

```bash
cp .env.example .env.local
```

Puis renseigner, au minimum, les trois variables `requiredInDev: true`
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) —
sans elles, l'espace pro est inutilisable même en local. Tout le reste peut rester vide : les
formulaires se remplissent, se valident, et l'e-mail complet s'affiche dans le terminal avec la
liste des variables manquantes.

```bash
npm run check:env
```

Lance le contrôle explicite — jamais bloquant au démarrage, volontairement (voir l'en-tête de
`src/lib/env-check.ts`).

---

## 7. En production, sur Netlify

Site configuration → Environment variables. Après ajout ou modification : **redéployer** — les
variables sont lues au démarrage, pas à chaud. `NEXT_PUBLIC_SITE_INDEXABLE=true` est réservée
au contexte **Production** (déjà le cas dans `netlify.toml`, section 4).

**[à vérifier]** : lancer `npm run check:env` avec les vraies variables de production (en
local, via une copie des valeurs Netlify dans `.env.local` temporaire, jamais commitée) pour
confirmer les 15 variables non encore listées en section 2.

---

## 8. Vérifier qu'aucun secret n'a été commité

```bash
# Le dépôt ne doit contenir que .env.example
git ls-files | grep -E '^\.env'

# Aucune clé Resend, Stripe ou Supabase dans l'historique
git log -p --all | grep -nE 're_[A-Za-z0-9]{20,}|sk_(live|test)_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{20,}'

# Aucune valeur dans .env.example
grep -E '=.+' .env.example
```

Les trois doivent être vides, à l'exception de `.env.example` dans la première.

**Si une clé a été commitée** : la révoquer chez le fournisseur d'abord, en générer une
nouvelle, puis seulement nettoyer l'historique. Retirer un secret de l'historique ne le rend
pas inoffensif — il a pu être lu.

---

## 9. Ce qui n'existe plus dans ce document

Une version antérieure de ce document listait « Base de données », « Authentification » et
« CMS » comme volontairement absents. C'était vrai avant l'introduction de Supabase — ça ne
l'est plus : Supabase porte la base (abonnements, zones, prospects, campagnes Hermès,
réservations) et l'authentification de l'espace pro. Le contenu marketing continue de vivre
dans `src/content/`, versionné, sans CMS.
