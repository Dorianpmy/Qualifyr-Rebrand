# 12 — Déploiement preview

## Déploiement validé

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

