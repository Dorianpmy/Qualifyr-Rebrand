# 17 — Audit fonctionnel des trois agents (12/09/2026)

Test en conditions réelles du site en production (`qualifyragence.com`), à la demande de Dorian : « teste toutes les fonctionnalités des 3 agents, dis-moi si c'est fonctionnel et s'il y a des corrections à faire ». Les « trois agents » sont ceux affichés sur la page d'accueil (`src/content/agents.ts`) : recensement, réservation, filtrage.

Méthode : navigation réelle sur le site public en production, soumissions réelles de formulaires (gratuites, aucun paiement finalisé), lecture de la boîte mail `dorian.poumay10@gmail.com` pour vérifier les e-mails effectivement envoyés, et lecture du code pour établir la cause de chaque anomalie. Aucune carte bancaire n'a été saisie ; les parcours Stripe ont été ouverts jusqu'à l'écran de paiement puis abandonnés.

**Aucun module authentifié (Hermès, planning, prestations, factures, abonnement) n'a pu être testé en conditions réelles** : la connexion à l'espace pro est cassée (bug n°1 ci-dessous). Une fois corrigée, ces tests restent à faire.

---

## Bloquant

### 1. Personne ne peut se connecter à l'espace pro

Ni le lien magique, ni la définition de mot de passe ne fonctionnent en production. Reproduit deux fois avec `dorian.poumay10@gmail.com` :

- Demande de lien magique → e-mail reçu → lien cliqué → retombe sur `/app/login`, toujours déconnecté.
- Demande de définition de mot de passe → e-mail reçu → même résultat.

**Cause.** Les deux e-mails Supabase pointent vers `redirect_to=https://app.qualifyragence.com` (racine du sous-domaine, sans chemin), alors que le code demande explicitement `https://qualifyragence.com/app/auth/confirm` :

- `src/components/app/LoginForm.tsx:53-56` (lien magique) envoie `${window.location.origin}/app/auth/confirm`.
- `src/app/api/app/reset-password/route.ts:48` force `redirectTo = \`${origin}/app/auth/confirm\`` côté serveur, sans possibilité de le contourner depuis le client.

Le code est donc correct des deux côtés. Le comportement observé (Supabase remplace silencieusement l'URL demandée par une autre) est la signature classique d'une URL de redirection **absente de la liste blanche** de Supabase Auth : quand `emailRedirectTo` n'est pas autorisé, Supabase ne renvoie pas d'erreur, il retombe sur la `Site URL` par défaut du projet — ici réglée sur `https://app.qualifyragence.com`, qui ne fait que rediriger vers `/app/login` (`netlify.toml`) sans jamais échanger le jeton reçu dans l'URL.

**Correction (Supabase Dashboard, pas de code) :**
Authentication → URL Configuration :
- `Site URL` → `https://qualifyragence.com`
- `Redirect URLs` → ajouter `https://qualifyragence.com/app/auth/confirm` (et idéalement `https://qualifyragence.com/**` pour ne pas revivre ce bug au prochain nouvel écran).

**Conséquence tant que ce n'est pas corrigé :** aucun professionnel ne peut ni se connecter, ni créer un mot de passe pour la première fois — l'espace pro est inaccessible à tout le monde, y compris toi.

---

## Majeur

### 2. Prix annuels affichés ≠ prix réellement facturés par Stripe

Vérifié en ouvrant réellement le Stripe Checkout (mode live) des trois offres en annuel, sans aller jusqu'au paiement :

| Offre | Annoncé sur `/tarifs` | Facturé par Stripe | Écart |
|---|---|---|---|
| Agent seul | 170 €/an | **168 €/an** | 2 € |
| Système seul | 490 €/an | **468 €/an** | 22 € |
| Pack complet | 590 €/an | **564 €/an** | 26 € |

**Cause.** Lors de la correction du calcul d'affichage plus tôt (passage à des montants annuels « déclarés » plutôt que calculés, dans `src/components/agency/DarkPricing.tsx`), les *Price* Stripe réels (`STRIPE_PRICE_AGENT_ANNUAL`, `STRIPE_PRICE_SYSTEME_ANNUAL`, `STRIPE_PRICE_COMPLET_ANNUAL`) n'ont pas été recréés pour correspondre — ce sont encore les anciens montants. 468 € correspond exactement à l'ancien affichage « 39 €/mois » du plan Système, remplacé depuis par 41 €/mois.

**Correction :** créer trois nouveaux Price Stripe en mode Live (170 €, 490 €, 590 € par an), mettre à jour les trois variables d'environnement Netlify correspondantes, archiver les anciens Price (comme fait pour le passage test→live plus tôt).

### 3. E-mails de connexion non traduits, non brandés, envoyés hors Resend

Les e-mails « Your sign-in link » et « Reset your password » sont entièrement en anglais, signés `noreply@mail.app.supabase.io`, avec un pied de page « powered by Supabase ⚡️ » et un lien « Opt out of these emails ». Aucun des deux ne passe par Resend ni par les domaines configurés cette session (`RESEND_API_KEY`, `HERMES_FROM_EMAIL`, `BOOKING_FROM_EMAIL`) : ce sont les templates par défaut de Supabase Auth, jamais personnalisés.

Contrevient à : contenu en français obligatoire, ton éditorial premium, positionnement explicite « ni startup IA, ni template SaaS » — un professionnel qui reçoit ce mail comprend immédiatement que le produit tourne sur une infrastructure générique.

**Correction :** Supabase Dashboard → Authentication → Emails → configurer un SMTP personnalisé (Resend, domaine `notifications.qualifyragence.com` déjà vérifié) et réécrire les templates « Magic Link » et « Reset Password » en français avec l'identité Qualifyr.

### 4. Palette interdite utilisée comme identité visuelle du site

Un dégradé sable → lilas → bleu givré (`--accent-2: #b8cfe4`, `--accent-3: #c9c4ee`, déclarés dans `src/styles/tailwind.css:230-274`) est devenu un dégradé de marque, utilisé dans 21 fichiers : le logo (`QualifyrMark.tsx`), le héros, les prix mis en avant, les cartes sélectionnées, la barre de progression du tunnel de réservation, et plusieurs halos lumineux (`box-shadow: 0 0 Npx`).

C'est une violation directe et documentée : `docs/03-direction-artistique.md:222` liste toujours « Vert · mauve · violet · bleu électrique · cyan · dégradé bleu-violet · néon · halos lumineux » comme interdits, et ce document n'a jamais été mis à jour pour autoriser l'exception — alors que la règle du projet est « on met à jour le doc d'abord, puis on implémente ». Le commentaire dans `tailwind.css` justifie le choix en le comparant explicitement à l'identité d'« une référence » à trois couleurs (rouge/violet/bleu) — soit exactement l'esthétique que la charte exclut.

Fichiers concernés (`grep` sur `accent-2`/`accent-3`) : `tailwind.css`, `AgentFlow.tsx`, `AgentGrid.tsx`, `AmbientGlow.tsx`, `BeforeAfterSection.tsx`, `CompareSection.tsx`, `DarkAgencyOffers.tsx`, `DarkHero.tsx`, `DarkPricing.tsx`, `DarkVerticalPage.tsx`, `DemoSection.tsx`, `FeatureComparisonTable.tsx`, `FinalCtaSection.tsx`, `ServiceTabs.tsx`, `StepLoadingBar.tsx`, `PricingEditor.module.css`, `QualifyrMark.tsx`, `AddressPicker.module.css`, `BookingFlow.module.css`, `BookingIntro.module.css`, `app.module.css`, `app/app/abonnement/page.tsx`.

C'est un choix de design trop large pour que je le corrige seul sans ton accord — je te le signale plutôt que d'y toucher.

### 5. Bas de page dupliqué sur la page d'accueil

La page d'accueil affiche deux pieds de page l'un en dessous de l'autre : celui du SaaS (Recensement/Réservation/Filtrage) puis, visible juste en dessous, l'ancien pied de page « agence » avec ses propres liens (Réalisations, Journal, Méthode, un lien de réservation Google Calendar) et sa propre mini-navigation. Deux zones de navigation portent le même nom « Entreprise », ce qui gêne la navigation au clavier/lecteur d'écran (impossible de les distinguer par leur libellé). Le masquage `data-legacy-chrome` qui cache correctement l'ancien en-tête ne s'applique pas à l'ancien pied de page.

**Correction probable :** appliquer le même masquage `data-legacy-chrome="footer"` utilisé pour l'en-tête, ou retirer l'ancien composant de pied de page de la page d'accueil du SaaS.

### 6. Tunnel de réservation : bouton bloqué sans message d'erreur

Étape « Où se passe l'intervention », pour un professionnel sans adresse de départ configurée (`detailer.base` = null — c'est le cas du compte de démonstration public) : le bouton « Continuer » reste désactivé si le client laisse vide le champ « Distance jusqu'au professionnel », **alors que le texte d'aide dit explicitement** : *« indiquez une distance approximative si vous la connaissez, sinon laissez vide — il ajustera »*. Reproduit : adresse valide sélectionnée, champ distance vide → bouton grisé, aucun message n'explique pourquoi.

Code : `src/components/detailing/BookingFlow.tsx:443-459`, condition `canProceed.lieu`.

**Correction :** soit rendre le champ visuellement obligatoire avec un message d'erreur clair quand `detailer.base` est vide, soit corriger le texte d'aide pour ne plus promettre qu'un champ vide est accepté.

### 7. La démo publique du tunnel échoue à la toute dernière étape

« Tester le tunnel client » / « Lancer la démo » sont mis en avant sur toute la page d'accueil comme « le vrai tunnel, pas une maquette ». En le suivant jusqu'au bout (7 étapes), la confirmation finale échoue avec *« Les réservations en ligne ne sont pas disponibles »* : le compte « Atelier Demo » n'a pas d'abonnement actif donnant la capacité `booking.public` (`src/lib/billing/guard.ts:129-157`, `src/app/api/detailing/[slug]/bookings/route.ts:82-88`).

Un prospect qui va au bout de la démo — exactement le comportement que la page l'invite à avoir — tombe sur une erreur au moment le plus critique.

**Correction :** attribuer à l'`owner_id` du détailer « Atelier Demo » un abonnement actif (plan Système ou Pack complet) dans Supabase, comme cela a été fait pour le compte de test de ton ami.

---

## À surveiller, non confirmé comme bug

### 8. Rapport de secteur gratuit (agent de recensement)

La soumission fonctionne (requête acceptée, confirmation affichée : *« Le rapport atterrit dans dorian.poumay10@gmail.com dès qu'il y a quelque chose à vous montrer »*), mais l'e-mail n'était pas encore arrivé à la fin de ce test. C'est attendu : le site indique lui-même que l'analyse Sirene prend « quelques heures ». À vérifier dans la boîte mail plus tard aujourd'hui pour confirmer que le rapport arrive bien, avec les bons chiffres pour le 69003.

---

## Hors périmètre, remarqué en passant

Le workflow GitHub Actions « Carrousel quotidien Qualifyr » (dépôt `Dorianpmy/TiktokCarousselQualifyr`) a échoué ce matin (tous les jobs en échec) — sans lien avec ce site, mais visible dans la boîte mail pendant ce test.

---

## Ce qui fonctionne correctement

- Tunnel de réservation : les étapes 1 à 4 (véhicule, formule, état, options) calculent le prix correctement en temps réel.
- Autocomplétion d'adresse (`/api/detailing/geocode`) et carte Google Maps intégrée : fonctionnent bien.
- Recherche de créneaux disponibles par jour : fonctionne.
- Soumission du rapport de secteur gratuit : requête acceptée côté serveur.
- Stripe Checkout en mensuel : prix exact (17 €/mois vérifié), essai de 14 jours bien appliqué, mode Live actif.
- Liens du site (menu, pied de page, réseaux sociaux) : aucun lien mort trouvé.
- Aucune erreur JavaScript en console sur les pages testées.
