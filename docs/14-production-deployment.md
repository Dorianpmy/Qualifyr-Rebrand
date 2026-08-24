# 14 — Déploiement production

## Comment lire ce document

Trois provenances, marquées à chaque fois :

- **[dépôt]** — vérifiable directement dans le code (`netlify.toml`, `src/middleware.ts`,
  `src/lib/env-check.ts`, les migrations) au moment de la rédaction (24/08/2026).
- **[vérifié en production, 24/08/2026]** — constaté en interrogeant directement le site
  public (`qualifyragence.com`), sans accès aux tableaux de bord Netlify, Resend ou Supabase.
- **[Dorian, 24/08/2026]** — confirmé par le propriétaire du projet, ni dans le dépôt ni
  vérifiable depuis le site public.
- **[à vérifier]** — aucune des trois. Un état à constater, pas une hypothèse.

Ce document a été substantiellement réécrit le 24/08/2026 : les sections qui suivent
décrivaient un hébergeur (Vercel) et un état (« production non déployée ») qui ne
correspondent plus à la réalité depuis longtemps. L'historique de cette migration abandonnée
est conservé en fin de document, condensé, pour ne pas perdre la trace des décisions prises —
mais il ne décrit plus l'état courant.

---

## État actuel

### Hébergement — **[dépôt]**

Netlify, pas Vercel. `netlify.toml` définit les variables par contexte de déploiement
(`production`, `deploy-preview`, `branch-deploy`) et les redirections du sous-domaine `app.` ;
cinq fonctions planifiées vivent dans `netlify/functions/` :

| Fonction | Route appelée | Fréquence |
|---|---|---|
| `agent-process-cron.ts` | `POST /api/agent/process` | `*/15 * * * *` |
| `booking-recovery-cron.ts` | `POST /api/detailing/booking-recovery` | `*/15 * * * *` |
| `review-dispatch-cron.ts` | `POST /api/detailing/review-dispatch` | `0 * * * *` |
| `hermes-outreach-cron.ts` | `POST /api/agent/outreach` | `*/30 7-16 * * 1-5` |
| `agent-relevance-cron.ts` | `POST /api/agent/relevance` | `*/15 * * * *` |

Dorian confirme que `hermes-outreach-cron` s'exécute réellement **[Dorian, 24/08/2026]**. Les
quatre autres sont présentes dans le dépôt et déployées avec le site (Netlify détecte
automatiquement tout fichier de ce dossier), mais leur exécution effective n'a pas été
confirmée dans ce cadrage. **[à vérifier]** : Netlify → Functions → Scheduled, pour les quatre
restantes — une fonction non détectée par Netlify ne le signale nulle part ailleurs que là.

### Domaine et redirection `app.` — **[dépôt + vérifié en production]**

`https://qualifyragence.com` sert le site, l'espace pro (`/app/...`) et l'API. Le sous-domaine
`app.qualifyragence.com` est un alias sans contenu propre : `netlify.toml` le redirige (301,
`force = true`) — la racine vers `/app/login`, tout le reste vers le même chemin sur le domaine
principal. `src/middleware.ts` porte une redirection équivalente, rendue inopérante par la
règle Netlify mais conservée pour l'ancien hôte de préproduction (voir le commentaire en tête
de `netlify.toml`).

Vérifié directement le 24/08/2026 : `https://app.qualifyragence.com/` répond bien par une
redirection 301 vers `https://qualifyragence.com/app/login`.

### Indexation — **[dépôt + vérifié en production]**

`netlify.toml` fixe `NEXT_PUBLIC_SITE_INDEXABLE=true` pour le contexte production. Vérifié le
24/08/2026 contre le site public : `robots.txt` autorise l'indexation (règles spécifiques pour
certains robots — OAI-SearchBot, PerplexityBot, Google-Extended — plus une règle générale ;
`/api/`, `/design-system`, `/go/`, `/app/`, `/reservation/` et `/desinscription/` exclus,
logiquement : ce sont des routes fonctionnelles, pas du contenu éditorial) ; `sitemap.xml`
contient 30 URL — les 17 pages déclarées dans `src/content/site.ts` (`pageMeta`) plus 13
articles de blog.

### Base de données — **[Dorian pour l'application des migrations, dépôt pour leur contenu]**

Supabase, pas d'absence de base comme l'affirmait une version antérieure de ce document.
Migrations présentes dans `supabase/migrations/` : `001` à `020`. Dorian confirme que les
migrations `016` à `019` sont appliquées en production **[Dorian, 24/08/2026]**. La migration
`020` (colonnes de classement par pertinence Hermès, `agent_prospects.relevance_score`,
`hermes_campaigns.activity_description`) a été écrite dans une session postérieure à cette
confirmation et **n'a pas été explicitement confirmée appliquée** — **[à vérifier]**. Les
migrations `001` à `015` sont antérieures à ce cadrage et supposées appliquées (le produit
qu'elles portent — réservations, factures, abonnements — fonctionne visiblement), sans
confirmation explicite non plus dans cette session — **[à vérifier]** si un doute existe.

### Variables d'environnement

Détail complet : `docs/11-variables-environnement.md`. Résumé : 6 variables confirmées posées
(`RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`, `BOOKING_FROM_EMAIL`,
`HERMES_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`), 15 autres non confirmées dans ce cadrage
(Supabase ×3, Stripe ×8, `CRON_SECRET`, `INSEE_API_KEY`, `MISTRAL_API_KEY`).

### Domaines d'envoi Resend — **[Dorian, 24/08/2026]**

Deux domaines distincts : `notifications.qualifyragence.com` pour le transactionnel
(réservations, factures), `contact.qualifyragence.com` pour Hermès. Le principe qui les sépare
(deux réputations, l'une ne doit jamais contaminer l'autre) est documenté dans le code — voir
`docs/11`, section 2, pour le détail des sources.

### Informations légales — **[dépôt]**, correction importante

Une version antérieure de ce document affirmait `legalNoticeIsComplete()` renvoie `false` et
listait dix informations manquantes. **Ce n'est plus vrai.** À la lecture de
`src/content/company.ts` le 24/08/2026 : `legalName`, `legalForm`, `registrationNumber`,
`address`, `publicationDirector`, `hosting` et `email` sont tous renseignés — les sept champs
que vérifie `legalNoticeIsComplete()`. La fonction renvoie donc **`true`**.

**Un écart demeure, mais il est délibéré et documenté, pas un oubli** : `address` est
renseignée (siège = domicile personnel de Dorian) mais retirée de l'affichage public via
`withheldFromPublicNotice` — sur sa demande explicite du 22/08/2026, en connaissance du fait
que cela crée un écart à l'article 6 de la LCEN (qui impose la publication de l'adresse du
siège). Le commentaire de `company.ts` décrit la solution durable : une domiciliation
commerciale, après quoi retirer `'address'` de `withheldFromPublicNotice` suffit à publier une
adresse professionnelle plutôt que personnelle.

### Sous-traitants déclarés dans la politique de confidentialité — **[dépôt]**

`src/content/company.ts` exporte `processors`, lu dynamiquement par
`/politique-de-confidentialite` (`src/app/politique-de-confidentialite/page.tsx`) — un
sous-traitant ajouté ici apparaît sur la page sans autre modification. À ce jour, seul
Netlify y figure. Supabase, Resend, Stripe (et Mistral, une fois le classement par pertinence
réellement en production) ne sont pas encore déclarés — chantier distinct, en cours.

Note technique découverte pendant cette relecture : la page calcule un badge « Aucune
revente » via `processors.length <= 1`, qui deviendra faux dès l'ajout d'un deuxième
sous-traitant légitime — alors que recourir à un sous-traitant RGPD n'est pas revendre des
données. Cette condition devra être revue au moment de déclarer les sous-traitants manquants,
sans quoi le badge disparaîtrait à tort plutôt que de rester vrai sous une autre forme.

### Tests et contrôles — **[dépôt]**

`npx vitest run` : **274 tests**, tous verts au 24/08/2026. `npx tsc --noEmit` et
`npx eslint src tests netlify` : propres. Chiffres antérieurs de ce document (47, 53, 77
tests) obsolètes, remplacés par cette valeur — à réévaluer à chaque nouvelle session, ce
n'est pas un nombre figé.

---

## Ce qui reste à vérifier avant de considérer la production pleinement saine

Aucun de ces points n'est un blocage constaté — ce sont des zones où ce document ne peut pas
conclure, faute d'accès :

1. Les 15 variables d'environnement non confirmées (section « Variables d'environnement »
   ci-dessus, détail dans `docs/11`).
2. L'exécution réelle des quatre fonctions planifiées autres que `hermes-outreach-cron`.
3. La vérification effective des deux domaines Resend (DNS, statut chez Resend) — un domaine
   créé mais non vérifié fait échouer l'envoi silencieusement.
4. L'application de la migration `020`.
5. L'existence réelle des six Prices Stripe attendus par le code — voir le chantier dédié.

---

## Historique — migration Vercel abandonnée, condensé

Une tentative de bascule vers Vercel a été préparée entre fin juillet et début août 2026 :
projet Vercel `dorianpmys-projects/qualifyr-rebrand` authentifié et lié, domaine jamais
connecté, aucun déploiement production jamais créé sur cette plateforme. Les blocages
identifiés à l'époque (sauvegarde de l'ancien site Netlify historique, informations légales
incomplètes, variables d'e-mail absentes, validation des redirections d'anciennes URL)
n'ont, pour la plupart, plus cours aujourd'hui — le site tourne sur Netlify, les informations
légales sont complètes au sens de `legalNoticeIsComplete()` (voir ci-dessus), les variables
d'e-mail confirmées sont posées.

Ce que cet historique laisse en suspens et que personne n'a tranché explicitement depuis :

- Le sort du projet Netlify historique (`qualifyragence`, avant la refonte) — plan de repli
  documenté dans `docs/13-rollback-plan.md`, projet à ne pas supprimer sauf décision
  explicite.
- Les anciennes URL sans équivalent confirmé dans la nouvelle arborescence
  (`/ressources/`, `/blog/` historique, `/services/*`) — seule `/diagnostic.html` →
  `/diagnostic` a une redirection actée.
- La délégation DNS (Netlify/NS1 au moment de l'audit d'août) — non revérifiée depuis.

Le détail complet des déploiements successifs (identifiants, URL immuables, dates) reste dans
l'historique Git de ce fichier si nécessaire — retiré d'ici pour ne pas laisser croire qu'il
décrit l'état courant.
