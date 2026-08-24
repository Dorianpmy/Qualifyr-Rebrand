# 04 — Plan d’implémentation

## Décision du 1er août 2026 — diagnostic en cinq étapes

La route `/diagnostic` devient une consultation guidée autonome : introduction, cinq étapes
courtes, vérification éditable et confirmation. Le parcours conserve la route
`POST /api/diagnostic`, la validation Zod partagée, le champ piège, le temps minimal et la
limitation de débit. Chaque demande validée est d'abord transmise à `POST /api/diagnostic` :
WhatsApp n'est jamais un raccourci qui contourne cet envoi. Après une vraie réussite, il peut
ouvrir un résumé prérempli sur action explicite ; après un échec, il peut servir de repli
manuel avec un message honnête. Le calendrier n'apparaît que lorsque son URL HTTPS est valide.

Les réponses peuvent être conservées dans `sessionStorage` pendant la session. Elles sont
retirées après un envoi e-mail réussi ou lorsque le visiteur choisit explicitement de
recommencer. Aucune donnée personnelle n'est envoyée à un outil de mesure d'audience.

**État : phase 1 réalisée.** La fondation technique est en place. Ce document consigne les
décisions arrêtées et l'ordre des phases restantes.

Historique :

- *Phase 0* — audit du dépôt (vide), branche `feature/qualifyr-rebrand-v1`, `AGENTS.md`, `docs/`.
- *Phase 1* — initialisation Next.js, jetons de design, layout, huit routes, 404.
- *Phase 2* — design system : 23 composants globaux, menu mobile accessible, `docs/05-composants.md`.
- *Phase 3* — page d'accueil complète (10 sections), 3 composants supplémentaires, sous-page SW Carcleaning.
- *Phase 4* — pages secondaires : Méthode, À propos, Diagnostic, Contact, Réalisations. Composants de formulaire accessibles, envoi non branché.
- *Phase 5* — étude de cas SW Carcleaning, composants `CasePlate` et `CaseGallery`, source de contenu unique, `docs/06-assets-sw-car-cleaning.md`.
- *Phase 6* — mise en service des formulaires : validation partagée Zod, routes API, transport e-mail abstrait, anti-spam, 46 tests.
- *Phase 7* — SEO technique, image Open Graph, données structurées, sitemap, robots, structure légale, `docs/07-informations-legales-requises.md`.
- *Phase 8* — passe qualité : responsive, accessibilité, révélation sobre au défilement, nettoyage du CSS et du code morts, `docs/08-qa-responsive-accessibilite.md`.
- *Phase 9* — audit final V1 : en-têtes de sécurité, centralisation des derniers textes, `docs/09` à `docs/11`. Prêt pour un premier aperçu.

---

## 1. Stack arrêtée

Décision : **Next.js**, sur demande explicite du commanditaire. La recommandation initiale
(Astro) est écartée — elle reste consignée en §1.3 pour mémoire.

| Couche | Choix retenu | Version | Justification |
|---|---|---|---|
| Framework | **Next.js**, App Router | `16.2.12` | Demandé. Rendu statique par défaut sur les huit routes ; permet une évolution ultérieure vers des fonctionnalités serveur (formulaires, réservation) sans changer de socle. |
| Runtime UI | React | `19.2.8` | Imposé par Next 16. |
| Langage | TypeScript, `strict` **et au-delà** | `5.9.3` | En plus de `strict` : `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. |
| Styles | **CSS moderne natif + CSS Modules** | — | Voir §1.1. Tailwind écarté. |
| Polices | `next/font/local`, fichiers versionnés | — | Voir §1.2. |
| Lint | ESLint 9 (config plate) + `eslint-config-next` | `16.2.12` | `next/core-web-vitals` + `next/typescript`, plus trois règles maison. |
| Gestionnaire de paquets | **npm** | `10.9.8` | Aucun gestionnaire préexistant dans le dépôt ; consigne de repli appliquée. |
| Node | `>= 20.9.0`, développé sous 22 | — | `.nvmrc` versionné. |
| Hébergement | Vercel (non connecté à ce stade) | — | Phase 9. |

### 1.1 Pourquoi pas Tailwind

La consigne était : Tailwind **uniquement s'il aide réellement à maintenir le système de
design**. Il ne l'aide pas ici, pour trois raisons :

1. **La palette par défaut est un risque direct.** Tailwind expose des dizaines de couleurs
   vertes, violettes et bleues. Il faudrait les neutraliser une par une pour respecter
   `AGENTS.md` §5. Avec des jetons CSS, ces couleurs n'existent tout simplement pas.
2. **La DA est éditoriale, pas systémique.** Les compositions décrites au document 03
   (diptyque décalé, asymétrie 6/4, filets pleine largeur) s'écrivent plus clairement en CSS
   Grid nommé qu'en chaînes d'utilitaires.
3. **Le volume ne le justifie pas.** Huit pages, une vingtaine de composants. Le coût
   d'apprentissage et de configuration dépasse le gain.

Ce qui est utilisé à la place : **variables CSS** pour les jetons (`src/styles/tokens.css`),
**CSS Modules** pour la portée locale (`Header.tsx` + `Header.module.css`), `clamp()` pour
l'échelle fluide, propriétés logiques (`inline-size`, `padding-inline`) partout.
Aucun préprocesseur, aucune dépendance de style.

### 1.2 Polices — pourquoi `next/font/local` et non `next/font/google`

`next/font/google` télécharge les fichiers au moment du build. Cela introduit une dépendance
réseau dans la chaîne de build et un point de rupture hors ligne. Les fichiers `.woff2` sont
donc **versionnés dans le dépôt** (`src/styles/fonts/`) et chargés par `next/font/local` :

- `newsreader-latin-variable.woff2` — 58 Ko, graisses 200→800
- `manrope-latin-variable.woff2` — 24 Ko, graisses 200→800
- **82 Ko au total**, préchargés, `display: swap`, sous-ensemble latin (couvre l'intégralité
  des caractères accentués du français)
- Licences SIL OFL 1.1 versionnées à côté des fichiers

Les fichiers ont été extraits des paquets `@fontsource-variable/*`, qui ont ensuite été
désinstallés : ils n'apparaissent pas dans `package.json`.

### 1.3 Écartés, et pourquoi

- **Astro** — recommandation initiale ; écartée sur décision du commanditaire.
- **Tailwind CSS** — voir §1.1.
- **shadcn/ui, MUI, Chakra, Radix** — imposent une esthétique générique, exactement ce que la
  DA proscrit. Aucune bibliothèque de composants préfabriqués.
- **Framer Motion, GSAP** — les animations décrites au document 03 tiennent en CSS et en
  `IntersectionObserver`. Aucune dépendance d'animation.
- **CMS externe** — le volume ne le justifie pas en V1. À reconsidérer si Dorian veut éditer
  seul après la mise en ligne (voir §10).
- **Prettier** — non installé : ESLint suffit à ce stade, et une dépendance de moins est une
  dépendance de moins. À ajouter si le projet devient collaboratif.

---

## 2. Architecture

Arborescence réellement en place :

```
.
├── AGENTS.md
├── docs/                       01 à 12
├── scripts/
│   ├── audit-seo.py            audit SEO du site rendu (stdlib Python)
│   └── audit-a11y.py           audit accessibilité du site rendu
├── public/
│   ├── images/og/              qualifyr-og.png (1200×630, généré)
│   └── icons/                  (vide)
├── src/
│   ├── app/
│   │   ├── layout.tsx          <html lang="fr">, polices, Header, main#contenu, Footer
│   │   ├── page.tsx            Accueil
│   │   ├── page.module.css
│   │   ├── not-found.tsx       404
│   │   ├── not-found.module.css
│   │   ├── icon.svg            favicon typographique temporaire
│   │   ├── design-system/      page.dev.tsx — absente du build de production
│   │   ├── api/diagnostic/route.ts
│   │   ├── api/contact/route.ts
│   │   ├── sitemap.ts          piloté par site.indexable
│   │   ├── robots.ts           piloté par site.indexable
│   │   ├── blog/               index du journal + route dynamique [slug]
│   │   ├── laboratoire/        explorations créatives, séparées de l'accueil
│   │   ├── realisations/sw-car-cleaning/  étude de cas
│   │   ├── methode/page.tsx
│   │   ├── realisations/page.tsx
│   │   ├── a-propos/page.tsx
│   │   ├── diagnostic/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── mentions-legales/page.tsx
│   │   └── politique-de-confidentialite/page.tsx
│   ├── components/
│   │   ├── layout/             Container, Section, Header, MobileNavigation,
│   │   │                       Footer, SkipLink, Breadcrumbs
│   │   ├── editorial/          SectionHeading, EditorialCard, OutcomeCard,
│   │   │                       JourneyStep, MethodStep, CaseStudyCard,
│   │   │                       QuoteBlock, EditorialMedia, FAQAccordion,
│   │   │                       ContactPanel, CallToAction,
│   │   │                       HeroComposition, JourneyTrack, ComparisonPanel,
│   │   │                       CasePlate, CaseGallery
│   │   ├── form/               Fieldset, Field, Controls, FormShell,
│   │   │                       useFormSubmission, DiagnosticForm,
│   │   │                       ContactForm (+ form.module.css)
│   │   ├── motion/             RevealObserver
│   │   ├── seo/                JsonLd
│   │   └── ui/                 Logo, QualifyrMark, Button, TextLink, Eyebrow,
│   │                           Divider, Icon
│   ├── content/
│   │   ├── home.ts             tout le texte de la page d'accueil
│   │   ├── blog.ts             articles, dates et calendrier de publication
│   │   ├── methode.ts          quatre temps détaillés, section outils
│   │   ├── about.ts            philosophie, manière de travailler, refus
│   │   ├── work.ts             réalisations — structure extensible
│   │   ├── sw-car-cleaning.ts  étude de cas — source unique
│   │   ├── forms.ts            champs, options, message d'état
│   │   ├── brand.ts            promesse, explication, parcours, collaboration, CTA
│   │   ├── navigation.ts       navigation principale, pied de page, légales, libellés
│   │   ├── contact.ts          coordonnées — uniquement des valeurs réelles
│   │   ├── faq.ts              questions fréquentes
│   │   ├── company.ts          informations légales — aucune valeur inventée
│   │   ├── legal.ts            textes des pages légales
│   │   └── site.ts             url, locale, indexable, métadonnées par route
│   ├── lib/
│   │   ├── fonts.ts            next/font/local
│   │   ├── metadata.ts         buildMetadata(route)
│   │   ├── env.ts              lecture des variables, sans exception au chargement
│   │   ├── validation.ts       schémas Zod partagés client/serveur
│   │   ├── structured-data.ts  Organization, WebSite, BreadcrumbList
│   │   └── email/
│   │       ├── transport.ts    interface + Resend + repli console
│   │       ├── templates.ts    notification et accusé de réception
│   │       └── submission.ts   traitement commun, débit, anti-spam, journal
│   ├── styles/
│   │   ├── tokens.css          source de vérité du design system
│   │   ├── base.css            reset, typographie, focus, sélection, reduced-motion
│   │   ├── globals.css         importe tokens + base
│   │   └── fonts/              .woff2 + licences OFL
│   └── types/
│       └── index.ts            Route, NavItem, Surface
├── tests/                      validation.test.ts, submission.test.ts
├── .env.example                variables, sans aucune valeur
├── vitest.config.ts
├── eslint.config.mjs
├── next.config.ts
├── tsconfig.json
├── .nvmrc
└── package.json
```

Principes appliqués :

- **Statique par défaut.** Les pages commerciales restent prérendues. Le journal et ses
  articles utilisent une revalidation horaire afin qu'un article déjà rédigé puisse paraître
  à la date prévue sans intervention manuelle. Aucune génération de texte n'a lieu en ligne.
- **Cinq îlots client** : `Header.tsx` (état de défilement, `aria-current`),
  `MobileNavigation.tsx` (ouverture du panneau, piège de focus), `DiagnosticForm.tsx` et
  `ContactForm.tsx` (état d'envoi), `RevealObserver.tsx` (~1 Ko, révélation au défilement).
  Tout le reste est composant serveur.
- **Le type `Route` est fermé.** Ajouter une page sans la déclarer dans `src/types/index.ts`
  fait échouer le typecheck — impossible de créer un lien mort vers une route inexistante.
- **Aucun texte stratégique en dur dans un composant.** Promesse, explication, descripteur,
  étapes du parcours et appel à l'action vivent dans `src/content/brand.ts`.
- **Domaine centralisé.** L'URL et le domaine de production sont déclarés une seule fois dans
  `src/content/site.ts`, puis consommés par les coordonnées, le légal et le repli des e-mails.
- **Aucune couleur en dur.** Toutes les valeurs viennent de `tokens.css`.
- **`site.indexable = false`** tant que le domaine n'est pas connecté : toutes les pages sont
  en `noindex, nofollow`. Le passage à `true` fait partie de la phase 10.
- **Racine Turbopack explicite.** `next.config.ts` fixe `turbopack.root` sur le dossier du
  dépôt afin qu'un lockfile présent plus haut sur la machine ne modifie ni la résolution des
  dépendances ni la racine du build.

### 2.1 Journal et publication planifiée

- `src/content/blog.ts` est la source unique : slug, titre, résumé, date, catégorie et contenu.
- `getPublishedArticles()` masque toute publication dont la date n'est pas atteinte.
- `/blog` et la fenêtre de l'accueil sont revalidés au maximum toutes les heures.
- `/blog/[slug]` renvoie 404 avant la date prévue et expose ensuite ses métadonnées propres.
- Le sitemap ajoute uniquement les articles déjà publiés et utilise leur vraie date.
- Aucun CMS, service tiers, tracker ou nouvelle dépendance n'est nécessaire pour cette phase.
- Ajouter un article signifie ajouter un contenu terminé à la file éditoriale ; la
  programmation ne produit ni ne complète le texte.

### 2.2 Accueil resserré et Laboratoire autonome

- L'accueil ne rend plus le Journal ni le Laboratoire complet : ces contenus possèdent leurs
  propres routes et ne concurrencent plus l'estimation.
- Les sections « Entreprises accompagnées » et « Méthode » partagent une même composition.
- SW Car Cleaning conserve une seule fenêtre interactive sur l'accueil. Le Laboratoire ne
  charge que des compositions locales, sans seconde ressource distante identique.
- Aucun paquet ni appel externe n'est ajouté par ce découpage ; la page `/laboratoire`
  réutilise le composant `CreativeLab` et les métadonnées centralisées.

### 2.3 Méthode compacte et orientation créative

- `/methode` conserve ses quatre temps dans les données centralisées, mais les rend dans une
  seule grille responsive au lieu de quatre sections distinctes.
- Les listes sont limitées à trois points publics par temps ; le détail opérationnel reste
  traité lors du diagnostic et n'alourdit pas la lecture initiale.
- `CreativeLab`, déjà client pour ses fenêtres et ateliers, porte un état d'orientation local :
  un choix associe le besoin à un concept existant, sans requête réseau ni stockage.
- La recommandation ouvre la même fenêtre accessible que la carte correspondante et propose
  ensuite l'estimation existante. Aucun second calcul tarifaire n'est ajouté.
- `ConversionPrompt` utilise un délai d'inactivité de 60 000 ms, remis à zéro par les mêmes
  interactions que précédemment. Aucune nouvelle dépendance ni donnée personnelle.

### 2.4 Architecture éditoriale finale et estimation dédiée — 1 août 2026

- L'accueil suit un ordre fixe : en-tête et ligne éditoriale, hero vidéo, transformation,
  réalisation SW Car Cleaning, entreprises accompagnées, méthode, laboratoire compact et CTA.
- `OfferConfigurator` est retiré de l'accueil et réutilisé sans duplication dans
  `/estimation`. La route reçoit ses propres métadonnées et figure dans le sitemap.
- `CreativeLab` est ramené à trois cartes et une fenêtre de détail accessible. L'atelier de
  palette, les scénarios et l'orientation interactive sont supprimés ; aucune iframe distante
  n'y est chargée.
- La seule iframe de démonstration du site reste celle de SW Car Cleaning sur l'accueil.
- Les survols ne déplacent plus le texte ni les espacements. Les variations restent limitées
  aux couleurs, bordures, visuels et flèches, avec neutralisation en mouvement réduit.
- Aucun paquet, service tiers ou nouvelle source de données n'est ajouté.

### 2.5 Lecture tarifaire et devise automatique — 1 août 2026

- Le point de terminaison géographique existant reste la seule source de la région tarifaire.
  Il ne transmet au navigateur que `euro` ou `switzerland`, sans adresse IP ni stockage.
- Le sélecteur de pays est supprimé. Le rendu tarifaire attend la réponse régionale afin
  d'éviter un affichage euro transitoire pour un visiteur suisse ; l'euro reste le repli en
  cas d'indisponibilité.
- Le coût complet est inchangé. Le configurateur calcule un équivalent mensuel exact sur douze
  mois et laisse comparer cette lecture avec la mise en place suivie de l'accompagnement.
- La préférence est ajoutée au message WhatsApp, mais les modalités définitives restent fixées
  par le devis et le contrat.

### 2.6 Page métier — 1 août 2026, verticale conciergerie retirée depuis

- La route `/nettoyage-automobile` consommait un composant serveur `VerticalServicePage`
  alimenté par `src/content/verticals.ts`, pensé à l'origine pour être partagé avec une
  seconde route `/conciergerie` — abandonnée définitivement depuis (voir
  `docs/15-etude-extension-verticale.md`). Le composant `VerticalServicePage` n'est
  aujourd'hui plus importé nulle part : la page automobile vit sur la charte « Dark
  Minimalist » (voir `src/app/page.tsx`).
- Le composant fixait la hiérarchie et l'accessibilité ; les textes, FAQ, étapes et preuves
  restaient des données typées et centralisées afin d'éviter des pages copiées-collées.
- La page automobile utilise uniquement la capture réelle déjà inventoriée de SW Carcleaning.
- Les routes sont ajoutées au type `Route`, aux métadonnées, au sitemap et aux liens internes.
  Aucun paquet, service tiers, formulaire ou calcul n'est ajouté.

---

### 2.7 Acquisition et attribution — 2 août 2026

- Les liens de campagne sont définis dans `src/content/campaign-links.ts` et résolus uniquement par la liste blanche `/go/[campaign]`.
- `AttributionCapture` conserve en `sessionStorage` un premier et un dernier contact limités aux paramètres UTM autorisés, au domaine référent et à la page d’entrée.
- Les formulaires transmettent cette attribution dans un objet dédié, validé et nettoyé côté serveur.
- La mesure commerciale passe par `src/lib/analytics.ts`, sans fournisseur imposé, cookie ni donnée personnelle.
- Les liens `/go/*` restent hors navigation, hors sitemap et non indexables.

## 3. Composants

### En place (phase 1)

| Composant | Type | Rôle |
|---|---|---|
| `Container` | serveur | Largeur maîtrisée : `--container-max` (1260px) ou `reading` (720px), gouttières fluides |
| `Header` | **client** | Wordmark, navigation bureau avec `aria-current`, menu mobile plein écran (`aria-expanded`, `aria-controls`, fermeture par `Échap`, défilement bloqué, focus rendu au bouton) |
| `Footer` | serveur | Trois colonnes, deux `<nav>` étiquetés, section sombre `data-surface="inverse"` |
| `SkipLink` | serveur | « Aller au contenu » → `#contenu`, visible au focus uniquement |
| `Wordmark` | serveur | Logo typographique temporaire, remplaçable sans toucher au reste du code |
| `ButtonLink` | serveur | Variantes `primary` / `secondary` / `inverse`, hauteur minimale 44px |
| `PageIntro` | serveur | En-tête éditorial : sur-titre à filet laiton, `h1`, chapô |

### À construire (phases suivantes)

`Section` (variantes de fond et rythme vertical) · `Filet` · `Numero` (numérotation éditoriale
`01`–`06`) · `Surtitre` · `Diptyque` (image + texte décalé) · `Image` (enveloppe
`next/image` avec `alt` obligatoire) · sections d'accueil (`Constat`, `Parcours`,
`CeQueCaChange`, `ExtraitRealisation`, `AppelAction`) · `FormulaireDiagnostic` et ses champs.

---

## 4. Ordre des phases

Chaque phase se termine par `lint` → `typecheck` → `build` au vert, puis un commit sur
`feature/qualifyr-rebrand-v1`. Aucune phase n'anticipe la suivante.

| Phase | Contenu | État |
|---|---|---|
| **0** | Audit, branche, `AGENTS.md`, `docs/` | **fait** |
| **1** | Fondation : Next.js + TypeScript strict + ESLint, jetons de design, polices locales, layout racine, Header, Footer, huit routes, 404, contenu centralisé | **fait** |
| **2** | Design system : 23 composants globaux, en-tête, menu mobile accessible, pied de page, planche `/design-system` | **fait** |
| **3** | Accueil resserré : hero, deux verticales, trois problèmes, frise du parcours, méthode, réalisation et clôture | **fait** |
| **4** | Pages secondaires : Méthode, À propos, Diagnostic (interface du formulaire), Contact, Réalisations | **fait** |
| **4** | Réalisations (SW Carcleaning) + À propos | **bloqué** — contenus et autorisations réels requis |
| **5** | Étude de cas SW Carcleaning : cinq sections, composants de projet, inventaire des assets | **fait** |
| **6** | Mise en service des formulaires : validation partagée, routes API, transport e-mail, anti-spam, tests | **fait** |
| **6** | Pages légales | **bloqué** — informations juridiques réelles requises |
| **7** | SEO technique, image de partage, données structurées, pages légales | **fait** |
| **8** | Passe qualité : responsive sur 9 paliers, accessibilité, animations, performance, palette | **fait** |
| **9** | Audit final, en-têtes de sécurité, documents de lancement | **fait** |
| **10** | Préproduction sur URL Vercel temporaire, relecture par Dorian | à faire |
| **11** | Bascule du domaine + `site.indexable = true` — **uniquement sur décision explicite de Dorian**. Procédure : `docs/10`. | à faire |

Le domaine `qualifyragence.com`, les DNS, l'ancien déploiement et l'ancien dépôt ne sont
touchés qu'à la phase 11, après validation explicite.

---

## 5. Risques

| Risque | Impact | Traitement |
|---|---|---|
| **Contenus réels manquants** (photos, autorisation SW Carcleaning, informations légales) | Bloque les phases 6 et 8, et pousse à inventer | Marqueurs `TODO_CONTENU_REEL` explicites, jamais de contenu de remplissage. Liste des manques remontée à chaque phase. |
| **Dérive vers l'esthétique « template »** | Perte de la différenciation | Revue systématique contre §11/§12 du document 03 avant chaque commit de section |
| **Vocabulaire interdit qui s'infiltre** dans la microcopy ou les `alt` | Contredit le positionnement | Script de recherche des mots interdits intégré à `lint` |
| **Couleurs interdites** introduites en dur dans un composant | Contredit la DA | Aucune bibliothèque de styles n'expose de palette par défaut ; seuls les jetons de `tokens.css` existent. Contrôle automatisé ajouté en phase 8. |
| **Polices : licence et poids** | Performance et conformité | Cormorant Garamond 600 + Manrope 400/500/600/700 via `next/font/google`, servies localement par Next.js |
| **Formulaire : spam** | Bruit et coût | Champ piège + horodatage + limitation de débit ; CAPTCHA seulement si insuffisant |
| **RGPD** | Risque juridique | Consentement explicite, finalité indiquée, durée de conservation définie, pas de traceur publicitaire |
| **Confusion de cible en SEO** (attirer des automobilistes) | Trafic sans valeur | Requêtes strictement B2B, voir §8. Métadonnées centralisées dans `src/content/site.ts`, relues d'un seul endroit. |
| **Poussée sur le dépôt** : aucune authentification Git dans l'environnement de travail | Livraison | Les fichiers sont livrés à Dorian, qui commite et pousse depuis son poste ; commandes fournies à chaque phase |
| **Rupture avec l'ancien site** (URL, redirections) | SEO existant | Cartographie des URL de l'ancien site à établir avant la phase 10, plan de redirections 301 |

---

## 6. Dépendances

### Installées (phase 1) — six paquets directs, aucun superflu

Production :

```
next@16.2.12
react@19.2.8
react-dom@19.2.8
zod@4.4.3
```

`zod` — validation partagée entre le navigateur et le serveur. Un seul schéma pour les deux
côtés : les deux validations ne peuvent pas diverger.

Développement :

```
typescript@5.9.3
eslint@^9.37.0
eslint-config-next@16.2.12
vitest@4.1.10
@types/node @types/react @types/react-dom
```

`vitest` — exécution des tests. Retenu pour sa prise en charge native de TypeScript et des
modules ES, sans configuration de transpilation.

**Pas de SDK Resend.** L'API tient en un appel `POST /emails` : `fetch`, présent nativement
dans le runtime Node, suffit. Une dépendance de production en moins.

**Aucune** dépendance de style, d'animation, de composants ou d'icônes. Les polices sont des
fichiers versionnés, pas des paquets.

### Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Note : Next 16 n'exécute plus ESLint pendant `next build`. Le lint est donc un contrôle
autonome, à lancer explicitement — c'est ce qu'impose `AGENTS.md` §9.

### À installer plus tard, quand la phase l'exige

```
@playwright/test        phase 8 — parcours critiques
@axe-core/playwright    phase 8 — audit d'accessibilité automatisé
```

Un script `scripts/verifier-vocabulaire.mjs` sera ajouté à la phase 8 et branché sur
`npm run lint` : il fera échouer le contrôle si un mot interdit (document 01, §7) ou une
couleur hors jetons apparaît dans le contenu visible.

Aucune autre dépendance sans justification écrite dans ce document.

---

## 7. Formulaires — implémentation

**Deux formulaires en service** : `Diagnostic` (introduction, cinq étapes conditionnelles,
vérification et confirmation) et `Contact` (5 champs).

### 7.1 Validation

Un seul fichier, `src/lib/validation.ts`, sert le navigateur **et** le serveur. Les deux
validations ne peuvent pas diverger. Celle du serveur fait foi : celle du navigateur peut être
contournée.

- Toutes les chaînes sont nettoyées avant validation : caractères de contrôle retirés, espaces
  normalisés, valeur coupée à sa taille maximale.
- **Toutes** les chaînes ont une borne (120 à 2000 caractères selon le champ).
- Les listes déroulantes et les cases sont validées contre les options déclarées dans
  `src/content/forms.ts` : une valeur inventée est refusée.
- Messages d'erreur en français, précis, propres à chaque champ.

### 7.2 Expérience de saisie

- **Les saisies sont conservées** en cas d'erreur, y compris après un aller-retour serveur.
  L'état vit dans React ; rien n'est réinitialisé, jamais.
- **Focus porté sur le premier champ fautif**, dans l'ordre de lecture du formulaire.
- **Résumé d'erreurs** en tête, `role="alert"`, focalisable, listant chaque champ concerné.
- L'erreur d'un champ disparaît dès que l'on y touche.
- État d'envoi : bouton neutralisé, `aria-busy`, libellé « Envoi en cours ».
- **Double envoi impossible** : bouton neutralisé pendant l'envoi, plus un verrou par
  référence contre une seconde soumission concurrente.
- Aucune erreur n'est véhiculée par la seule couleur : bordure épaissie, repère et texte.

### 7.3 Vérification, envoi et confirmation

La vérification reprend les réponses par groupe et permet de modifier chaque étape sans perte
de saisie. Le bouton final envoie toujours le schéma complet vers `POST /api/diagnostic`.

La confirmation **remplace le formulaire sur place** uniquement après une réponse serveur
réussie. Elle ne promet aucun délai. Elle peut proposer WhatsApp et le calendrier comme suites
facultatives si leurs URL publiques sont valides. En cas d'échec, le formulaire reste visible,
le message indique que rien n'a été transmis et le résumé WhatsApp devient un repli manuel.

Une session inachevée n'est jamais restaurée silencieusement : l'introduction propose
explicitement « Continuer » ou « Recommencer ».

### 7.4 Anti-spam — et ses limites

| Mesure | Ce qu'elle fait |
|---|---|
| Champ piège (`fax`) | Hors du flux de tabulation, masqué aux technologies d'assistance. Rempli → réponse `200` **sans rien envoyer** : le robot n'apprend rien. |
| Temps minimal (2,5 s) | Une soumission plus rapide que l'affichage humain est refusée. |
| Limitation de débit | 5 envois par tranche de 10 minutes et par adresse IP. |
| Bornes de taille | Aucun champ sans maximum. |
| Nettoyage | Caractères de contrôle retirés, espaces normalisés. |
| Validation serveur | Seule source de vérité. |

**Ce n'est pas une protection absolue, et il ne faut pas la présenter comme telle.** Un robot
patient qui ignore le champ piège et attend quelques secondes passera. La limitation de débit
est en mémoire : elle n'est pas partagée entre instances et se vide à chaque démarrage à
froid. Ces mesures écartent les envois automatisés les plus courants sans imposer de CAPTCHA
au visiteur. Si le volume de spam devenait gênant, l'étape suivante serait un service de
vérification côté serveur — pas un CAPTCHA visuel.

### 7.5 Envoi d'e-mail

Aucun fournisseur n'existait dans le projet. Une **abstraction de transport** a été créée :
le reste du code ne connaît que l'interface `EmailTransport`. Changer de fournisseur revient à
écrire une implémentation ; aucune route ni aucun composant n'a à bouger.

| Situation | Comportement |
|---|---|
| Configuration complète | **Resend**, appelé en HTTP. Notification à Qualifyr + accusé de réception au visiteur. |
| Configuration incomplète, **hors production** | Transport console : l'e-mail est écrit dans le terminal du serveur avec la liste des variables manquantes. Aucun accusé de réception — rien n'est réellement envoyé, autant ne pas le prétendre. |
| Configuration incomplète, **en production** | Réponse `503` : « Votre message n'a pas été transmis. » **Jamais de faux succès.** Aucun détail technique n'est exposé au visiteur. |
| Fournisseur en panne | Réponse `502`, message honnête, aucune prétention d'envoi. |

Une adresse de secours n'est proposée que si elle est réellement renseignée dans
`src/content/contact.ts` — ce n'est pas le cas aujourd'hui, donc rien n'est affiché.

### 7.6 Contenu des e-mails

**Reçu par Qualifyr** : type de formulaire, date complète (fuseau Europe/Paris), coordonnées,
entreprise, zone, ancienneté, site actuel, méthodes de réservation, objectif prioritaire,
blocage, message, URL de provenance. `reply_to` positionné sur l'adresse du visiteur :
répondre suffit.

**Accusé de réception** : envoyé **uniquement** si un vrai fournisseur est configuré. Ton
sobre, résumé minimal, **aucun délai annoncé**. Un échec d'accusé de réception ne remet pas en
cause la demande, qui est bien arrivée.

Texte brut uniquement : lisible partout, léger, et aucune question d'échappement HTML sur des
données saisies par un visiteur.

### 7.7 Confidentialité

- **Aucun stockage.** Les demandes transitent par e-mail, rien n'est écrit en base.
- Aucun traceur, aucun pixel, aucun suivi publicitaire.
- Consentement **jamais pré-coché**, avec un lien réel vers la politique de confidentialité.
- **Journalisation minimale** : type de formulaire, issue, cause technique. Ni nom, ni
  e-mail, ni message, ni adresse IP n'est écrit dans les journaux.

### 7.8 Variables d'environnement

Voir `.env.example`. **Aucun secret n'est versionné.**

| Variable | Rôle | Sans elle |
|---|---|---|
| `RESEND_API_KEY` | Clé API Resend | Envoi impossible |
| `CONTACT_TO_EMAIL` | Boîte qui reçoit les demandes | Envoi impossible |
| `CONTACT_FROM_EMAIL` | Adresse d'expédition, domaine vérifié chez Resend | Envoi impossible |
| `NEXT_PUBLIC_SITE_URL` | URL publique, liens absolus des e-mails | Repli sur `https://qualifyragence.com` |

Les trois premières sont nécessaires **ensemble**. En production, elles se déclarent dans
Vercel, jamais dans le dépôt.

### 7.9 Tests

61 tests, `npm run test`.

- `tests/validation.test.ts` — nettoyage, champs obligatoires, e-mails invalides, bornes de
  taille, URL facultative, consentement, champ piège, agrégation des erreurs.
- `tests/submission.test.ts` — succès et contenu de l'e-mail, validation serveur, corps
  illisible, champ piège ignoré silencieusement, envoi trop rapide, limitation de débit,
  panne du fournisseur (HTTP et réseau), configuration absente en production et hors
  production.

`fetch` est remplacé dans les tests : aucun appel réseau, aucune clé requise.

---

## 8. SEO — implémentation

Le référencement décrit l'offre réellement visible : création de sites internet,
applications web et solutions digitales sur mesure pour les entreprises. Les pages de
réalisation peuvent préciser un métier client, sans transformer Qualifyr en prestataire de
nettoyage ni viser les requêtes des particuliers.

### 8.1 Métadonnées

- `metadataBase` et tous les canonical sur le domaine public fixe
  `https://qualifyragence.com`. Une preview ne publie jamais sa propre URL comme canonical.
- **Titres et descriptions uniques**, rédigés à la main, centralisés dans
  `src/content/site.ts`. Vérifié : 10 titres uniques, 10 descriptions uniques, toutes entre
  130 et 165 caractères.
- Les titres portent déjà la marque : `buildMetadata` utilise `title.absolute`, le gabarit
  `%s — Qualifyr Agence` ne s'applique donc pas deux fois.
- `canonical` sur chaque page, en absolu.
- Open Graph et Twitter Card (`summary_large_image`) sur **toutes** les pages.
- `lang="fr"` sur `<html>`, `og:locale` `fr-FR`.

### 8.2 Image de partage

`public/images/og/qualifyr-og-v3.png` — 1200 × 630. Composition **originale** alignée sur
la nouvelle identité : fond ivoire, marque Qualifyr, titre éditorial en Cormorant Garamond
et composition charbon/laiton sans capture d'interface fictive.

Aucun mockup, aucune capture d'interface, aucune photographie sous licence. Générée à partir
des polices du projet — le fichier est versionné, rien n'est produit au build.

### 8.3 Données structurées

Types employés, **uniquement avec des faits vérifiables** : `Organization` enrichi du type
`ProfessionalService`, `WebSite` sur toutes les pages, `WebPage` sur l'accueil,
`Service` sur la page de création de site et les deux pages métier, `FAQPage` lorsque les
questions et réponses sont réellement visibles, et `BreadcrumbList` sur les pages qui
affichent réellement un fil d'Ariane. Les pages métier relient explicitement leur `WebPage`,
leur `Service` et leur FAQ. `sameAs` et les coordonnées restent conditionnels aux vraies
valeurs centralisées dans le projet.

**Volontairement absents** : `SoftwareApplication` (Qualifyr ne vend pas de logiciel),
`Product` / `Offer` (aucun tarif), `AggregateRating` et `Review` (aucun avis recueilli),
`LocalBusiness` (aucune adresse confirmée — en inventer une pour obtenir un encart serait une
fausse déclaration).

Les propriétés dont la valeur est inconnue sont **omises**, jamais devinées : `legalName`,
`email`, `telephone`, `taxID` et `vatID` n'apparaîtront qu'une fois renseignés dans
`company.ts`.

### 8.4 `robots.txt` et `sitemap.xml`

Générés, et pilotés par le **seul interrupteur** `site.indexable`.

| État | `robots.txt` | `sitemap.xml` | Balise `robots` |
|---|---|---|---|
| Avant mise en ligne (actuel) | `Disallow: /` | vide | `noindex, nofollow, nocache` |
| Après mise en ligne | `Allow: /`, `Disallow: /api/`, `/design-system`, `Host` + `Sitemap` | 10 URL sur le domaine canonique | `index, follow` |

Les deux états ont été vérifiés en basculant temporairement l'interrupteur. Un aperçu de
préproduction indexé créerait du contenu dupliqué et des liens morts après la bascule : c'est
la raison du verrou.

En production, `OAI-SearchBot`, `PerplexityBot` et `Google-Extended` disposent de règles
explicites identiques à la règle publique générale. Cette déclaration facilite l'audit ; elle
ne contourne jamais les routes techniques déjà interdites.

### 8.4bis Lisibilité par les moteurs génératifs

- `/llms.txt` fournit un résumé textuel factuel de Qualifyr, des deux expertises métier et de
  la seule réalisation publique citée. Il renvoie vers les pages canoniques et ne contient ni
  promesse de résultat, ni faux client, ni tarif.
- Ce fichier est un complément de lisibilité, **pas un facteur de classement garanti**. Les
  pages HTML, leurs liens internes, le sitemap et les données structurées restent les sources
  de référence.
- Les concepts créatifs y sont explicitement distingués des réalisations clients.

### 8.5 Intentions couvertes

Le contenu répond naturellement aux intentions visées, **sans répétition artificielle** :

| Intention | Page qui la sert |
|---|---|
| développer une activité de services | Accueil, À propos |
| site pour lavage auto à domicile | Méthode §Construire, Réalisations |
| prise de rendez-vous pour une activité de services | Méthode §Construire, FAQ |
| réservation detailing automobile | Accueil §Parcours client, Offre |
| parcours client lavage automobile | Accueil §Parcours client, Méthode |
| visibilité locale nettoyage automobile | Accueil §Être trouvé, Méthode §Clarifier |

Aucune page n'a été créée pour un mot-clé, et aucun terme n'est répété au-delà de ce que la
lecture exige.

### 8.6 Audit automatisé

`python3 scripts/audit-seo.py http://localhost:3000` — sans dépendance, bibliothèque standard
uniquement. Contrôle sur le site **réellement rendu** : un `<h1>` par page, présence de `<h2>`,
titres et descriptions présents, uniques et de longueur correcte, `canonical`, Open Graph,
Twitter Card, `lang`, images sans `alt`, liens internes cassés, ancres mortes, pages
orphelines, `target="_blank"` sans `rel`, types JSON-LD interdits, `robots.txt` et
`sitemap.xml`.

Dernier passage : **aucun problème**.

### 8.7 Avant la bascule

Inventaire des URL indexées de l'ancien site, plan de redirections 301, vérification dans la
Search Console, soumission du sitemap. Mesure d'audience : **aucune n'est installée**, et la
politique de confidentialité le dit. Si une mesure respectueuse de la vie privée est ajoutée
plus tard, `src/content/legal.ts` et `docs/07` devront être mis à jour dans le même commit.

---

## 9. Stratégie de déploiement

- **Hébergeur prévu** : Vercel, intégration Next.js native, rendu statique + deux fonctions
  pour les routes API. Aucun adaptateur Astro n'est installé ni nécessaire.
- **Branches** : `main` protégée (aucun envoi direct) ; le travail vit sur
  `feature/qualifyr-rebrand-v1` ; fusion via une demande de tirage une fois la phase 11 validée.
- **Aperçus** : chaque envoi sur la branche génère une URL d'aperçu Vercel. La relecture se
  fait sur ces URL, jamais sur le domaine de production.
- **Préproduction** : l'aperçu de la branche sert de préproduction. Protégée par mot de passe
  si Vercel le permet sur le forfait en cours, et `noindex` sur tous les environnements hors
  production.
- **Le domaine `qualifyragence.com` n'est pas connecté** tant que Dorian n'a pas donné son
  accord explicite. Les DNS, l'ancien déploiement et l'ancien dépôt restent intacts.
- **Bascule (phase 11)** : redirections 301 en place → connexion du domaine → vérification
  HTTPS → contrôle des Core Web Vitals en conditions réelles → soumission du sitemap.
- **Retour arrière** : l'ancien site n'est pas supprimé. En cas de problème, on repointe le
  domaine vers l'ancien déploiement.
- **Variables d'environnement** gérées dans Vercel, par environnement. Jamais dans le dépôt.
- **Suivi post-lancement** : vérification des envois de formulaire, contrôle des erreurs 404,
  audit Lighthouse à J+7.

---

## 9bis. Visuels et contenus réels manquants

Inventaire tenu à jour. **Aucun de ces manques n'est comblé par un contenu fabriqué.**

| Élément | Emplacement concerné | État |
|---|---|---|
| Logo, captures et photographies SW Carcleaning | Accueil §7, `/realisations`, `/realisations/sw-car-cleaning` | **Manquants.** Audit complet et liste précise des fichiers attendus : `docs/06-assets-sw-car-cleaning.md`. Le panneau bascule sur une composition typographique, la galerie se masque. |
| Autorisation écrite SW Carcleaning | idem | **À obtenir.** Condition préalable à la publication de l'étude de cas. |
| URL publique du projet | Hero de l'étude de cas | **Non confirmée.** Le lien externe n'est pas affiché tant qu'elle ne l'est pas. |
| Photographies génériques du métier | Accueil, Méthode, À propos | **Manquantes.** `EditorialMedia` n'est utilisé nulle part : le composant exige une image authentique. |
| Portrait et biographie | `/a-propos` | **Manquants.** |
| Coordonnées | `Footer`, `ContactPanel` | **Manquantes.** `src/content/contact.ts` ne contient que le domaine ; les blocs concernés disparaissent proprement. |
| Informations juridiques | Pages légales | **Manquantes — bloquant pour la mise en ligne.** Inventaire précis : `docs/07-informations-legales-requises.md`. Les pages affichent ce qui est connu et signalent honnêtement le reste. |
| Durée de conservation des demandes | Politique de confidentialité | **À arrêter.** La page reconnaît qu'elle n'est pas définie plutôt que d'annoncer une durée non tenue. |
| Image de partage Open Graph | Toutes les pages | **Faite.** `public/images/og/qualifyr-og.png`, composition originale, 1200×630. |
| Clés d'envoi d'e-mail | `/diagnostic`, `/contact` | **Manquantes.** `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` restent à renseigner. Sans elles, la production répond honnêtement qu'elle ne peut pas envoyer. |
| Domaine vérifié chez Resend | Expédition des e-mails | **À faire.** `CONTACT_FROM_EMAIL` doit utiliser un domaine vérifié, sinon Resend refuse l'envoi. |
| Délai de réponse annoncé | `/contact` | **Non affiché.** Aucun délai ne sera annoncé tant qu'il ne sera pas tenable. |
| Logo définitif | `Logo`, favicons, manifest, Open Graph | **Intégré.** Nouveau lockup fourni le 31 juillet 2026, décliné en monochrome ; master vectoriel officiel recommandé pour l'impression. |

---

## 10. Décisions tranchées et questions restantes

### Tranchées à la phase 1

| Question | Décision |
|---|---|
| Framework | Next.js 16, App Router — demandé par Dorian |
| Gestionnaire de paquets | npm (aucun préexistant) |
| Styles | CSS moderne + CSS Modules, sans Tailwind (§1.1) |
| Polices | Cormorant Garamond 600 + Manrope 400/500/600/700 via `next/font/google` (§1.2) |
| Logo | Wordmark typographique temporaire + favicon `icon.svg`, remplaçables en un fichier |
| Indexation | `noindex` global tant que `site.indexable` vaut `false` |

### Restant à confirmer

1. **Autorisation SW Carcleaning** — nom, visuels, description. Bloque la phase 4.
2. **Informations juridiques réelles** — structure, SIREN, hébergeur, directeur de
   publication, responsable de traitement. Bloquent la phase 6.
3. **Photos réelles** — disponibles, ou production à prévoir. Bloquent les phases 2 et 4.
4. **Canal de contact à afficher** — e-mail seul, ou e-mail et téléphone.
5. **Compte Resend** — à créer, domaine `qualifyragence.com` à vérifier, clé API à générer.
6. **Édition du contenu après mise en ligne** — si Dorian veut éditer seul, un CMS léger doit
   être décidé avant la phase 2, pas après.
7. **Master vectoriel du logo** — le logo est intégré pour le web ; fournir le `.svg`, `.ai`,
   `.eps` ou `.pdf` officiel pour garantir la fidélité en impression.
8. **Nom de l'offre** — « Le parcours Qualifyr » est-il définitif ?
9. **Zone géographique de Qualifyr** — nationale ou régionale.
10. **URL de l'ancien site** — inventaire nécessaire au plan de redirections avant la phase 10.
11. **Informations légales** — les sept champs bloquants de `docs/07-informations-legales-requises.md`, §1.
12. **URL de la page de confidentialité** — `/politique-de-confidentialite` (retenue) ou `/politique-confidentialite` ? Renommable tant que le site n'est pas en ligne.
