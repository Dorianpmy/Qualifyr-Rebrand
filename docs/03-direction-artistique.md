# 03 — Direction artistique

Identité visée : **luxueuse, premium, éditoriale, lumineuse, chaleureuse, précise,
minimaliste, mature, mémorable.**

Matières de référence : papier ivoire, cuir, pierre chaude, métal brossé, laiton mat.
Geste de référence : la précision du detailing — une surface nette, une arête franche, une
finition sans bavure.

Le luxe ici ne vient pas d'un effet, il vient de **l'espace, du rythme typographique et de la
justesse des matières**. Aucune ombre portée décorative, aucun dégradé d'ambiance, aucun halo.

---

## 1. Palette exacte

Palette arrêtée et implémentée dans `src/styles/tokens.css`. Toutes les teintes se situent
entre 13° et 43° (rouge chaud → ambre) : aucune couleur froide n'est possible dans le système.

### 1.1 Matières

| Jeton | Hex | Rôle |
|---|---|---|
| `--color-ivory` | `#F5F0E7` | Fond principal du site (papier ivoire) |
| `--color-paper` | `#FFFDF8` | Surfaces surélevées, cartes, champs |
| `--color-sand` | `#DCCFBD` | Sections alternées, aplats calmes |
| `--color-stone` | `#A99D90` | Éléments décoratifs, barre de défilement |
| `--color-border` | `#DED5C9` | Filets et séparateurs décoratifs |
| `--color-ink` | `#171513` | Texte principal, sections sombres |
| `--color-espresso` | `#2A211C` | Fond sombre alternatif, survol du bouton principal |

### 1.2 Texte et accents

| Jeton | Hex | Contraste sur ivoire | Usage autorisé |
|---|---|---|---|
| `--color-ink` | `#171513` | 16.04:1 | Texte courant et titres |
| `--color-espresso` | `#2A211C` | 13.88:1 | Texte courant |
| `--color-muted` | `#70675F` | 4.88:1 | Texte secondaire (AA) |
| `--color-copper` | `#A9573F` | 4.49:1 | **Sous le seuil AA** — éléments graphiques et survols uniquement, jamais du petit texte |
| `--color-brass` | `#B08A52` | 2.80:1 | **Décoratif uniquement** — filets, sur-titres graphiques |
| `--color-stone` | `#A99D90` | 2.34:1 | **Décoratif uniquement** |
| `--color-border` | `#DED5C9` | 1.28:1 | **Séparateur décoratif uniquement** |

### 1.3 Variantes dérivées, calculées pour l'accessibilité

Trois jetons complètent la palette de départ, car trois usages réels ne pouvaient pas être
servis sans tomber sous les seuils WCAG :

| Jeton | Hex | Contraste sur ivoire | Raison d'être |
|---|---|---|---|
| `--color-copper-deep` | `#8B452F` | 6.19:1 | Liens et texte d'accent — `--color-copper` échoue à 4.49:1 |
| `--color-brass-deep` | `#7F6237` | 4.99:1 | Texte d'accent laiton, si nécessaire |
| `--color-border-strong` | `#70675F` | 4.88:1 | Contours porteurs de sens : champs, boutons secondaires, cartes cliquables (WCAG 1.4.11 exige 3:1, `--color-border` n'en fournit que 1.28:1) |

### 1.4 Rôles sémantiques

Les composants ne consomment jamais un jeton de couleur brut : ils consomment un rôle.
Cela permet de faire évoluer la palette sans toucher aux composants.

```
--surface-page / --surface-raised / --surface-sunken / --surface-inverse
--text-primary / --text-secondary / --text-accent / --text-inverse / --text-inverse-secondary
--rule-hairline / --rule-strong / --rule-accent / --rule-inverse
--focus-ring / --focus-ring-inverse
```

### 1.5 États fonctionnels

Pas de vert ni de rouge vif. Les états sont chauds et **jamais portés par la seule couleur** :
un texte accompagne systématiquement l'état.

| Jeton | Hex | Rôle |
|---|---|---|
| `--state-error` | `#8B452F` | Message d'erreur, bordure de champ invalide |
| `--state-error-surface` | `#F6E7E0` | Fond de message d'erreur |
| `--state-success` | `#4A3F2A` | Message de confirmation |
| `--state-success-surface` | `#EFEADC` | Fond de message de confirmation |

### 1.6 Règles d'emploi

- L'ivoire et le blanc chaud dominent. Le charbon sert aux textes et aux sections fortes.
- Le laiton mat est utilisé avec parcimonie : **un seul accent visible par écran**.
- Le cuivre est un accent rare. Laiton et cuivre ne cohabitent pas dans une même section.
- Aucun effet métallique artificiel, aucun dégradé or, aucun halo.
- Sur fond sombre, l'anneau de focus s'inverse automatiquement via `[data-surface="inverse"]`.

### 1.7 Couleurs strictement interdites

Vert · mauve · violet · bleu électrique · cyan · dégradé bleu-violet · néon · halos lumineux.
Également interdits : le couple noir pur `#000000` + or saturé, les ombres colorées, les
`box-shadow` diffuses de type « glow », les dégradés multicolores.

Seules ombres autorisées : `--shadow-subtle` (`0 1px 2px rgb(23 21 19 / 6%)`) et
`--shadow-raised` (`0 2px 8px rgb(23 21 19 / 7%)`), toutes deux neutres.

---

## 2. Typographies

Deux familles, **auto-hébergées** via `next/font/local` depuis `src/styles/fonts/`.
Aucune requête vers Google Fonts ou un CDN tiers, ni au build ni à l'exécution.

### 2.1 Titres — serif éditoriale

**Newsreader Variable** (200→800), sous-ensemble latin, 58 Ko.
Licence SIL Open Font License 1.1. Exposée via `--font-serif` puis `--family-display`.

Serif de presse, à contraste modéré et à empattements francs : lisible en petite taille,
éditoriale en grande. Écartée : Playfair Display (cliché), Cormorant (trop fine en corps de
texte), Instrument Serif (graisse unique, moins souple).

### 2.2 Texte courant — sans-serif d'interface

**Manrope Variable** (200→800), sous-ensemble latin, 24 Ko.
Licence SIL Open Font License 1.1. Exposée via `--font-sans` puis `--family-text`.

Géométrique mais chaude, terminaisons douces, excellente en petit corps. Écartée : Inter
(trop marquée « produit numérique »), Poppins et Montserrat (trop génériques).

**Total polices : 82 Ko** pour deux familles variables. Les deux sont préchargées.
Une italique Newsreader (64 Ko) est disponible mais non embarquée : à ajouter uniquement si
une composition l'exige réellement.

### 2.3 Échelle typographique

Base 16 px, échelle fluide en `clamp()` de 360 px à 1280 px. Jetons `--text-3xs` → `--text-5xl`
définis dans `src/styles/tokens.css`.

| Rôle | Famille | Jeton | Interlignage | Interlettrage |
|---|---|---|---|---|
| Titre principal (h1) | Newsreader | `--text-5xl` (2.5 → 4.5rem) | 1.05 | −0.02em |
| Titre de section (h2) | Newsreader | `--text-3xl` (1.875 → 2.75rem) | 1.18 | −0.01em |
| Sous-titre (h3) | Newsreader | `--text-2xl` (1.5 → 1.875rem) | 1.18 | −0.01em |
| Titre courant (h4) | Manrope | `--text-lg` | 1.4 | 0 |
| Chapô | Manrope | `--text-lg` | 1.65 | 0 |
| Corps | Manrope | `--text-base` (1.0625 → 1.125rem) | 1.65 | 0 |
| Petit texte | Manrope | `--text-sm` | 1.55 | 0 |
| Sur-titre | Manrope | `--text-3xs` | 1.2 | **0.12em, majuscules** |

Règles :

- Les sur-titres en majuscules espacées sont le **seul** usage de majuscules décoratives.
- Longueur de ligne : `--measure` = 64ch pour le corps de texte.
- Pas de justification. `text-wrap: balance` sur les titres, `text-wrap: pretty` sur les
  paragraphes. Césure désactivée (`hyphens: manual`).
- Chiffres en `oldstyle-nums` par défaut — cohérent avec le registre éditorial.
- `font-synthesis-weight: none` : aucune graisse simulée par le navigateur.

---

## 3. Grilles

- **Conteneur maximal** : 1280 px. Conteneur de lecture éditoriale : 720 px.
- **Grille** : 12 colonnes sur desktop, 8 sur tablette, 4 sur mobile.
- **Gouttières** : 16 px (mobile) · 24 px (tablette) · 32 px (desktop).
- **Marges latérales** : 20 px (mobile) · 32 px (tablette) · 48 px puis auto (desktop).
- **Compositions éditoriales autorisées** : asymétrie franche (par exemple titre sur les
  colonnes 1–5, texte sur 7–12), décalage d'une image sur une colonne pleine bord perdu.
- **Rythme vertical** : les sections s'alignent sur une base de 8 px.

Breakpoints :

```
sm  480px
md  768px
lg  1024px
xl  1280px
```

Conception mobile-first : le style de base cible 360 px de large, les media queries montent.

---

## 4. Espacements

Base 4 px. Échelle utilisée :

```
4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128 · 160 · 200
```

| Usage | Mobile | Desktop |
|---|---|---|
| Espace entre sections | 80 px | 160 px |
| Espace intérieur d'une section large | 64 px | 120 px |
| Titre → chapô | 16 px | 24 px |
| Chapô → contenu | 32 px | 48 px |
| Entre paragraphes | 16 px | 20 px |
| Intérieur de carte | 24 px | 32 px |
| Entre éléments d'une liste | 12 px | 16 px |

Le blanc (ici l'ivoire) est le premier matériau du projet. En cas de doute, augmenter l'espace
plutôt que le réduire.

---

## 5. Rayons

Esthétique éditoriale : arêtes franches. Le rayon est l'exception, pas la règle.

| Élément | Jeton | Valeur |
|---|---|---|
| Images, blocs pleins, sections | `--radius-none` | `0` |
| Cartes et encadrés | `--radius-sm` | `4px` |
| Champs de formulaire | `--radius-xs` | `2px` |
| Boutons | `--radius-xs` | `2px` |
| Anneau de focus | `--radius-xs` | `2px` |
| Étiquettes courtes / puces numérotées | cercle parfait uniquement si l'élément est carré |

Interdits : rayons ≥ 12 px, formes « pilule » sur les boutons principaux, blobs, formes
organiques.

---

## 6. Bordures et filets

- **Filet décoratif** : `var(--border-width) solid var(--rule-hairline)` — séparateurs de rythme uniquement,
  sans valeur informative (exempté de l'exigence de contraste 1.4.11).
- **Filet d'accent** : `var(--border-width) solid var(--rule-accent)`, réservé aux séparateurs de section forts
  et aux soulignements de sur-titre. Jamais plus d'un par écran.
- **Filet sur fond sombre** : `var(--rule-inverse)`.
- **Bordure porteuse de sens** (champ de formulaire, bouton secondaire, carte cliquable) :
  `var(--border-width) solid var(--rule-strong)`, passant à `--color-ink` au focus
  et au survol. Ne jamais utiliser `--rule-hairline` ici : le contraste serait insuffisant.
- Les cartes sont définies par une bordure et un fond `--surface-raised`, **jamais** par une ombre.
- Les séparateurs horizontaux pleine largeur structurent le rythme éditorial — les utiliser
  comme élément de composition, pas comme bouche-trou.

---

## 7. Iconographie

- Style **linéaire**, trait `1.25px`, extrémités et jonctions arrondies, grille 24 px.
- Couleur : `--text-primary` ou `--rule-accent` en décoratif. Jamais bicolore, jamais remplie.
- Jeu de base : Lucide, retravaillé pour uniformiser l'épaisseur de trait. Aucun pictogramme
  illustratif « 3D », aucune icône colorée, aucun emoji.
- Les six étapes du parcours peuvent être signalées par une **numérotation typographique**
  (01, 02, 03…) plutôt que par des icônes — solution à privilégier, plus éditoriale.
- Aucune icône ne porte seule une information : elle est toujours accompagnée d'un texte, et
  reçoit `aria-hidden="true"` quand elle est décorative.

---

## 8. Traitement des images

- **Sujets** : véhicules en cours de soin, gestes de travail, matières (cuir, carrosserie
  nette, microfibre, mousse, reflets), plans rapprochés de détail. Jamais de photos de bureau,
  de poignée de main, de graphiques ou de personnes en costume.
- **Lumière** : naturelle, chaude, latérale. Pas de flash direct, pas d'éclairage de studio froid.
- **Étalonnage** : blancs légèrement crème, noirs remontés vers le brun, saturation contenue,
  grain léger acceptable. Une seule recette d'étalonnage pour tout le site.
- **Cadrage** : formats éditoriaux — `4:5` en portrait, `3:2` en paysage, `16:9` réservé aux
  bandeaux pleine largeur. Ratios déclarés dans le HTML pour éviter tout décalage de mise en page.
- **Traitement** : pas de filtre coloré, pas de surimpression violette ou bleue, pas de coin
  arrondi, pas de cadre ombré. Un léger voile ivoire (`rgba(247,243,236,.06)`) est toléré pour
  harmoniser une image trop froide.
- **Texte sur image** : uniquement si un voile sombre uni (`rgba(28,26,23,.45)` minimum) garantit
  le contraste. Pas de dégradé coloré.
- **Technique** : AVIF puis WebP avec repli JPEG, `srcset` + `sizes`, `width`/`height` explicites,
  `loading="lazy"` hors premier écran, `decoding="async"`.
- **Interdit absolu** : banques d'images génériques de type « équipe qui sourit », rendus 3D,
  visuels générés donnant l'illusion d'un client ou d'un résultat, faux écrans d'application.

---

## 9. Animations

Principe : l'animation confirme une intention, elle ne décore pas.

- **Durées** : 180 ms (micro-interaction) · 320 ms (apparition) · 480 ms (transition de section).
- **Courbe** : `cubic-bezier(0.22, 0.61, 0.36, 1)` par défaut.
- **Apparition au défilement** : opacité `0 → 1` et translation `12px → 0`, une seule fois,
  déclenchée à 15 % de visibilité. Décalage de 60 ms maximum entre éléments d'un même groupe.
- **Survol** : soulignement qui se trace de gauche à droite sur les liens ; assombrissement
  léger sur les boutons ; agrandissement d'image limité à `scale(1.02)`.
- **Focus** : anneau `2px solid var(--focus-ring)` + décalage `3px`, visible instantanément, jamais animé.
- **Interdits** : parallaxe marquée, défilement détourné, compteurs animés, apparitions
  lettre par lettre, curseur personnalisé, effets de particules, transitions de page longues,
  animations en boucle permanente.
- **`prefers-reduced-motion: reduce`** : toutes les animations sont désactivées, les contenus
  s'affichent immédiatement à leur état final. Aucune fonctionnalité ne dépend d'une animation.

---

## 10. Règles responsive

- Conception et intégration **mobile-first**, à partir de 360 px.
- Aucun scroll horizontal à aucun breakpoint. `overflow-x: clip` sur la racine n'est pas une
  solution : la cause est corrigée.
- Les compositions asymétriques desktop se replient en une colonne unique sur mobile, dans un
  ordre de lecture qui reste logique en DOM (pas de réordonnancement visuel contredisant le
  DOM).
- Le titre principal ne dépasse jamais quatre lignes sur mobile.
- Cibles tactiles ≥ 44×44 px, espacées d'au moins 8 px.
- L'en-tête mobile reste minimal : logo + bouton menu. Le bouton d'action principal vit dans
  le panneau de menu et dans le contenu, pas en barre flottante permanente.
- Les tableaux (le cas échéant) deviennent des listes de définitions sur mobile, jamais un
  bloc à défilement horizontal.
- Typographie : jamais en dessous de 16 px pour le corps ; les champs de formulaire sont à
  16 px minimum pour éviter le zoom automatique sur iOS.
- Images : `srcset` obligatoire, aucune image desktop servie telle quelle sur mobile.

---

## 11. Compositions à privilégier

1. **Ouverture éditoriale plein cadre** : ivoire, titre serif très large aligné à gauche sur
   6 colonnes, chapô sur 4 colonnes en dessous, un filet laiton fin, beaucoup de vide, une
   image en bord perdu à droite ou en dessous. Pas de bouton flottant, pas de visuel abstrait.
2. **Séquence numérotée du parcours** : six blocs, chacun avec `01` en sur-titre laiton, un
   titre serif, deux phrases. Séparés par des filets pleine largeur. Rythme régulier, aucune
   carte.
3. **Alternance ivoire / sable** entre sections, avec une seule section charbon dans toute la
   page pour marquer un temps fort (bloc d'appel à l'action final).
4. **Image et texte en diptyque décalé** : image sur 7 colonnes, texte sur 4, décalé
   verticalement — composition de magazine.
5. **Citation ou phrase manifeste** : texte serif large, centré sur la largeur de lecture,
   entouré de vide généreux, sans guillemets décoratifs surdimensionnés.
6. **Bloc d'appel à l'action final** : fond charbon, texte ivoire, une phrase, un bouton.
   Identique sur toutes les pages.

---

## 12. Compositions à éviter

- Grille de trois cartes identiques avec icône ronde colorée en haut — signature « template SaaS ».
- Bandeau de logos clients, compteurs de chiffres animés, badges de notation.
- Capture d'écran d'application flottante avec ombre et reflet.
- Fond dégradé, formes floues en arrière-plan, cercles lumineux.
- Titre centré + sous-titre centré + deux boutons centrés — mise en page par défaut sans intention.
- Sections « Nos valeurs » avec pictogrammes génériques.
- Accordéons empilés servant à masquer un contenu faible.
- Carrousels automatiques.
- Boutons en pilule avec dégradé.
- Superposition de plus de deux niveaux de profondeur : le site est plat, structuré par des
  filets et du vide.
- Toute composition qui rappellerait un site automobile agressif, un site de tuning ou une
  copie de Patissio.

---

## 13. Jetons — implémentation

La source de vérité est le fichier **`src/styles/tokens.css`**, importé une seule fois par
`src/styles/globals.css`, lui-même importé par `src/app/layout.tsx`.

Règles :

- Aucune valeur de couleur, d'espacement, de rayon ou de durée écrite en dur ailleurs.
- Les composants consomment des **rôles** (`--surface-page`, `--text-secondary`,
  `--rule-strong`), pas des jetons bruts.
- Les styles de composants vivent en **CSS Modules** à côté du composant
  (`Header.tsx` + `Header.module.css`) : portée locale garantie, aucune fuite de style,
  aucune classe utilitaire globale.
- `src/styles/base.css` porte la remise à zéro, la typographie de base, le focus visible,
  la sélection de texte, la barre de défilement et `prefers-reduced-motion`.

Aucun mode sombre en V1 : la lumière ivoire fait partie de l'identité. Les sections charbon
(`data-surface="inverse"`) suffisent à créer le contraste, et basculent automatiquement
l'anneau de focus et la couleur de sélection.
