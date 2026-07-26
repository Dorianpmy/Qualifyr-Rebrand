# 08 — Passe qualité : responsive, accessibilité, performance

Phase 8. Aucun changement de positionnement, aucune cible ajoutée, aucune fonctionnalité
commerciale nouvelle. Uniquement des corrections de rendu, d'accessibilité et de poids.

---

## 1. Méthode et honnêteté sur les limites

La phase 8 initiale ne disposait pas de navigateur. L'audit final après import a ajouté une
vérification Playwright avec Chrome en complément des trois contrôles existants :

1. **Audit du HTML réellement rendu** par le serveur de production (`next start`) —
   `scripts/audit-a11y.py` et `scripts/audit-seo.py`, bibliothèque standard Python, aucune
   dépendance ajoutée.
2. **Analyse statique du CSS** — calcul des largeurs de contenu, de l'échelle typographique
   et des grilles à chaque palier, détection des motifs à risque (`nowrap`, tailles fixes,
   marges négatives, `direction: rtl`).
3. **Mesure du build** — poids réel des scripts et des feuilles de style téléchargés par
   page, chunk par chunk.
4. **Navigateur automatisé** — neuf pages, 404, viewport 390 px, absence de débordement,
   menu mobile (ouverture et fermeture par Échap), overlay Next, console et validation client.

**Ce qui demande encore un appareil ou une relecture humaine** est listé en §9. Un aperçu autonome de
l'accueil (`apercu-accueil.html`, polices embarquées, aucune requête réseau) est fourni pour
la relecture humaine : il suffit de redimensionner la fenêtre pour parcourir les paliers.

---

## 2. Paliers testés

Largeurs de contenu et échelle typographique calculées à partir du CSS réel.

| Largeur | Gouttière | Contenu | h1 | h2 | corps |
|---|---|---|---|---|---|
| 320 px | 20.0 | 280 px | 36 px | 30 px | 17 px |
| 375 px | 20.1 | 335 px | 38 px | 30 px | 17 px |
| 390 px | 20.5 | 349 px | 39 px | 31 px | 17 px |
| 430 px | 21.6 | 387 px | 41 px | 31 px | 17 px |
| 768 px | 31.1 | 706 px | 56 px | 37 px | 18 px |
| 1024 px | 38.3 | 948 px | 68 px | 41 px | 18 px |
| 1280 px | 45.4 | 1189 px | 72 px | 44 px | 18 px |
| 1440 px | 48.0 | 1260 px | 72 px | 44 px | 18 px |
| 1920 px | 48.0 | 1260 px | 72 px | 44 px | 18 px |

Le conteneur plafonne à 1260 px : au-delà de 1440 px, seules les marges latérales grandissent.
C'est voulu — une ligne de texte plus large nuirait à la lecture.

---

## 3. Corrections apportées

### 3.1 Hero trop à l'étroit entre 992 et 1279 px — **corrigé**

La bascule du hero en deux colonnes se faisait à 992 px. Dans cette fenêtre, la colonne de
droite ne laissait que ~190 px utiles à la composition : tous les libellés du parcours
passaient à la ligne (« Adresse d'intervention », « Choix d'une formule »).

La bascule passe à **1280 px**. Entre 992 et 1279, le hero est empilé et la planche occupe
toute la largeur — plus généreux et plus lisible. À 1280 px, la colonne de droite fait 613 px,
le panneau 344 px, les libellés tiennent sur une ligne.

### 3.2 Pied de page — colonne vide — **corrigé**

La grille était figée à quatre colonnes à partir de 992 px, alors que la colonne « Contact »
n'apparaît que si un canal est réellement renseigné — ce qui n'est pas le cas aujourd'hui.
Une piste restait donc vide, et la répartition était bancale.

Remplacé par `minmax(0, 1.5fr) repeat(auto-fit, minmax(9rem, 1fr))` : la grille s'ajuste au
nombre réel d'enfants, avec ou sans la colonne Contact.

### 3.3 Boutons — risque de débordement — **corrigé**

`white-space: nowrap` passait au retour à la ligne sous 416 px seulement. Au palier 430 px,
le libellé le plus long (« Présenter mon fonctionnement actuel ») occupait 364 px pour
387 px disponibles — 23 px de marge. Trop juste pour un futur libellé plus long.

Seuil relevé à **480 px**, et `max-inline-size: 100%` ajouté : un bouton ne peut plus dépasser
son conteneur, quel que soit son libellé.

### 3.4 Galerie — `direction: rtl` — **corrigé**

L'alternance gauche/droite des visuels mobiles reposait sur `direction: rtl` sur le conteneur,
avec `direction: ltr` restauré sur les enfants. Technique fragile : elle inverse aussi la
ponctuation et le sens de lecture, et provoque des débordements dans certains navigateurs.
Remplacée par `order: 2` sur le cadre — même résultat, aucun effet de bord.

### 3.5 Mots longs — **corrigé**

Ajout d'`overflow-wrap: break-word` sur les paragraphes, listes, définitions, légendes,
citations et libellés. Une URL saisie dans un champ ou une adresse e-mail longue ne peut plus
provoquer de défilement horizontal. La coupure n'intervient qu'en dernier recours.

### 3.6 Longueur de ligne — **corrigé**

`MobileNavigation .footNote` n'avait aucune limite : à 900 px de large, la phrase de
positionnement s'étalait sur toute la largeur du panneau. Limitée à 46 caractères.

### 3.7 Aides de formulaire — **corrigé**

Les textes d'aide sous les champs étaient à 13 px. Passés à **14 px** — ils portent une
instruction utile, pas une métadonnée.

### 3.8 En-tête — `backdrop-filter` retiré — **corrigé**

`backdrop-filter: saturate(1.15)` sur un voile ivoire à 88 % ne produisait aucun effet
perceptible, mais forçait une couche de composition sur un élément collant. Retiré. Le voile
translucide reste, sans aucun filtre : ni flou, ni saturation, ni glassmorphism.

### 3.9 CSS et code morts — **corrigé**

- `.spacedSmall`, `.objectivesNote`, `.bleed` : règles jamais référencées, supprimées.
- `secondaryCta`, `missingLegalFields` : exports jamais importés, supprimés.
- `tracking` : export inutilisé, désormais **branché** sur la politique de confidentialité —
  si un cookie ou une mesure d'audience est un jour déclaré, la page l'affiche
  automatiquement au lieu de rester obsolète.

### 3.10 Planche `/design-system` exclue du build — **corrigé**

La page renvoyait 404 en production, mais **sa feuille de style voyageait dans le chunk CSS
partagé de toutes les pages**. Chaque visiteur téléchargeait le CSS d'un outil interne.

Le fichier s'appelle désormais `page.dev.tsx`, et `pageExtensions` ne déclare l'extension
`dev.tsx` qu'hors production. La route et son CSS **n'existent tout simplement plus** dans le
build livré. La garde `notFound()` est devenue inutile et a été retirée.

Gain : CSS total du build **69,4 Ko → 63,8 Ko**, dont ~1,5 Ko gzip retirés du chunk partagé.

---

## 4. Animations

**Une seule animation ajoutée** : une révélation au défilement, réservée aux grandes
compositions.

| Point | Choix |
|---|---|
| Effet | Opacité 0 → 1 et translation verticale de 8 px |
| Durée | 480 ms, courbe `--ease-out` |
| Répétition | Une seule fois, puis l'observateur se détache |
| Cibles | **4 au total** — frise du parcours, comparatif avant/après, bloc réalisation, livrables de l'étude de cas |
| Hero | **Jamais animé.** Aucun contenu d'ouverture n'attend une animation |
| Cartes | **Jamais animées** individuellement, aucun décalage en cascade |
| Décalage de mise en page | Aucun — `opacity` et `transform` seuls |

**Comment la dégradation est garantie.** Le serveur rend le contenu *visible*. Un script
d'amorçage de 120 octets pose `data-motion="on"` sur `<html>` avant le premier rendu,
**uniquement** si `prefers-reduced-motion` n'est pas demandé. C'est ce seul attribut qui
déclenche l'état initial masqué.

Le layout déclare `suppressHydrationWarning` uniquement sur `<html>` : le script modifie
volontairement cet élément avant l'hydratation. Cette portée étroite évite l'avertissement
React sans masquer une divergence dans le reste de l'arbre.

Conséquences : sans JavaScript, la page est entière ; si le script échoue, la page est
entière ; en mouvement réduit, la page est entière. Aucun clignotement d'un contenu affiché
puis caché après hydratation. Un filet de sécurité révèle tout au bout de 1,5 s si
l'observateur ne s'est pas déclenché, et une règle CSS `!important` sous
`prefers-reduced-motion` rend le masquage impossible.

Interdits respectés : pas de parallaxe, pas de défilement horizontal, pas de curseur
personnalisé, pas de texte qui tourne, pas d'élément flottant permanent, pas de 3D, pas de
vidéo, pas d'animation sur chaque carte.

---

## 5. Accessibilité — résultats

`python3 scripts/audit-a11y.py http://localhost:3000` → **aucun problème** sur les 9 pages.

| Contrôle | Résultat |
|---|---|
| Landmarks | 1 `<header>`, 1 `<main>`, 1 `<footer>` par page |
| `<nav>` nommés | 3 à 5 par page, **tous** avec `aria-label` |
| Lien d'évitement | Présent partout, cible `#contenu` présente partout |
| Ordre des titres | Un seul `<h1>` par page, **aucun saut de niveau** sur les 9 pages |
| Contrôles de formulaire | 12 sur diagnostic, 6 sur contact — **100 % avec `<label for>`** |
| `<fieldset>` / `<legend>` | 4/4 et 1/1 — appariement exact |
| Cases pré-cochées | **0** |
| Liens sans texte | **0** |
| Boutons sans nom accessible | **0** |
| `target="_blank"` sans `rel` complet | **0** |
| `<img>` sans `alt` | **0** (aucune image à ce jour) |
| `<svg>` ni `aria-hidden` ni `role="img"` | **0** |

Points vérifiés par lecture du code :

- **Focus visible** — `:focus-visible` global, anneau 2 px décalé de 3 px, jamais supprimé.
  Bascule automatique en clair sur les fonds sombres via `[data-surface="inverse"]`.
- **Menu mobile** — `role="dialog"`, `aria-modal`, focus déplacé sur Fermer à l'ouverture et
  rendu au déclencheur à la fermeture, piège de focus `Tab`/`Shift+Tab`, `Échap`, défilement
  du corps bloqué, `overscroll-behavior: contain`, zones sûres iOS.
- **Accordéon FAQ** — `<details>`/`<summary>` natifs : clavier et lecteurs d'écran gérés par
  le navigateur, fonctionne sans JavaScript.
- **Erreurs de formulaire** — jamais portées par la seule couleur : bordure épaissie, repère
  graphique et texte. `aria-invalid`, `aria-describedby`, résumé `role="alert"` focalisable.
- **Cibles tactiles** — boutons 46 px, entrées de menu mobile 56 px, options de formulaire
  44 px, déclencheurs 44 × 44 px.
- **Taille de texte** — corps à 17–18 px, jamais moins de 16 px pour un texte courant. Les
  12–14 px sont réservés aux sur-titres, métadonnées et légendes.

---

## 6. Palette et contrastes

Recherche globale : **aucune occurrence** de `green`, `emerald`, `lime`, `purple`, `violet`,
`indigo`, `cyan`, `teal`, `fuchsia`, `magenta`, `sky`. Aucun `rgb()`/`hsl()` en dur hors des
jetons. Une seule valeur hexadécimale hors `tokens.css` : le `themeColor` des métadonnées, que
le navigateur n'accepte pas sous forme de variable.

**Le laiton n'est jamais utilisé pour du texte sur fond clair.** Ses trois emplois en `color:`
sont tous sur charbon (5,73:1). Sur fond clair, il ne sert qu'en `background-color` : filets,
points, repères — éléments décoratifs, exemptés de l'exigence de contraste.

| Paire réellement utilisée | Ratio | Verdict |
|---|---|---|
| Charbon sur ivoire | 16,04:1 | AA texte |
| Espresso sur ivoire | 13,88:1 | AA texte |
| Muted sur ivoire | 4,88:1 | AA texte |
| Cuivre foncé sur ivoire (liens) | 6,19:1 | AA texte |
| Laiton foncé sur ivoire | 4,99:1 | AA texte |
| Bordure forte sur ivoire | 4,88:1 | WCAG 1.4.11 |
| Ivoire sur charbon | 16,04:1 | AA texte |
| Sable sur charbon | 11,88:1 | AA texte |
| Pierre sur charbon | 6,86:1 | AA texte |
| Laiton sur charbon | 5,73:1 | AA texte |

Un seul élément sous 3:1 : le séparateur « / » du fil d'Ariane (pierre sur ivoire, 2,34:1).
Il est `aria-hidden`, purement décoratif, et les libellés portent seuls l'information — les
critères de contraste ne s'y appliquent pas.

---

## 7. Performance — mesures et limite connue

Poids réellement téléchargé, mesuré chunk par chunk sur le build de production.

| Page | JS (gzip) | CSS (gzip) | HTML |
|---|---|---|---|
| `/` | 192 Ko | 9,9 Ko | 97 Ko |
| `/methode` | 186 Ko | 9,9 Ko | 49 Ko |
| `/realisations` | 192 Ko | 9,9 Ko | 31 Ko |
| `/a-propos` | 186 Ko | 9,9 Ko | 43 Ko |
| `/diagnostic` | 255 Ko | 9,9 Ko | 37 Ko |
| `/contact` | 254 Ko | 9,9 Ko | 29 Ko |
| Pages légales | 186 Ko | 9,9 Ko | 29–45 Ko |

**Ce qui va bien**

- **Tous les scripts sont `async`** : aucun ne bloque le rendu. Le premier affichage ne dépend
  que du HTML et du CSS, tous deux servis en statique et prérendus.
- **Polices** : 82 Ko pour deux familles variables, auto-hébergées, préchargées,
  `font-display: swap`, avec `adjustFontFallback` — donc **aucun décalage** au moment où la
  police prend le relais.
- **Aucune image** à ce jour : aucun décalage de mise en page possible de ce côté. Les
  composants `EditorialMedia`, `CaseGallery` et `CasePlate` imposent déjà `width`/`height`,
  AVIF/WebP, `sizes` et `loading="lazy"` pour le jour où des photographies arriveront.
- **`zod` est correctement isolé** sur les deux routes de formulaire (+63 Ko gzip). Les sept
  autres pages ne le téléchargent pas.
- **Composants client réduits au nécessaire** : `Header` et `MobileNavigation` (état de
  défilement, panneau, piège de focus), les deux formulaires, et `RevealObserver` (~1 Ko).
  Tout le reste est rendu côté serveur.

**Limite connue, à signaler franchement**

Le socle de 186 Ko gzip est **le coût du framework** : React 19 et le runtime App Router de
Next 16, répartis sur huit chunks. Rien de notre code n'y contribue de façon notable —
vérifié chunk par chunk. C'est plus lourd que Next 15.

Ce coût est la contrepartie du choix de Next, arrêté à la phase 1 sur demande du
commanditaire. Il n'est pas réductible sans changer de socle : la recommandation initiale
(Astro, qui aurait servi ces pages sans runtime) reste consignée en `docs/04`, §1.3. Comme
tout est `async` et prérendu, l'effet sur le premier affichage reste faible, mais il pèsera
sur le score « Total Blocking Time » d'un audit Lighthouse mobile.

---

## 8. Passe visuelle

| Signal d'« effet template » | État |
|---|---|
| Ombres portées | **Aucune** — aucun composant n'utilise `box-shadow` |
| Dégradés, flou, halo, glassmorphism | **Aucun** |
| Rayons excessifs | Maximum 4 px (`--radius-sm`). `--radius-full` réservé à quatre points décoratifs |
| Icônes | 13 sur l'accueil (dont 10 indicateurs d'accordéon), 2 sur les autres pages |
| Sections charbon | **Exactement une par page** — vérifié sur les cinq pages concernées |
| Alternance des surfaces | Distincte sur chaque page, aucune ne reprend le rythme d'une autre |
| Faux luxe noir-or | Aucun noir pur, aucun or saturé ; charbon `#171513` et laiton mat `#B08A52` |

---

## 9. Ce qui demande encore une vérification humaine

1. **Rendu réel aux neuf paliers sur appareils.** L'audit automatisé confirme 390 px sans
   débordement ; les autres paliers restent à valider visuellement sur matériel réel.
2. **Menu mobile en conditions réelles** — l'ouverture et Échap sont validés par Playwright ;
   restent l'iPhone avec encoche, les zones sûres et une passe clavier humaine complète.
3. **Révélation au défilement** — vérifier qu'elle reste discrète et qu'aucun bloc ne
   « saute ». Tester aussi avec « Réduire les animations » activé dans le système.
4. **Lighthouse mobile** sur un aperçu Vercel, pour les Core Web Vitals réels. Le socle JS
   du framework pèsera sur le Total Blocking Time.
5. **Trois grilles à trois colonnes sur l'accueil** (constat, piliers, offre). Elles sont
   différenciées par la taille de titre et la surface, mais seul l'œil peut confirmer que le
   rythme ne devient pas répétitif.
6. **Lecteur d'écran** — VoiceOver ou NVDA sur les deux formulaires et le menu mobile.
   L'audit vérifie la structure, pas la restitution vocale.
7. **Impression** — aucune feuille de style d'impression n'est prévue. À évaluer si le besoin
   se présente.

---

## 10. Commandes

```
npm run test       ✓ 48 tests, 2 fichiers
npm run lint       ✓ aucune erreur, aucun avertissement
npm run typecheck  ✓ aucune erreur
npm run build      ✓ 13 pages statiques + 2 routes API
```

Audits maison, sur le site rendu :

```
python3 scripts/audit-a11y.py http://localhost:3000   ✓ aucun problème
python3 scripts/audit-seo.py  http://localhost:3000   ✓ aucun problème
```
