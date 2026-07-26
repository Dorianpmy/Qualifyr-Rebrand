# 05 — Composants

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

### `src/components/motion/` — mouvement

| Composant | Rôle |
|---|---|
| `RevealObserver` | Un seul observateur pour toute la page. Révèle les blocs marqués `data-reveal-target` : opacité et 8 px de translation, une seule fois. Le serveur rend le contenu **visible** ; le masquage initial dépend de `data-motion="on"`, posé avant le premier rendu uniquement si `prefers-reduced-motion` n'est pas demandé. Sans JavaScript, sans le script, ou en mouvement réduit : la page est entière. |

**Règle** : réservé aux **grandes compositions** — quatre cibles sur tout le site. Jamais sur
le hero, jamais sur une carte, jamais en cascade.

### `src/components/seo/` — référencement

| Composant | Rôle |
|---|---|
| `JsonLd` | Insertion d'un bloc de données structurées. Ne reçoit que des objets construits par `src/lib/structured-data.ts` — jamais de saisie visiteur. |

### `src/components/form/` — formulaires

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

Verrouillage horizontal : le **Q** à gauche, `QUALIFYR` en capitales Newsreader et `AGENCE`
en petites capitales Manrope à droite. La variante `stacked` restitue le lockup empilé de
l'original, là où la hauteur n'est pas contrainte.

Le tracé du Q vient du logo fourni par Dorian, **en aplat monochrome** : le dégradé doré
métallique de l'original n'est pas repris, `AGENTS.md` §5 et `docs/03` §1.6 l'interdisent.
Le dessin est conservé au trait près. Décision, méthode de vectorisation et solutions de
rechange : `docs/12-logo-qualifyr.md`.

`QualifyrMark` n'écrit **aucune couleur** : elle suit `currentColor` et bascule d'elle-même
en ivoire sur les fonds charbon. SVG inline — aucune requête réseau, aucun décalage de mise
en page, 2 Ko de tracé.

**À ne pas faire** : réintroduire un dégradé, ajouter une ombre, colorer la marque en laiton,
la placer dans une pastille. Pour passer au fichier vectoriel d'origine, seul l'attribut `d`
de `QualifyrMark.tsx` change.

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

### `Footer`

Wordmark · phrase de positionnement · domaine · navigation · contact · liens légaux ·
copyright dynamique (`new Date().getFullYear()`).

**La colonne « Contact » n'apparaît que si `src/content/contact.ts` contient au moins un canal
renseigné.** Sinon elle disparaît entièrement. Aucune adresse, aucun numéro d'entreprise,
aucun téléphone, aucun horaire, aucun réseau social n'est inventé — c'est une règle, pas un
état provisoire.

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

Dix sections, dans cet ordre. L'alternance des surfaces porte le rythme : ivoire par défaut,
blanc chaud pour les sections structurantes, sable pour la réalisation, **une seule section
charbon** — la clôture.

| # | Section | Surface | Composants |
|---|---|---|---|
| 1 | Hero | page | `Eyebrow`, `ButtonLink`, `HeroComposition` |
| 2 | Le constat | page | `SectionHeading`, `EditorialCard` ×3 |
| 3 | Résultats recherchés | raised | `SectionHeading`, `EditorialCard size="large"` ×3 |
| 4 | Parcours client | page | `SectionHeading`, `JourneyTrack` |
| 5 | L'offre | raised | `SectionHeading`, `EditorialCard` ×5 |
| 6 | Avant / après | page | `SectionHeading`, `ComparisonPanel` |
| 7 | Réalisation | sunken | `SectionHeading`, `CaseStudyCard` |
| 8 | Méthode (`#notre-methode`) | page | `SectionHeading`, `MethodStep` ×4, `TextLink` |
| 9 | FAQ | raised | `SectionHeading`, `FAQAccordion` |
| 10 | Clôture | **inverse** | `CallToAction` |

Règles de la page :

- **Un seul `<h1>`** : la promesse. Toutes les sections portent un `<h2>`.
- **Un seul appel à l'action principal**, répété au hero et à la clôture, vers `/diagnostic`.
- Le lien secondaire du hero pointe vers l'ancre `#notre-methode`, dans la page.
- Aucune section ne dépasse trois blocs par rangée, sauf l'offre qui passe à trois colonnes
  seulement au-delà de 992px (5 items → 3 + 2).

---

## 4ter. Compositions des pages secondaires

Chaque page a une composition distincte, mais consomme le même système. Aucune ne réutilise
la mise en page de l'accueil.

| Page | Composition | Surfaces |
|---|---|---|
| `/methode` | Ouverture large + index des quatre temps, puis un diptyque décalé par étape (intention à gauche, contenu réel à droite) | alternance page / raised, puis sunken, clôture inverse |
| `/a-propos` | Ouverture en largeur de lecture, manifeste numéroté en trois colonnes larges, phrase manifeste centrée, bande « ce que nous ne faisons pas » en négatif | page → raised → page → sunken → **inverse** → raised |
| `/diagnostic` | Ouverture courte, « ce qui se passe ensuite » en trois temps, puis formulaire avec colonne d'orientation collante | page → raised → page |
| `/contact` | Deux colonnes serrées : orientation et coordonnées à gauche, formulaire court à droite. Page volontairement courte, sans bloc de clôture | page |
| `/realisations` | Une entrée par bande pleine largeur, numérotée, `CasePlate` + descriptif | page, clôture inverse |
| `/realisations/sw-car-cleaning` | Hero en diptyque avec panneau de projet, contexte à deux colonnes, objectifs en séquence numérotée, travail réalisé en négatif sur trois colonnes, galerie conditionnelle, enseignement | page → raised → page → **inverse** → sunken (si galerie) → raised → page |

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
