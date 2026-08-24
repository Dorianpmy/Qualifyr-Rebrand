# 10 — Checklist de lancement

## Ce document décrivait une mise en ligne qui n'a pas encore eu lieu

Ce n'est plus le cas. Le site est en production sur `https://qualifyragence.com`, indexable
(vérifié le 24/08/2026 : `robots.txt` ouvert, `sitemap.xml` à 30 URL), avec un espace pro
fonctionnel (`/app/...`, alias `app.qualifyragence.com`) porté par Supabase et Stripe. La
checklist ci-dessous reste utile — comme liste de contrôle à revalider avant un changement
significatif (nouvelle fonctionnalité, nouveau sous-traitant, changement de grille tarifaire)
— mais elle ne décrit plus un état « avant bascule ». Réécrite le 24/08/2026 ; l'ancienne
version tournait autour d'un parcours « Diagnostic » retiré du site depuis
(`POST /api/diagnostic` répond `404`, voir `tests/submission.test.ts`) et remplacé par les
parcours `/estimation` et `/contact`.

**Provenance de chaque affirmation** : **[dépôt]** vérifiable dans le code, **[vérifié en
production, 24/08/2026]** constaté en interrogeant le site public, **[Dorian, 24/08/2026]**
confirmé par le propriétaire sans accès direct depuis ce document, **[à vérifier]** ni l'un ni
l'autre. Détail complet des variables et de l'état de déploiement :
`docs/11-variables-environnement.md` et `docs/14-production-deployment.md`.

Légende inchangée : **BLOQUANT** = ne doit pas rester faux longtemps · **IMPORTANT** = à
soigner avant toute communication publique · **ENSUITE** = suivi continu.

---

## A. Informations légales — **[dépôt] techniquement complètes, un écart assumé**

`legalNoticeIsComplete()` (`src/content/company.ts`) renvoie **`true`** au 24/08/2026 : raison
sociale, forme juridique, SIRET, adresse, directeur de publication, hébergeur et e-mail sont
tous renseignés. Ce n'était pas le cas dans une version antérieure de ce document — corrigé.

- [x] Raison sociale, forme juridique, SIRET, directeur de publication, hébergeur, e-mail
      renseignés dans `company.ts`
- [x] `legalNoticeIsComplete()` renvoie `true`
- [ ] **Écart assumé, pas un oubli** : `address` est renseignée mais retirée de l'affichage
      public (`withheldFromPublicNotice`), le siège étant le domicile personnel de Dorian —
      écart connu à l'article 6 de la LCEN, accepté le 22/08/2026. Solution durable :
      domiciliation commerciale, puis retirer `'address'` de `withheldFromPublicNotice`.
- [ ] Capital social et RCS : sans objet, entrepreneur individuel (`shareCapital`, `registry`
      restent `null` à bon droit)
- [ ] Durée de conservation des demandes (`retention.formSubmissions`) : toujours non arrêtée
      — `src/content/legal.ts` le dit franchement plutôt que d'annoncer une durée fictive
- [ ] Relire `src/content/legal.ts` en entier : chaque phrase doit rester vraie, notamment les
      paragraphes ajoutés le 22/08/2026 (Hermès) et le 24/08/2026 (classement par pertinence)

---

## B. Sous-traitants — **BLOQUANT, chantier en cours au 24/08/2026**

`src/content/company.ts` exporte `processors`, lu dynamiquement par
`/politique-de-confidentialite`. Un sous-traitant absent de cette liste alors qu'il traite
réellement des données est une politique de confidentialité fausse par omission.

- [x] Netlify (hébergement) déclaré
- [ ] Supabase (base de données, authentification) — **absent, à ajouter**
- [ ] Resend (envoi d'e-mails, deux domaines) — **absent, à ajouter**
- [ ] Stripe (paiement) — **absent, à ajouter**
- [ ] Mistral (classement par pertinence Hermès) — absent, à ajouter dès que la fonctionnalité
      est confirmée en production (migration `020` appliquée, `MISTRAL_API_KEY` posée)
- [ ] Revoir la condition `processors.length <= 1` qui affiche le badge « Aucune revente » sur
      la page confidentialité : elle deviendra fausse dès le premier sous-traitant ajouté
      ci-dessus, alors que recourir à un sous-traitant RGPD n'est pas revendre des données

---

## C. Adresse e-mail et fournisseur — **[Dorian] partiellement confirmé**

- [x] Compte Resend créé et clé posée **[Dorian, 24/08/2026]**
- [ ] Domaine `contact.qualifyragence.com` (Hermès) vérifié chez Resend (DNS propagés,
      statut « Verified ») — **[à vérifier]**, l'existence du sous-domaine est confirmée, sa
      vérification DNS ne l'est pas explicitement
- [ ] Domaine `notifications.qualifyragence.com` (transactionnel) vérifié chez Resend —
      **[à vérifier]**, même remarque
- [x] `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `BOOKING_FROM_EMAIL`,
      `HERMES_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET` posées dans Netlify **[Dorian, 24/08/2026]**
- [ ] Aucune de ces valeurs dans le dépôt — `git log -p --all | grep -nE 're_[A-Za-z0-9]{20,}'`
      doit rester vide

---

## D. Test réel des formulaires — **[à vérifier]**

Le parcours `/diagnostic` a été retiré ; les parcours actuels sont `/estimation` (tunnel
d'estimation, envoi conditionné à la configuration Resend) et `/contact`.

- [ ] `/estimation` — envoi complet, e-mail bien reçu, offre recommandée cohérente
- [ ] `/contact` — envoi complet, e-mail bien reçu, `reply_to` correct
- [ ] Accusé de réception reçu par l'expéditeur, texte relu
- [ ] Demande de zone (`/api/agent/scan` ou `/api/app/agent-zones`) — confirmation immédiate
      envoyée, rapport de secteur reçu une fois l'analyse traitée
- [ ] Réservation professionnelle de bout en bout — créneau, acompte Stripe Connect, e-mails
      client et professionnel
- [ ] Abonnement Qualifyr de bout en bout — checkout Stripe, webhook, droit accordé (voir
      chantier Prices Stripe pour l'état des six `STRIPE_PRICE_*`)
- [ ] Envoi avec champs vides → erreurs par champ
- [ ] Double soumission → un seul e-mail / un seul enregistrement

---

## E. Validation des textes — **IMPORTANT**

- [ ] Vérifier que la promesse est identique partout, au mot près
- [ ] Vérifier que la verticale officielle (nettoyage automobile/detailing) reste nommée
      clairement, seule
- [ ] Vérifier l'étude de cas SW Carcleaning : aucun résultat chiffré inventé
- [ ] Vérifier que « agent IA » / « intelligence artificielle » n'apparaît nulle part, y
      compris pour le classement par pertinence Hermès — `tests/no-false-promises.test.ts` le
      verrouille automatiquement, mais une relecture humaine reste utile
- [ ] Vérifier la cohérence de la grille tarifaire affichée avec celle des Prices Stripe —
      chantier dédié, deux grilles coexistent au 24/08/2026 (`src/content/estimation-offers.ts`)

---

## F. Validation des images — **IMPORTANT**

Détail et noms de fichiers attendus : `docs/06`.

- [ ] Autorisation écrite de SW Carcleaning pour le nom et les visuels
- [ ] Un texte alternatif écrit à la main pour chaque image
- [x] Logo Qualifyr intégré — en-tête, menu, footer, favicon, icônes du manifest et Open Graph

---

## G. Validation mobile — **IMPORTANT**

Sur appareils réels, pas seulement en simulateur.

- [ ] Menu mobile : ouverture, fermeture, `Échap`, retour du focus
- [ ] Les parcours estimation, contact, réservation et espace pro remplis au pouce
- [ ] Aucun défilement horizontal, à aucune largeur
- [ ] « Réduire les animations » activé → tout est immédiatement visible

---

## H. Sous-domaine `app.` — **[dépôt + vérifié en production]**

- [x] `app.qualifyragence.com/` redirige (301) vers `qualifyragence.com/app/login` — vérifié
      directement le 24/08/2026
- [x] `app.qualifyragence.com/*` redirige vers le même chemin sur le domaine principal —
      `netlify.toml`
- [ ] Un lien `app.qualifyragence.com/hermes` partagé mène bien à `/app/hermes` — à tester
      manuellement, la règle de redirection le garantit en théorie

---

## I. Domaine et indexation — **[dépôt + vérifié en production]**

- [x] `NEXT_PUBLIC_SITE_INDEXABLE=true` en contexte production (`netlify.toml`)
- [x] `robots.txt` autorise l'indexation, `sitemap.xml` contient 30 URL — vérifié le 24/08/2026
- [x] Domaine connecté au projet Netlify de production
- [ ] HTTPS actif, certificat valide — probable (le site répond en HTTPS), non vérifié
      explicitement pour la validité du certificat
- [ ] Sitemap soumis à la Search Console

---

## J. Après chaque changement significatif — **ENSUITE**

- [ ] Lighthouse mobile — noter les Core Web Vitals réels
- [ ] Un envoi de formulaire par semaine, pour s'assurer que les clés Resend sont vivantes
- [ ] Un passage `npm run check:env` avant chaque déploiement de production

---

## K. Contrôles à relancer avant chaque mise en ligne

```bash
npm run test         # 274 tests au 24/08/2026 — revérifier ce chiffre, il évolue
npm run lint
npm run typecheck
npm run build

npx next start &
python3 scripts/audit-seo.py  http://localhost:3000
python3 scripts/audit-a11y.py http://localhost:3000
```

Les six doivent passer. Aucune mise en ligne avec l'une d'elles en échec.

---

## L. Plan de repli

Documenté dans `docs/13-rollback-plan.md` — non revérifié dans ce cadrage. À relire avant
tout changement de domaine ou de configuration DNS, ce que ce chantier n'a pas touché.
