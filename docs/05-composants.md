# 05 — Composants

## Échelle visuelle du dashboard — réduction (12 septembre 2026)

Dorian, capture à l'appui (page Démarchage) : « l'affichage est trop immense ». Deux causes,
une propre à la page, une partagée par tout le dashboard.

**Page Démarchage désynchronisée du reste.** `src/app/app/hermes/page.tsx` posait son titre et
son intro à la main en Tailwind (`text-[1.35rem]`, `text-[0.9375rem]`) au lieu des classes
partagées `.title`/`.subtitle`/`.main` (1.1–1.2rem, 0.72rem, largeur maximale 1120px) utilisées
par toutes les autres pages — d'où un titre visiblement plus gros et une largeur non contrainte
sur grand écran. Réalignée sur `invoices/page.tsx` et consorts.

**Réduction partagée, ressentie sur tout le SaaS.** `.title` (desktop 1.3rem → 1.2rem), `.main`
(padding desktop 2rem/2.25rem/3rem → 1.5rem/2rem/2.25rem), `.kpi` (padding 0.9rem/0.95rem →
0.75rem/0.85rem) et `.kpiValue` (1.3rem → 1.15rem) sont utilisées par toutes les pages à cases
(accueil, Démarchage…) — les resserrer ici réduit l'échelle générale sans dupliquer le
changement page par page. `.hermesForm`/`.hermesSection` (écarts 1.5rem → 1.15rem/1.25rem) et le padding des champs
(0.7rem/0.9rem → 0.6rem/0.85rem) suivent le même mouvement.

**Ce qui n'a pas bougé.** Le texte des champs de saisie reste à 16px (`max(16px, 1em)`,
`.shell :is(input, select, textarea)`) — en dessous, iOS zoome la page au focus et ne revient
jamais à l'échelle initiale. Les cibles tactiles (boutons, onglets) gardent leur taille : seuls
les textes, cases et espacements ont été resserrés.

## Mobile dashboard — débordement horizontal et photos avant/après (12 septembre 2026)

À la demande de Dorian : « la page trop large sur bcp d'onglet + lenteur ». Deux bugs distincts,
tous deux issus du même angle mort — le fallback mobile `.mobileList`/`.mobileCard` (déjà en
place sur `/app` pour les demandes) n'avait pas été répété partout où `.table` est utilisé.

**Débordement (« trop large ») — Factures.** `src/app/app/invoices/page.tsx` et
`src/app/app/invoices/[id]/page.tsx` forçaient leur tableau (`style={{ display: 'table' }}`)
au lieu de laisser la règle CSS `.table { display: none }` sous 720px s'appliquer. Un tableau à
4–5 colonnes rendu de force à 360px déborde l'écran — c'était le module concrètement « trop
large ». Retiré ; les deux pages ont désormais une liste de cartes (`.mobileList`/`.mobileCard`)
sous 720px, comme `/app`.

**Contenu disparu, pas seulement débordant — Prospection.** `src/app/app/prospection/[id]/page.tsx`
et `ImportProspects.tsx` n'avaient, eux, aucun forçage — mais aucun fallback non plus : la
règle `.table { display: none }` cachait la liste sous 720px sans rien la remplacer. Le tableau
ne débordait pas, il disparaissait simplement sur téléphone. Ajout du même fallback carte.

**Lenteur — photos Avant/Après.** `src/app/app/cases/page.tsx` chargeait les photos via `<img>`
brut (`eslint-disable-next-line @next/next/no-img-element`), sans compression AVIF/WebP ni
chargement différé — alors que `next.config.js` autorise déjà le Storage Supabase précisément
pour `next/image`. Remplacé par `<Image>` (4:3, `sizes` responsive) : mêmes dimensions
d'affichage (`.casePair img` fixe déjà l'aspect-ratio et l'`object-fit` en CSS), photos
optimisées et chargées à la demande.

## Accent chaud du dashboard et micro-interactions (12 septembre 2026)

À la demande de Dorian : le dashboard (`[data-app='dashboard']`) et l'écran de connexion
(`[data-app='login']`) utilisaient `--accent-2` (bleu givré `#b8cfe4`) et `--accent-3` (lilas
`#c9c4ee`) sur les contours dégradés, points d'état, halos et texte en dégradé — deux couleurs
explicitement interdites par `docs/03-direction-artistique.md` §1.7 (« bleu électrique »,
« mauve, violet ») et déjà signalées, sans être corrigées, dans `docs/17-audit-fonctionnel-trois-agents.md`
finding #4.

**Recolorisation, strictement scopée au dashboard/login.** `--accent-2` et `--accent-3` restent
inchangés partout ailleurs (identité des trois agents sur le site vitrine, `AgentGrid.tsx`,
`.node-hero` etc. — hors périmètre de cette demande, toujours signalé comme non résolu).
Uniquement dans `src/app/app/app.module.css` et les blocs `[data-app='dashboard']` de
`tailwind.css`, chaque référence est remplacée par du laiton (`#c7a06b`) et du cuivre
(`#c9835c`) — les teintes officielles de `docs/03` §1.2, éclaircies pour rester lisibles sur
les fonds presque noirs du dashboard (même logique déjà appliquée à `--state-error`).

**Halos retirés, pas seulement recolorés.** `.paymentPanel`, `.loginBox` et `.navItemFab`/
`.app-tab-fab` portaient des `box-shadow` diffuses ou des cercles floutés en arrière-plan
(`.loginShell::before/::after`) — exactement les « box-shadow diffuses de type glow » et
« halos lumineux » interdits par `docs/03` §1.7. Retirés ; le contour dégradé (net, sans flou)
suffit à porter l'accent. Une ombre neutre (`rgba(0, 0, 0, …)`, sans teinte) remplace la lueur
là où un peu de relief restait utile.

**Micro-interactions ajoutées** (`peps` demandé par Dorian) : survol laiton sur les onglets du
menu latéral (`.navItem`, ordinateur uniquement — `hover: hover` exclut le tactile), léger
soulèvement + ombre laiton au survol de `.app-primary`, contour laiton au survol de
`.app-ghost`/`.app-filter`, et un survol équivalent sur `.paymentPanel`. Toutes ces transitions
sont neutralisées sous `prefers-reduced-motion: reduce`.

## Mode de paiement manuel — virement et lien PayPal (12 septembre 2026)

Référence : `docs/18-options-paiement-acompte.md`. `PaymentSetup.tsx` (dashboard,
`/app/prestations`) gagne un sélecteur en tête de module — Stripe (inchangé) ou
« Je gère la réception moi-même ». En mode manuel, un second sélecteur propose
virement bancaire ou lien PayPal personnel, avec un avertissement non masquable
(`.manualWarning`, ambre — même vocabulaire que `.badgeAttente`) : ce mode retire
la garantie anti-désistement que Stripe apporte, et Qualifyr ne peut pas vérifier
qu'un paiement a réellement eu lieu.

Réglages persistés via `PUT /api/app/payment-settings` (nouvelle route), lus via
`GET` de la même route — distincte de `/api/app/stripe-connect`, qui reste le
seul point d'entrée pour l'onboarding Stripe. Le lien PayPal est validé côté
serveur (`src/lib/detailing/paypal-link.ts`, hôte `paypal.com`/`paypal.me`
uniquement) à l'enregistrement, puis revalidé à chaque lecture publique
(`booking-public.ts`) — jamais fait confiance à une valeur stockée sans
recontrôle, puisque c'est elle qui est montrée comme cliquable à un client final.

Nouveau composant `DepositConfirmButton.tsx` (détail d'une réservation,
`/app/bookings/[id]`) : bouton « Acompte reçu », affiché uniquement pour un
detailer en mode manuel avec une réservation `en_attente_paiement`. Appelle
`PATCH /api/app/bookings/[id]/deposit-confirm`, qui pose `deposit_confirmed_by`
= `'manuel'` — distinct du bouton générique « Confirmer » de `StatusActions`
(préexistant, toujours disponible, mais sans cette traçabilité).

`src/app/reservation/[slug]/confirmation/page.tsx` affiche l'IBAN ou le lien
PayPal du professionnel avec la mention « pas de confirmation automatique »
quand `paymentMode === 'manuel'`, à la place du bouton `PayDepositButton`.

## Boutons d'appel à l'action — retrait du halo lumineux (12 septembre 2026)

`.accent-glow` (halo flouté derrière le bouton, radial-gradient sur `--accent-1`/
`--accent-2`) et `.cta-beam` (anneau conique animé « comète », même famille de
teintes) sont supprimés — classes et définitions CSS. Dorian a signalé visuellement
le défaut (deux formes ovales floues autour des boutons de la section finale de
l'accueil) ; l'effet correspond mot pour mot à l'interdit `CLAUDE.md` sur les « halos
lumineux, néon » et relève de la palette interdite (dégradé utilisant les tokens
d'accent, hors accessoire de marque). Retiré des 8 fichiers qui les posaient sur un
`<Link>`/bouton : `DarkHero.tsx`, `FinalCtaSection.tsx`, `AgentGrid.tsx`,
`DarkFooter.tsx`, `DarkVerticalPage.tsx`, `DemoSection.tsx`, `DarkHeader.tsx` (deux
occurrences), `DarkPricing.tsx`. Les définitions CSS mortes (`tailwind.css`) sont
retirées avec, y compris le `@property --qualifyr-beam-angle` et les
`@keyframes qualifyr-beam-orbit` qui n'existaient que pour `.cta-beam`.

`.accent-ring` (bordure en dégradé des pastilles, `DarkHero.tsx`) et `.accent-text`
sont des classes distinctes, toujours utilisées, non concernées par ce retrait.

## Connexion / création de compte — mise à jour du 12 septembre 2026

`LoginForm` (`/app/login`) n'envoie plus de lien magique. L'écran porte deux onglets
— **Se connecter** et **Créer un compte** — sur les mêmes champs e-mail et mot de passe :

- **Créer un compte** appelle `POST /api/app/signup` (`signUpWithPassword`, douze
  caractères minimum, sans règle de composition — même choix que `PasswordForm`).
  Supabase envoie un e-mail de confirmation ; tant qu'il n'est pas ouvert, aucune
  session n'existe. C'est la seule vérification d'identité : pas de case à cocher,
  pas d'étape supplémentaire.
- **Se connecter** reste `POST /api/app/login-password`, inchangé.
- **Mot de passe oublié ?** est un lien de texte sous le formulaire, visible en mode
  connexion seulement — recours minoritaire, pas une action de même rang que
  « Se connecter ». Il appelle toujours `POST /api/app/reset-password`.
- Un seul bouton « Afficher/Masquer le mot de passe » sert les deux onglets ; aucun
  champ de confirmation du mot de passe (voir la justification dans `PasswordForm`).

**Pourquoi le lien magique a disparu.** Il dépendait d'une redirection Supabase
exactement autorisée dans le projet ; mal configurée, l'e-mail partait mais le lien
ramenait sur l'écran de connexion sans jamais ouvrir de session — silencieusement,
sans erreur visible. Un mot de passe choisi à l'inscription retire cette dépendance
de chaque connexion et ne la laisse plus peser que sur l'e-mail de confirmation.

`app.module.css` gagne `.modeSwitch`/`.modeTab`/`.modeTabActive` (le contrôle
segmenté) et `.forgotLink`. `.error` passe de `#f87171` (rouge vif) à `#e8a598` —
la charte réserve le rouge vif à rien du tout ; `#e8a598` est le même rouge sourd
que `--state-error` dans `tailwind.css`, repris en dur ici car ce module ne voit pas
ce jeton.

## Diagnostic guidé — mise à jour du 1er août 2026

Le diagnostic commercial possède désormais **une seule source de vérité** : la route
`/diagnostic`. Aucun questionnaire WhatsApp parallèle ne doit être maintenu. Les
responsabilités des actions commerciales sont séparées explicitement :

- `DiagnosticLink` mène toujours vers `/diagnostic`, quel que soit l'état de la
  configuration WhatsApp ;
- `WhatsAppDirectButton` ouvre uniquement une conversation directe avec le message court
  public, sans collecter ni prétendre transmettre des réponses ;
- `DiagnosticForm` valide les cinq étapes, envoie d'abord vers `POST /api/diagnostic`, puis
  propose WhatsApp et le calendrier uniquement après une réponse serveur réussie ;
- le résumé WhatsApp structuré est généré par `buildDiagnosticWhatsAppMessage`, sans champ
  vide ni identifiant technique ;
- `useFormSubmission` peut signaler une session inachevée afin que la personne choisisse
  explicitement de la reprendre ou de recommencer.

La modale historique `WhatsAppDiagnostic` et son événement global sont supprimés : ils
dupliquaient la collecte et permettaient de contourner l'envoi serveur.

`DiagnosticForm` orchestre désormais huit états : introduction, cinq étapes, vérification et
confirmation. Les choix sont de vrais boutons radio ou cases à cocher, rendus sous forme de
grandes lignes éditoriales. Un maximum de trois origines de demandes et de deux priorités est
appliqué sans effacer les choix déjà faits.

Le composant réutilise `Field`, `TextInput`, `TextArea`, `Consent`, `HoneypotField`,
`ErrorSummary` et `Button`. La génération du message WhatsApp reste centralisée dans
`src/lib/whatsapp.ts`. Le header global affiche une variante minimale sur `/diagnostic` et le
footer, le bouton WhatsApp flottant et la relance d'inactivité y sont masqués afin de ne pas
concurrencer le parcours.

Design system de Qualifyr Agence. Ce document fait autorité sur l'usage des composants.
Il se lit avec `docs/03-direction-artistique.md` (jetons, compositions) et
`docs/01-positionnement.md` (vocabulaire).

Planche de contrôle : `/design-system`, accessible en développement (`npm run dev`).
Le fichier s'appelle `page.dev.tsx` et cette extension n'est déclarée dans `pageExtensions`
qu'hors production : **ni la route ni sa feuille de style n'existent dans le build livré**.

---

## 0. Principes transverses

1. **Rien n'est écrit en dur.** Aucune couleur, aucun espacement, aucune durée hors
   `src/styles/tokens.css`. Les composants consomment des rôles (`--surface-page`,
   `--text-secondary`, `--rule-strong`), pas des jetons bruts.
2. **Une carte n'est pas un rectangle ombré.** La structure du site repose sur des filets et
   du vide. Les seules ombres autorisées sont `--shadow-subtle` et `--shadow-raised`, et
   aucun composant ne les utilise à ce jour.
3. **`<button>` agit, `<a>` navigue.** Cette distinction n'est jamais inversée.
4. **Une icône ne porte jamais seule une information.** Elle est `aria-hidden`, accompagne un
   texte, et n'est jamais placée dans une pastille colorée.
5. **Aucun contenu inventé.** Un composant qui n'a pas de matière réelle n'est pas rempli :
   il est retiré, ou son bloc disparaît proprement (`ContactPanel`, `Footer`).
6. **Composants serveur par défaut.** Seuls `Header` et `MobileNavigation` sont des îlots
   client, et uniquement parce qu'ils ont besoin de `usePathname`, de l'état d'ouverture du
   menu et de la position de défilement.

---

## 1. Inventaire

### Acquisition et mesure

- `AttributionCapture` : composant client global et invisible ; premier contact stable, dernier contact mis à jour uniquement lors d’une nouvelle campagne.
- `src/lib/analytics.ts` : événements commerciaux typés, émis via `CustomEvent` et vers `dataLayer` uniquement lorsqu’elle existe déjà.
- Les CTA prioritaires portent un identifiant stable. Aucun texte libre, e-mail, téléphone, budget exact ou réponse de formulaire n’est mesuré.

### `src/components/ui/` — primitives

| Composant | Variantes | Rôle |
|---|---|---|
| `Logo` | `size` : `default` \| `large` · `stacked` · `inverse` | Marque + mot |
| `QualifyrMark` | — | Le Q, tracé vectoriel, `currentColor` |
| `Button` | `variant` : `primary` \| `secondary` \| `text` \| `inverse` · `loading` · `disabled` · `withArrow` | Action réelle |
| `ButtonLink` | mêmes variantes | Navigation présentée comme une action |
| `TextLink` | `tone` : `accent` \| `quiet` \| `inverse` · `href` \| `externalHref` | Lien dans un texte |
| `Eyebrow` | `bare` · `numbered` · `inverse` | Sur-titre en capitales espacées |
| `Divider` | `tone` : `hairline` \| `accent` \| `inverse` · `short` · `spacing` | Filet de structure |
| `Icon` | `arrow-right`, `arrow-up-right`, `plus`, `minus`, `close`, `menu` | Jeu d'icônes maison |
| `BrandIcon` | `whatsapp`, `instagram`, `tiktok` | Pictogrammes SVG monochromes des canaux confirmés |

### `src/components/layout/` — mise en page

| Composant | Variantes | Rôle |
|---|---|---|
| `Container` | `width` : `default` (1260px) \| `reading` (720px) \| `wide` | Largeur et gouttières |
| `Section` | `surface` : `page` \| `raised` \| `sunken` \| `inverse` · `spacing` · `ruled` | Bande pleine largeur, rythme vertical |
| `Header` | — | En-tête collant |
| `MobileNavigation` | — | Menu plein écran sous 992px |
| `Footer` | — | Pied de page sombre |
| `SkipLink` | — | Lien d'évitement vers `#contenu` |
| `Breadcrumbs` | `trail` · `current` | Fil d'Ariane, pages de second niveau |

### `src/components/editorial/` — blocs de contenu

| Composant | Variantes | Rôle |
|---|---|---|
| `SectionHeading` | `level` 1–3 · `split` · `inverse` | Sur-titre + titre + chapô |
| `EditorialCard` | `boxed` · `size` : `default` \| `large` · `inverse` | Bloc de texte titré, filet supérieur |
| `OutcomeCard` | `inverse` | Un moyen mis en regard de son effet |
| `JourneyStep` | `inverse` | Une des six étapes du parcours |
| `MethodStep` | `inverse` | Une étape du déroulé d'une collaboration |
| `CaseStudyCard` | `offset` | Réalisation réelle |
| `QuoteBlock` | `centered` · `inverse` · `attribution` | Phrase manifeste |
| `EditorialMedia` | `ratio` : `portrait` \| `landscape` \| `panorama` · `zoom` · `priority` | Image éditoriale |
| `FAQAccordion` | `defaultOpen` | Questions fréquentes |
| `ContactPanel` | `inverse` | Coordonnées réellement renseignées |
| `CallToAction` | `light` · `eyebrow` · `reassurance` · `secondaryAction` | Bloc de clôture |
| `HeroComposition` | — | Planche éditoriale du hero |
| `JourneyTrack` | — | Frise du parcours client |
| `ComparisonPanel` | — | Comparatif avant / après |
| `CasePlate` | `tone` : `sand` \| `ink` · `size` · `logo` · `priority` | Panneau d'identification d'un projet |
| `CaseGallery` | `priorityFirst` | Galerie d'une étude de cas — masquée si vide |
| `ArticleCard` | `featured` · `compact` | Entrée éditoriale du journal : numéro, catégorie, date, titre, résumé et lien de lecture |
| `VerticalServicePage` | `content` | Page commerciale métier partagée : hero, freins, réponse Qualifyr, parcours, preuve ou concept, méthode, FAQ et CTA |

### `src/components/motion/` — mouvement

| Composant | Rôle |
|---|---|
| `RevealObserver` | Un seul observateur par route. Révèle le contenu des grandes `Section` au défilement : opacité et 12 px de translation, une seule fois. La première section reste immédiatement visible. Le serveur rend le contenu **visible** ; le masquage initial dépend de `data-motion="on"`, posé avant le premier rendu uniquement si `prefers-reduced-motion` n'est pas demandé. Sans JavaScript, sans le script, ou en mouvement réduit : la page est entière. |

**Règle** : réservé aux **grandes compositions** — quatre cibles sur tout le site. Jamais sur
le hero, jamais sur une carte, jamais en cascade.

### `src/components/seo/` — référencement

| Composant | Rôle |
|---|---|
| `JsonLd` | Insertion d'un bloc de données structurées. Ne reçoit que des objets construits par `src/lib/structured-data.ts` — jamais de saisie visiteur. |

Les schémas globaux décrivent `Organization` / `ProfessionalService` et `WebSite`. L'accueil
ajoute `WebPage`, la page de création de site ajoute `Service`, et les fils d'Ariane visibles
peuvent ajouter `BreadcrumbList`. Toute coordonnée ou URL sociale inconnue est omise.
Le journal ajoute `Blog` et chaque article publié ajoute `BlogPosting` avec sa date réelle.

### `ArticleCard`

- Composant serveur, sans état ni dépendance.
- La variante `featured` compose une une en deux colonnes sur grand écran ; `compact` sert
  aux articles suivants sur la page du journal. L'accueil ne rend plus de carte d'article.
- Le panneau visuel est typographique et décoratif (`aria-hidden`) : aucune image générique,
  aucun faux écran et aucun projet fictif.
- Toute la carte est un lien ; le titre reste le nom accessible principal.
- Les publications futures ne lui sont jamais transmises.

### `src/components/form/` — formulaires

Le `DiagnosticForm` est un parcours guidé en cinq étapes. Chaque étape est validée avant de
continuer avec le même schéma partagé par le client et l’API. La progression est annoncée aux
technologies d’assistance, les étapes restent modifiables depuis le récapitulatif et le focus
est déplacé vers le titre de l’étape suivante sans modifier la position de lecture. Les
données, les erreurs serveur, le champ piège et la protection contre le double envoi
conservent leur fonctionnement existant.

Les `Select` masquent uniquement la flèche système au profit d'un chevron CSS, sans remplacer
le contrôle natif. Les groupes de cases gardent de vrais `input[type="checkbox"]`, visibles au
clavier et annoncés par les lecteurs d'écran, dans des surfaces tactiles d'au moins 44 px.

| Composant | Rôle |
|---|---|
| `Fieldset` / `FieldRow` | Groupe de champs `<fieldset>` + `<legend>`, rangée à deux colonnes |
| `Field` | Libellé associé, aide facultative, message d'erreur |
| `TextInput`, `TextArea`, `Select` | Contrôles pilotés par React (`value` + `onChange`) |
| `CheckboxGroup` | Cases à cocher multiples |
| `Consent` | Case de consentement, jamais pré-cochée, liée à la politique de confidentialité |
| `HoneypotField` | Champ piège, hors tabulation et hors arbre d'accessibilité |
| `FieldError`, `FormActions`, `RequiredNote` | Message d'erreur, zone d'action, mention des champs requis |
| `ErrorSummary`, `SuccessPanel` | Résumé d'erreurs focalisable, confirmation sur place |
| `useFormSubmission` | Logique commune : état, validation, focus, envoi, verrou |
| `DiagnosticForm`, `ContactForm` | **Îlots client** — assemblage complet des deux formulaires |

---

## 2. Détail et règles d'usage

### `Logo` / `QualifyrMark`

Verrouillage horizontal : le nouveau **Q** à gauche, `QUALIFYR` et `AGENCE` dans le lockup
fourni par Dorian. La variante `stacked` conserve une composition compacte lorsque la hauteur
n'est pas contrainte.

Le fond gris, le halo et le relief métallique du visuel de présentation ne sont pas repris.
Le lockup est préparé en aplat charbon et bascule en ivoire sur les fonds sombres. Les
déclinaisons, la limite de la source raster et le remplacement futur par le master vectoriel
officiel sont documentés dans `docs/12-logo-qualifyr.md`.

**À ne pas faire** : réintroduire un dégradé, ajouter une ombre, colorer la marque en laiton
ou la placer dans une pastille.

---

### `Button` / `ButtonLink`

Quatre variantes. **Le charbon reste la couleur des boutons** : le laiton et le cuivre ne
deviennent jamais une couleur de fond ou de bordure de bouton.

| Variante | Apparence | Quand |
|---|---|---|
| `primary` | Charbon plein, texte blanc chaud | Action principale — une seule par écran |
| `secondary` | Contour `--rule-strong`, fond transparent | Action alternative |
| `text` | Sans fond, soulignement laiton qui se trace au survol | Action tertiaire, dans un flux |
| `inverse` | Blanc chaud plein | Sur `Section surface="inverse"` |

États :

- **hover** : assombrissement + translation de −1px. Neutralisée si `prefers-reduced-motion`.
- **focus** : anneau global `2px` `--focus-ring`, décalé de `3px`. Jamais supprimé.
- **disabled** : `opacity: .45`, curseur `not-allowed`, translation neutralisée.
- **loading** : `aria-busy`, bouton neutralisé, indicateur circulaire + libellé
  « Envoi en cours ». En mouvement réduit, la rotation s'arrête et l'information reste portée
  par le texte.

**Règles** : `withArrow` est réservé aux actions qui font avancer le parcours. Un bouton ne
contient jamais une icône seule sans libellé accessible.

---

### `TextLink`

Le soulignement est **permanent** à 35 % d'opacité et passe à 100 % au survol. Un lien n'est
jamais identifiable par la seule couleur — condition d'accessibilité, pas un choix esthétique.

`externalHref` détecte les URL en `http` et ajoute `target="_blank"`, `rel="noreferrer"` et
une flèche sortante. Les liens `mailto:` et `tel:` restent dans l'onglet courant.

---

### `Eyebrow`

Sur-titre en capitales espacées (`0.12em`) précédé d'un filet de laiton. C'est le **seul**
emploi de majuscules décoratives autorisé sur le site.

**Règles** : un seul par section. Ne porte jamais l'information principale. `bare` retire le
filet pour les usages imbriqués (dans une `EditorialCard`, par exemple).

---

### `Divider`

Outil de structure principal. `tone="accent"` (laiton) est **limité à une occurrence par
écran** : au-delà, l'accent cesse d'être un accent.

---

### `Section` + `Container`

`Section` porte le fond et le rythme vertical, `Container` la largeur. Toujours imbriqués dans
cet ordre — jamais l'inverse.

Alternance des surfaces : `page` (ivoire) par défaut, `raised` (blanc chaud) et `sunken`
(sable) pour marquer un changement, `inverse` (charbon) **une seule fois par page**, pour le
bloc de clôture.

`surface="inverse"` pose `data-surface="inverse"`, ce qui bascule automatiquement l'anneau de
focus et la couleur de sélection de texte. Ne jamais poser cet attribut à la main.

---

### `Header`

Contenu : logo · Méthode · Réalisations · À propos · Diagnostic · bouton « Parler de mon
activité ».

Comportement :

- Collant, `z-index: 100`.
- Au repos, aucun filet : l'en-tête se confond avec la page. Dès 8px de défilement, un filet
  fin apparaît en bord inférieur.
- Fond : voile ivoire à 88 % avec une légère saturation, **sans flou**, sous `@supports`.
  Repli opaque là où `backdrop-filter` n'existe pas. Pas de glassmorphism.
- Page active : couleur pleine **et** filet permanent sous le lien. L'indication ne repose
  jamais sur la seule couleur.
- Navigation clavier complète, `aria-current="page"` sur l'entrée active.

**Interdits** : mega-menu, sous-menu déroulant, second bouton d'action, barre d'annonce,
sélecteur de langue.

---

### `MobileNavigation`

Panneau plein écran sous 992px.

- `aria-expanded` et `aria-controls` sur le déclencheur.
- `role="dialog"` + `aria-modal="true"` + `aria-label` sur le panneau.
- Focus déplacé sur le bouton **Fermer** à l'ouverture, rendu au déclencheur à la fermeture.
- Piège de focus au `Tab` et au `Shift+Tab`.
- `Échap` ferme.
- Défilement du corps de page bloqué, `overscroll-behavior: contain`.
- Cibles ≥ 44px, entrées de menu à 56px de hauteur minimale.
- Zones sûres iOS : `env(safe-area-inset-*)` sur les quatre côtés, `viewportFit: 'cover'`
  déclaré dans le `viewport` du layout racine.
- Numérotation `01`–`04` en repère typographique, sans icône.

---

### `OfferConfigurator`

Parcours progressif en cinq étapes, placé après les preuves de l'accueil. Il recueille
l'activité, la situation et le frein principal avant de présenter une recommandation et le
prix complet sur douze mois.

- aucune réponse présélectionnée ;
- une question principale par écran ;
- cartes entièrement activables au clavier et au toucher ;
- réponses conservées au retour arrière ;
- recommandations déterministes et testées ;
- options ajoutées ou retirées sans masquer leur prix ;
- grille tarifaire déterminée selon le code pays fourni par l'hébergeur : euros par défaut et
  CHF pour la Suisse, sans sélecteur de pays dans l'interface ;
- tarifs suisses calculés avec la règle commerciale documentée, puis arrondis à la dizaine
  supérieure ; aucune adresse IP n'est transmise au composant ni conservée ;
- prix présenté d'abord comme un équivalent mensuel exact sur 12 mois, avec une alternative
  lisible « mise en place + suivi » et le total contractuel toujours visible ;
- WhatsApp prérempli avec les réponses, le parcours, les options et l'estimation ;
- calendrier secondaire et modification des réponses disponibles à l'étape finale.

---

### `Footer`

Clôture globale en deux parties :

1. un bloc d'appel à l'action charbon — « Prêt à transformer votre projet digital ? » —
   avec un lien vers l'estimation et un lien vers le diagnostic ;
2. un pied de page ivoire en quatre colonnes : marque, services, entreprise, coordonnées et
   zone d'accompagnement, puis une ligne légale.

**La colonne « Contact » n'apparaît que si `src/content/contact.ts` contient au moins un canal
renseigné.** Le lien vers le calendrier suit la même règle avec
`NEXT_PUBLIC_QUALIFYR_BOOKING_URL`. Les réseaux sociaux viennent exclusivement de
`contact.social`. Aucune adresse, aucun numéro d'entreprise, aucun téléphone, aucun horaire
ni aucun réseau social n'est inventé — c'est une règle, pas un état provisoire.

Les libellés de services respectent le vocabulaire public autorisé. Un service sans page
dédiée renvoie vers le diagnostic, la méthode ou l'estimation selon l'action réellement
disponible ; aucun lien vide ni route fictive n'est créé.

Les liens Instagram et TikTok sont rendus sous forme de boutons éditoriaux avec pictogramme
SVG et nom du réseau. Le bouton WhatsApp fixe remplace le sigle « WA » par le pictogramme de
marque et expose aussi le mot « WhatsApp » au survol et au focus. Chaque cible conserve un
nom accessible complet et une surface tactile d'au moins 44 px.

---

### `Breadcrumbs`

Réservé aux pages de second niveau : mentions légales, politique de confidentialité, pages de
confirmation. L'arborescence est plate ; un fil d'Ariane sur l'accueil ou sur Méthode serait
du bruit.

La page courante est le dernier élément, sans lien, marquée `aria-current="page"`.

---

### `SectionHeading`

Composant **unique** pour tous les titres : `level={1}` pour le titre de page,
`level={2}` pour une section, `level={3}` pour une sous-section. Il n'existe volontairement
pas de second composant de titre, afin que la hiérarchie reste vérifiable d'un seul endroit.

**Un seul `level={1}` par page.** `split` rejette le chapô en colonne de droite sur grand
écran — c'est la composition asymétrique par défaut du site.

### `VerticalServicePage`

Composant serveur réservé aux deux verticales officielles. Son contenu provient de
`src/content/verticals.ts` et sa structure ne varie pas : un seul H1, sections sémantiques,
listes éditoriales, FAQ native et clôture vers le diagnostic.

- La variante `real` affiche une image réelle et un lien vers l'étude de cas.
- La variante `concept` affiche une composition abstraite sans faux écran et nomme le concept
  avant toute description.
- Les cartes ne sont jamais dupliquées dans les fichiers de route ; les routes ne contiennent
  que les métadonnées, le JSON-LD et la donnée à rendre.
- Aucun chiffre, résultat, prix, témoignage, logo absent ou promesse temporelle ne peut être
  ajouté dans ce composant.

---

### `EditorialCard`

Bloc de texte titré, délimité par un **filet supérieur**. Ni ombre, ni fond, ni gros rayon.

**Trois par rangée au maximum.** Au-delà, on retombe dans la grille de vignettes générique que
la direction artistique proscrit. `boxed` est réservé aux blocs isolés — jamais en grille.

---

### `OutcomeCard`

Met en regard un **moyen** (petit, en sur-titre) et son **effet sur l'activité** (grand, en
serif). La hiérarchie visuelle applique le positionnement : la promesse est le développement
de l'activité, jamais l'outil employé.

**Interdit** : tout chiffre, pourcentage, délai ou statistique dans `result`. Il n'existe
aucune donnée vérifiée à afficher.

---

### `JourneyStep`

Une des six étapes du parcours client. Les libellés — être trouvé, être compris, être choisi,
être réservé plus facilement, obtenir des avis, favoriser les nouvelles réservations — sont du
vocabulaire de référence : **ils ne se paraphrasent pas** et viennent toujours de `journey`
dans `src/content/brand.ts`.

Rendu en séquence continue (`<ul>`), lignes séparées par des filets pleine largeur.
Jamais en grille de vignettes.

---

### `MethodStep`

Une étape du **déroulé d'une collaboration** : cadrage, conception, mise en place, ajustement.
Vertical, relié par un trait continu ponctué de points de laiton.

À ne pas confondre avec `JourneyStep`, qui décrit le parcours du client final. Aucune durée
annoncée tant qu'elle n'est pas un engagement réellement tenu.

---

### `CaseStudyCard`

Réalisation réelle. `deliverables` liste ce qui a été **fait**, jamais ce que cela aurait
produit.

**Interdits absolus** : résultat chiffré, pourcentage, note, témoignage, logo client,
« projet fictif », « concept ». SW Carcleaning peut être cité comme réalisation réelle, sans
aucun chiffre. Une seule réalisation tant qu'il n'y en a qu'une : pas de grille remplie de
cases vides.

---

### `QuoteBlock`

Phrase manifeste en grande serif, précédée d'un filet de laiton. **Pas de guillemets
décoratifs surdimensionnés.**

**Usage par défaut : sans attribution.** C'est un bloc de position, pas un témoignage.
Qualifyr n'a aucun témoignage recueilli et validé ; en produire un ici, même vraisemblable,
est interdit. La prop `attribution` existe pour le jour où une citation réelle et autorisée
par écrit sera disponible — elle reste inutilisée jusque-là.

---

### `EditorialMedia`

Cadre au ratio imposé (`4:5`, `3:2`, `16:9`), `alt` **obligatoire**, `next/image` avec `fill`
et `sizes`. Aucun rayon : l'image est un bloc franc. `zoom` limite l'agrandissement à
`scale(1.02)` et se désactive en mouvement réduit.

La légende porte un repère court en laiton à gauche — annotation de magazine.

**Interdits** : rendus 3D, captures d'interface, faux écrans d'application, mockups flottants,
banques d'images génériques. **Si aucune photo réelle n'est disponible pour une section, on
retire la section** — on ne la remplit pas avec un visuel de substitution.

---

### `FAQAccordion`

Construit sur `<details>` / `<summary>` natifs : pliage accessible au clavier, restitué
correctement par les lecteurs d'écran, **fonctionnel sans JavaScript**. Aucun état React,
aucun ARIA maintenu à la main, aucune dépendance.

L'indicateur `+` pivote de 45° à l'ouverture. Aucune question ouverte par défaut, sauf
`defaultOpen` explicite.

**Ne pas s'en servir pour masquer un contenu faible** : chaque réponse doit tenir seule et
dire quelque chose de vrai.

---

### `ContactPanel`

N'affiche que les canaux réellement présents dans `src/content/contact.ts`. Tant qu'aucun
n'existe, le panneau propose l'échange (bouton vers le diagnostic) plutôt que d'inventer une
adresse, un numéro ou des horaires. **Ce repli est un choix assumé, pas un état d'attente à
combler.**

---

### `CallToAction`

Bloc de clôture, identique en bas de chaque page. Porte l'unique appel à l'action du site.

`reassurance` accepte une liste courte de faits **vérifiables** — « Échange sans engagement »,
« Analyse personnalisée », « Aucune fausse promesse ». Jamais de délai de réponse, de gratuité
chiffrée ni de disponibilité limitée.

**Interdits** : urgence artificielle, « places limitées », compte à rebours, promesse de
rappel sous 24 h, mention de gratuité non tenue. Une seule action principale ;
`secondaryAction` reste facultative.

---

### `HeroComposition`

Planche éditoriale du hero : un panneau charbon portant les sept moments du parcours
(découverte locale → demande d'avis) et une fiche ivoire décalée montrant la **structure**
d'une demande.

**Ce n'est pas une interface, et cela ne doit jamais le devenir.** Les champs de la fiche sont
volontairement vides — on montre l'ossature d'une demande, pas une demande fictive remplie.
La bande de semaine n'affiche que les initiales des jours. **Interdiction stricte** d'ajouter
un prix, une date, une heure, un nom de client ou une note : ce sont des données inventées
(AGENTS.md, §6).

Deux traits obliques à 8 % et 5 % d'opacité évoquent le reflet d'une carrosserie polie. Aucun
dégradé, aucun halo, aucune ombre.

La fiche est `aria-hidden` : purement illustrative, elle serait bruyante à l'oral. La séquence
des moments reste du texte lisible, et un `figcaption` décrit l'ensemble.

Décalage progressif : empilé sous 768px, deux colonnes à partir de 768px, chevauchement de la
fiche sur le panneau à partir de 992px.

---

### `JourneyTrack`

Frise des neuf moments du parcours client.

- **Mobile** : séquence verticale reliée par un trait continu, une étape par ligne,
  entièrement lisible sans zoom.
- **À partir de 768px** : trois colonnes, chaque étape posée sous un filet fin.
- **Aucun défilement horizontal, à aucun palier.** Un carrousel ou une bande scrollable est
  proscrit.

Rendu en `<ol>` : l'ordre porte du sens.

---

### `ComparisonPanel`

Comparatif avant / après. La colonne « avant » est posée sur le sable, la colonne « après »
sur le charbon : le contraste de surface porte la comparaison, sans flèche ni pictogramme de
progression.

**La prop `note` est obligatoire.** Elle rend explicite qu'il s'agit d'une façon de travailler
et non d'un résultat garanti. Aucun chiffre, aucun pourcentage, aucune durée n'a sa place dans
les deux colonnes.

---

### Formulaires

Règles appliquées, non négociables :

- **Un vrai `<label for>` par contrôle.** Jamais de placeholder en guise de libellé : il
  disparaît à la saisie et n'est pas restitué de façon fiable.
- **`<fieldset>` + `<legend>` pour chaque groupe.** Le contexte est annoncé avant les champs,
  sans ARIA ajouté à la main.
- **Les champs facultatifs sont marqués** — plutôt qu'un astérisque sur tous les autres.
- **Contrôles à 16px minimum** (pas de zoom automatique sur iOS), hauteur ≥ 46px,
  bordure `--rule-strong` à 4.88:1 pour respecter WCAG 1.4.11.
- **Aucun état porté par la seule couleur** : le message d'état a un titre, un texte et un
  liseré latéral, et il est annoncé par `role="status"`.
- **Consentement non pré-coché**, avec finalité explicite.

**Les formulaires sont en service.** La validation est partagée avec le serveur
(`src/lib/validation.ts`), les saisies survivent à une erreur, le focus va au premier champ
fautif, le double envoi est bloqué, et la confirmation remplace le formulaire sur place.

Si le service d'e-mail n'est pas configuré, la réponse dit franchement que le message n'a pas
été transmis — **jamais de faux succès** (AGENTS.md, §6). Détail complet dans
`docs/04-plan-implementation.md`, §7.

`useFormSubmission` porte toute la logique : les deux formulaires ne diffèrent que par leurs
champs.

---

### `CasePlate`

Panneau d'identification d'un projet. Deux états, un seul composant :

- **avec logo réel** : image affichée via `next/image`, dimensions déclarées, formats
  modernes automatiques ;
- **sans logo** : composition typographique — secteur, filet de laiton, nom du client en
  grande serif.

Le second état **n'est pas un placeholder d'attente** : c'est une mise en page finie, qui
tient seule et ne se signale jamais comme provisoire. Aucun texte du type « image à venir »
n'est affiché au visiteur.

Pour passer au logo réel : renseigner `logo` dans le fichier de contenu du projet. Aucun
composant à modifier. Utilisé à l'identique sur l'accueil, `/realisations` et l'étude de cas
— un seul endroit à changer le jour où le logo arrive.

---

### `CaseGallery`

Galerie d'une étude de cas. **Rend `null` si la liste est vide** : la section disparaît
entièrement plutôt que d'afficher un cadre vide.

Alternance bureau (16/10, pleine largeur) et téléphone (9/16, en regard du texte, décalé une
fois sur deux). Légendes discrètes numérotées. **Aucun carrousel** : tout est atteignable en
défilant, au clavier comme au doigt.

Performance imposée par le composant : `width`/`height` déclarés (aucun décalage de mise en
page), AVIF puis WebP, `sizes` adapté au format, `loading="lazy"` sauf éventuellement sur le
premier visuel, `priority` réservé au visuel principal. Le type `GalleryItem` rend `alt`
obligatoire — une image sans texte alternatif fait échouer le typecheck.

### `InteractiveSitePreview`

Fenêtre de consultation d'une réalisation web réelle. Le composant charge directement le site
public dans un `iframe` : le visiteur peut faire défiler les pages, suivre les liens et utiliser
la navigation comme sur le site d'origine, sans écran d'activation.

Le composant comporte toujours : le domaine, un lien d'ouverture dans un nouvel onglet, un
titre accessible pour l'`iframe`, un chargement différé et une politique de référent stricte.
Il ne doit jamais être imbriqué dans un lien ou un bouton. Sur mobile, sa hauteur est réduite
afin que la personne retrouve facilement le contenu principal. Dans une composition vedette
sur desktop, son conteneur doit lui donner toute la largeur disponible pour déclencher le
rendu desktop du site intégré.

Les zones d'en-tête et d'actions internes aux fenêtres de réservation ou de diagnostic
restent des conteneurs visuels (`div`) : les éléments sémantiques `<header>` et `<footer>`
sont réservés aux repères globaux de la page.

---

## 3. Exemples de composition

### Ouverture de page

```tsx
<Section spacing="tight">
  <Container>
    <SectionHeading
      level={1}
      split
      eyebrow="Méthode"
      title="La méthode Qualifyr"
      lead="…"
    />
  </Container>
</Section>
```

### Séquence du parcours

```tsx
<Section surface="raised" ruled>
  <Container>
    <SectionHeading eyebrow="Le parcours" title="Six étapes, une seule direction" />
    <ul>
      {journey.map((step) => (
        <JourneyStep key={step.number} number={step.number} label={step.label}>
          …
        </JourneyStep>
      ))}
    </ul>
  </Container>
</Section>
```

### Réalisation en diptyque décalé

```tsx
<Section>
  <Container>
    <CaseStudyCard
      offset
      client="SW Carcleaning"
      title="…"
      summary="…"
      deliverables={['Structuration des prestations', 'Parcours de réservation']}
      media={<EditorialMedia src={photo} alt="…" ratio="portrait" captionMark="01" caption="…" />}
    />
  </Container>
</Section>
```

### Clôture

```tsx
<Section surface="inverse">
  <Container>
    <CallToAction title="Faites grandir votre activité de nettoyage automobile.">
      {brand.explanation}
    </CallToAction>
  </Container>
</Section>
```

---

## 4. Règles à ne pas enfreindre

1. Aucune couleur verte, mauve, violette, bleue ou cyan. Aucun dégradé, aucun néon, aucun halo.
2. Le laiton et le cuivre restent des accents : jamais un fond de bouton, jamais deux accents
   dans une même section.
3. Pas de bento grid, pas de dizaines de petites cartes, pas d'icône dans chaque phrase.
4. Pas de grosse ombre, pas de rayon supérieur à `--radius-sm` (4px), pas de glassmorphism.
5. Pas de dashboard fictif, pas de mockup flottant, pas d'illustration 3D.
6. Un seul `<h1>` par page ; la hiérarchie de titres ne saute jamais un niveau.
7. Aucun texte indispensable visible uniquement au survol.
8. `prefers-reduced-motion` neutralise toutes les transitions, sans perte d'information.
9. Aucun témoignage, chiffre, logo client, tarif ou disponibilité inventé.
10. Aucune nouvelle dépendance sans justification écrite dans `docs/04-plan-implementation.md`.

---

## 4bis. Structure de la page d'accueil

Sept temps éditoriaux, dans cet ordre. L'alternance des surfaces porte le rythme : ivoire par
défaut, sable pour les respirations, **une seule section charbon** — la réalisation réelle.

| # | Section | Surface | Composants |
|---|---|---|---|
| 1 | Hero | page sur vidéo | `Eyebrow`, calendrier, WhatsApp et lien vers la réalisation |
| 2 | Transformation | page | `SectionHeading`, résultats recherchés ×3 |
| 3 | Réalisation | **inverse** | preuve factuelle + `InteractiveSitePreview` unique |
| 4 | Entreprises | sunken | trois familles de services, sans déplacement au survol |
| 5 | Méthode | page | `MethodStep` ×4 |
| 6 | Clôture | page | calendrier, WhatsApp et lien texte vers `/estimation` |

Règles de la page :

- **Un seul `<h1>`** : la promesse. Toutes les sections portent un `<h2>`.
- **Un seul appel à l'action principal** dans le hero : « Réserver un échange ».
- Le diagnostic est secondaire et mène à `/diagnostic` ; le lien tertiaire pointe vers la
  réalisation réelle. WhatsApp direct reste un canal séparé.
- WhatsApp reste disponible dans l'en-tête et le bouton fixe ; le calendrier apparaît dans
  le hero et la clôture.
- L'estimation vit uniquement à `/estimation` et n'est jamais rendue dans l'accueil.
- Le Journal reste sur sa route.

---

## 4ter. Compositions des pages secondaires

Chaque page a une composition distincte, mais consomme le même système. Aucune ne réutilise
la mise en page de l'accueil.

| Page | Composition | Surfaces |
|---|---|---|
| `/methode` | Ouverture courte + grille unique des quatre temps, puis adaptation métier et principe d'outillage réunis | page → raised → sunken |
| `/a-propos` | Ouverture en largeur de lecture, manifeste numéroté en trois colonnes larges, phrase manifeste centrée, bande « ce que nous ne faisons pas » en négatif | page → raised → page → sunken → **inverse** → raised |
| `/diagnostic` | Introduction autonome, cinq étapes conditionnelles, vérification éditable et confirmation après envoi serveur | page → sunken → inverse → page |
| `/contact` | Deux colonnes serrées : orientation et coordonnées à gauche, formulaire court à droite. Page volontairement courte, sans bloc de clôture | page |
| `/realisations` | Une entrée par bande pleine largeur, numérotée, `CasePlate` + descriptif | page, clôture inverse |
| `/realisations/sw-car-cleaning` | Hero en diptyque avec panneau de projet, contexte à deux colonnes, objectifs en séquence numérotée, travail réalisé en négatif sur trois colonnes, galerie conditionnelle, enseignement | page → raised → page → **inverse** → sunken (si galerie) → raised → page |
| `/blog` | Ouverture courte, une éditoriale, puis grille des articles précédents et orientation vers le diagnostic | page → raised → page |
| `/blog/[slug]` | Ouverture en largeur de lecture, contenu séquencé, repère de publication et appel à l'action discret | page → raised → page |

Note : `/contact` est la seule page sans `CallToAction` final. Y placer un appel à l'action
vers le diagnostic juste sous un formulaire de contact serait redondant ; l'orientation vers
le diagnostic est faite en toutes lettres en haut de page.

---

## 5. Composants volontairement absents

- **`Card` générique** — remplacée par `EditorialCard`, `OutcomeCard` et `CaseStudyCard`, qui
  portent chacun une intention. Une carte générique pousse à empiler des vignettes.
- **`Badge` / `Tag` / `Pill`** — aucun usage réel : rien à étiqueter tant qu'il n'y a ni
  catégories, ni tarifs, ni statuts.
- **`Modal` / `Tooltip`** — aucun besoin en V1, et un tooltip cacherait du texte derrière un
  survol.
- **`Carousel`** — proscrit par la direction artistique.
- **`Stat` / `Counter`** — il n'existe aucun chiffre vérifié à afficher.
- **`Grid` générique** — les compositions sont spécifiques ; une grille abstraite ferait
  perdre le contrôle éditorial.
