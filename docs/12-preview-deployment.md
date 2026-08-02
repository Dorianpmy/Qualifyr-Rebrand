# 12 — Déploiement preview

## Preview finale du système commercial — 2 août 2026

- **Plateforme** : Netlify, projet existant `qualifyragence`
- **Contexte** : `deploy-preview` — aucun déploiement production
- **Branche** : `feature/qualifyr-rebrand-v1`
- **Commit applicatif poussé** : `8e87544`
- **Déploiement** : `6a6fa6daa54baeb7346aa987`
- **URL immuable** : <https://6a6fa6daa54baeb7346aa987--qualifyragence.netlify.app>
- **Journaux de build** : <https://app.netlify.com/projects/qualifyragence/deploys/6a6fa6daa54baeb7346aa987>
- **Domaine et DNS** : inchangés

Cette preview est construite avec le contexte Netlify `deploy-preview`. La configuration
versionnée force `NEXT_PUBLIC_SITE_INDEXABLE=false` pour les previews et les déploiements de
branche, tout en réservant l'activation explicite de l'indexation au contexte de production.

### Indexation et métadonnées vérifiées

- `meta robots` : `noindex, nofollow, nocache` ;
- `robots.txt` : `Disallow: /` ;
- `sitemap.xml` : vide ;
- canonical : `https://qualifyragence.com`, jamais l'URL temporaire ;
- HTTPS : actif.

### Contrôles effectués

- Réponses `200` : accueil, deux pages métier, étude de cas SW Car Cleaning, diagnostic,
  estimation, contact, à propos, méthode et deux pages légales.
- Route inconnue : réponse `404` correcte.
- Les sept routes `/go/` répondent en `307` vers les destinations internes et UTM attendus.
- Responsive réel sur les routes prioritaires à 390 × 844 et 1440 × 900 : aucun débordement
  horizontal ; H1 unique après hydratation.
- Navigation, CTA WhatsApp direct et calendrier : destinations centralisées et cohérentes.
- Aucune erreur console associée à l'hôte de preview pendant le contrôle.
- Aucun test d'envoi réel n'a été déclenché : les variables Resend sont absentes et aucune
  adresse de test autorisée n'a été fournie. Le repli `503` honnête est couvert par les tests.

### Variables observées, sans leurs valeurs

Variables publiques disponibles pour la construction locale de la preview :

- `NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER` ;
- `NEXT_PUBLIC_QUALIFYR_BOOKING_URL`.

Variables présentes dans le projet Netlify mais non utilisées comme remplacement des
variables Resend attendues par le code actuel :

- `GMAIL_APP_PASSWORD` ;
- `QUALIFYR_PROSPECT_WEBHOOK_SECRET` ;
- `QUALIFYR_PROSPECT_WEBHOOK_URL`.

Variables de production encore absentes :

- `RESEND_API_KEY` ;
- `CONTACT_TO_EMAIL` ;
- `CONTACT_FROM_EMAIL` ;
- `NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER` ;
- `NEXT_PUBLIC_QUALIFYR_BOOKING_URL` ;
- `GOOGLE_SITE_VERIFICATION` (optionnelle tant que Search Console ne fournit pas de valeur).

La production n'a pas été redéployée depuis cette preview.

## Dernier déploiement de validation

- **Date** : 27 juillet 2026
- **Branche** : `feature/qualifyr-rebrand-v1`
- **Commit déployé** : `5b761e6`
- **Cible Vercel** : `preview`
- **URL immuable** : <https://qualifyr-rebrand-najdg04n9-dorianpmys-projects.vercel.app>
- **Protection** : authentification Vercel active
- **Remarque** : le projet Vercel n'étant plus relié au dépôt Git, les variables publiques n'ont pas pu être limitées à cette branche. Aucun secret d'e-mail n'a été ajouté.

Ce déploiement contient le dernier code validé, dont la redirection certaine de
`/diagnostic.html` vers `/diagnostic`. Il ne remplace pas le site public.

## Déploiement validé précédemment

- **Date** : 26 juillet 2026
- **Branche** : `feature/qualifyr-rebrand-v1`
- **Commit déployé** : `fcff6ef952a54ea71ead1498d8507445fe02bfa5`
- **Projet Vercel** : `dorianpmys-projects/qualifyr-rebrand`
- **Framework détecté** : Next.js
- **Cible Vercel** : `preview`
- **Statut** : `Ready`
- **URL immuable** : <https://qualifyr-rebrand-7uhh3kvvw-dorianpmys-projects.vercel.app>
- **Alias de preview** : <https://qualifyr-rebrand-dorianpmy-dorianpmys-projects.vercel.app>
- **Protection** : authentification Vercel active ; lien temporaire utilisé uniquement pour les tests automatisés
- **Indexation** : désactivée (`noindex, nofollow, nocache`, `robots.txt` avec `Disallow: /`, sitemap vide)

Le domaine `qualifyragence.com`, son sous-domaine `www`, les DNS et l’ancien site n’ont pas
été modifiés.

## Variables configurées

Les valeurs ne sont volontairement pas reproduites ici.

| Variable | Environnement | État |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Preview uniquement | Configurée |
| `RESEND_API_KEY` | — | Non disponible, non configurée |
| `CONTACT_TO_EMAIL` | — | Non disponible, non configurée |
| `CONTACT_FROM_EMAIL` | — | Non disponible, non configurée |

En l’absence des trois variables d’e-mail, les formulaires refusent l’envoi avec un code
`503` et indiquent explicitement que le message n’a pas été transmis. Aucun faux succès
n’est affiché.

## Vérifications avant déploiement

- Branche active confirmée : `feature/qualifyr-rebrand-v1`.
- Working tree propre avant déploiement.
- Branche poussée sans force vers `origin/feature/qualifyr-rebrand-v1`.
- `npm run test` : 47 tests réussis.
- `npm run lint` : réussi.
- `npm run typecheck` : réussi.
- `npm run build` : réussi, 16 pages statiques générées.
- `scripts/audit-seo.py` : réussi, aucun problème détecté.
- `scripts/audit-a11y.py` : réussi, aucun problème détecté.
- Recherche de secrets dans les fichiers suivis : aucun motif de clé ou clé privée détecté.
- Seul `.env.example`, sans valeur, est suivi par Git.
- Les informations légales manquantes restent affichées comme telles ; aucune donnée n’a été inventée.

## Vérifications après déploiement

- Accueil : `200`.
- Méthode : `200`.
- Réalisations : `200`.
- Étude de cas SW Carcleaning : `200`.
- À propos : `200`.
- Diagnostic : `200`.
- Contact : `200`.
- Mentions légales : `200`.
- Politique de confidentialité : `200`.
- URL inconnue : `404` avec page dédiée et `noindex`.
- HTTPS actif ; HSTS fourni par Vercel.
- Une balise `h1` par page testée.
- Titres, canoniques et directives robots présents sur les neuf pages.
- Aucune image sans attribut `alt` détectée.
- Aucun débordement horizontal à 390 × 844 px.
- Menu mobile : ouverture, fermeture avec `Échap` et retour à l’état fermé validés.
- Formulaire Contact : erreurs sur soumission vide, puis réponse `503` et message d’échec honnête.
- Formulaire Diagnostic : réponse `503` et message d’échec honnête avec une charge valide de test.
- Console navigateur : aucune exception JavaScript ni erreur applicative inattendue. Les seules erreurs réseau observées correspondent aux tests volontaires de la route `404` et du formulaire `503`.
- Journaux runtime consultés après les tests : aucune erreur serveur supplémentaire retournée.

## Problèmes et limites restants

### Bloquants avant production

- Informations légales de l’éditeur et de l’hébergeur incomplètes ; `legalNoticeIsComplete()` reste faux.
- Adresse e-mail professionnelle non renseignée.
- Variables Resend absentes ; aucun test réel de réception ou d’accusé de réception possible.
- Autorisation écrite et visuels réels de SW Carcleaning à confirmer.
- Validation sur appareils iPhone et Android réels encore à effectuer.
- Sauvegarde de l’ancien site, inventaire des URL et plan de redirections 301 à réaliser avant toute bascule.
- Les dépendances transitives signalées par l’audit npm lors de l’audit V1 restent à suivre ; le correctif forcé proposé est incompatible avec la version actuelle de Next.js.

### Écart Vercel constaté

Lors de la création du projet depuis la branche de refonte — seule branche et branche par
défaut du dépôt distant — Vercel a promu le tout premier déploiement sur l’alias interne
`qualifyr-rebrand.vercel.app`, malgré l’absence de l’option `--prod`. Aucun domaine
personnalisé n’était relié et ce déploiement est protégé par l’authentification Vercel.

Un nouveau déploiement a ensuite été créé avec la cible explicite `--target preview` et
c’est uniquement l’URL de ce déploiement qui est validée ci-dessus. L’intégration Git
automatique a été déconnectée du projet Vercel afin qu’aucun futur push de la branche de
refonte ne soit interprété comme une production. La liaison locale `.vercel` reste active
et est ignorée par Git.

## Tests manuels encore demandés

- Relecture visuelle complète sur l’URL de preview par le responsable de marque.
- Vérification sur iPhone et Android physiques, notamment les zones sûres et le clavier virtuel.
- Remplissage complet des deux formulaires au pouce.
- Test des e-mails après configuration de Resend : réception interne, `reply_to`, accusé de réception et limitation de débit.
- Aperçus de partage WhatsApp, LinkedIn et iMessage après validation définitive du logo et de l’image Open Graph.
