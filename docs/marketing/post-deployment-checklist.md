# Checklist après déploiement — système commercial Qualifyr

## État de la livraison

- Date : 2 août 2026
- Branche : `feature/qualifyr-rebrand-v1`
- Commit applicatif : `8e87544`
- Plateforme : Netlify, projet existant `qualifyragence`
- Preview : <https://6a6fa6daa54baeb7346aa987--qualifyragence.netlify.app>
- Production actuelle, non remplacée pendant cet audit : <https://qualifyragence.com>
- Déploiement production actif : `6a6f97570217be86770394b0`
- DNS modifiés : non

## Variables présentes — noms uniquement

Disponibles pendant la construction locale de la preview :

- `NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_QUALIFYR_BOOKING_URL`

Présentes dans le projet Netlify :

- `GMAIL_APP_PASSWORD`
- `QUALIFYR_PROSPECT_WEBHOOK_SECRET`
- `QUALIFYR_PROSPECT_WEBHOOK_URL`

Manquantes pour le code de formulaire actuel :

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`

À déclarer explicitement dans Netlify avant un prochain build de production :

- `NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_QUALIFYR_BOOKING_URL`

Optionnelle, lorsqu'une valeur officielle est disponible :

- `GOOGLE_SITE_VERIFICATION`

## Contrôles de preview terminés

- [x] HTTPS et page d'accueil : `200`
- [x] Nettoyage automobile : `200`
- [x] Étude de cas SW Car Cleaning : `200`
- [x] Diagnostic : `200`
- [x] Estimation : `200`
- [x] Contact : `200`
- [x] À propos et méthode : `200`
- [x] Mentions légales et confidentialité : `200`
- [x] Page inconnue : `404`
- [x] Sept routes `/go/` : redirections temporaires `307`, destinations et UTM exacts
- [x] Slug `/go/` inconnu : destination interne sûre
- [x] WhatsApp direct : numéro et message centralisés
- [x] Calendrier : URL centralisée et repli Contact prévu
- [x] Attribution : first touch, last touch, nettoyage et sessionStorage couverts par les tests
- [x] Sitemap de preview vide
- [x] `robots.txt` de preview : `Disallow: /`
- [x] Meta robots de preview : `noindex, nofollow, nocache`
- [x] Canonical conservé sur `https://qualifyragence.com`
- [x] Responsive contrôlé à 390 × 844 et 1440 × 900 sans débordement
- [x] Lint, typecheck, 77 tests, build et génération des liens commerciaux réussis

## Formulaires et e-mail

- [x] Validation client et serveur, honeypot, consentement et double envoi couverts par les tests
- [x] Attribution partagée entre contact et diagnostic
- [x] Repli production honnête `503` si la configuration e-mail manque
- [ ] Test réel d'envoi Contact — bloqué par l'absence des variables Resend
- [ ] Test réel d'envoi Diagnostic — bloqué par l'absence des variables Resend
- [ ] Vérifier réception, `reply_to` et contenu « Origine de la demande » avec une adresse de test autorisée

Aucune requête de formulaire factice n'a été envoyée à la preview publique pendant cette
validation.

## Avant toute production

- [ ] Compléter les informations légales dans `src/content/company.ts`
- [ ] Configurer les cinq variables nécessaires dans Netlify, sans exposer leurs valeurs
- [ ] Effectuer les deux tests d'e-mail réels avec des données `TEST QUALIFYR`
- [ ] Faire valider la preview sur iPhone et Android physiques
- [ ] Confirmer les droits et les contenus réels de SW Car Cleaning
- [ ] Relire les textes, images et CTA avec le responsable de marque
- [ ] Vérifier le déploiement production actif et l'URL immuable de rollback juste avant publication
- [ ] Publier avec le contexte `production` uniquement après levée de tous les blocages
- [ ] Tester immédiatement le domaine et `www` après publication, sans modifier les DNS

## Search Console — manuel après production

- [ ] Vérifier la propriété `qualifyragence.com`
- [ ] Soumettre `https://qualifyragence.com/sitemap.xml`
- [ ] Inspecter l'accueil, les deux pages métier, SW Car Cleaning, diagnostic et estimation
- [ ] Demander l'indexation des pages principales
- [ ] Surveiller la disparition des anciennes métadonnées et les erreurs d'indexation

La procédure détaillée se trouve dans `docs/marketing/search-console-checklist.md`.

## Rollback

Le plan reste dans `docs/13-rollback-plan.md`. Ne supprimer aucun ancien déploiement. La
production active relevée le 2 août 2026 est disponible à l'adresse immuable :

<https://6a6f97570217be86770394b0--qualifyragence.netlify.app>
