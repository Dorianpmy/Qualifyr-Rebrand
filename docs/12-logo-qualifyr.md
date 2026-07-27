# 12 — Logo Qualifyr : intégration et décision

---

## 1. Ce qui a été fourni

Un fichier **JPEG, 724 × 1086 px**, montrant le lockup complet :
un **Q en dégradé doré métallique**, `QUALIFYR` en capitales serif en dessous, `AGENCE` en
petites capitales espacées.

Aucun fichier vectoriel (SVG, AI, EPS, PDF) n'a été transmis.

---

## 2. Le conflit, et comment il a été tranché

Le dégradé doré métallique contredit **trois règles écrites** du projet :

| Règle | Source |
|---|---|
| « aucun effet métallique artificiel » | `docs/03`, §1.6 |
| « aucun dégradé or » | `docs/03`, §1.6 |
| « Le luxe ne doit pas reposer sur le cliché noir et or » | `AGENTS.md`, §5 |

Ces règles ont été posées par Dorian en phase 0. Le logo est arrivé en phase 10.
Plutôt que d'intégrer en silence ou d'écarter le logo, le conflit a été soumis.

**Décision de Dorian : version monochrome charbon.** Le dessin de la lettre est conservé au
trait près ; la matière métallique ne l'est pas.

---

## 3. Ce qui a été fait

### 3.1 Vectorisation

Le JPEG a été vectorisé, pas incorporé comme image :

1. Recadrage sur le Q seul (179 × 182 px dans la source).
2. Agrandissement ×2 en Lanczos.
3. Seuil de luminance à 232 — sépare le glyphe du fond blanc.
4. Vectorisation (potrace, `alphamax 1.0`, `opttolerance 1.0`).
5. Suppression du contour parasite correspondant **au reflet du dégradé** sur le flanc droit
   de l'anneau : c'est un artefact de la matière métallique, pas un trait de la lettre.
6. Normalisation dans un `viewBox 0 0 100 98.94`.

**Recouvrement avec le glyphe d'origine : 95,6 %.** Le manque correspond exactement au reflet
retiré. Contrôle visuel effectué à 20, 28, 40, 64 et 120 px : le tracé reste net, la panse et
la queue en volute se lisent correctement à toutes les tailles.

Résultat : `src/components/ui/QualifyrMark.tsx`, **2 000 caractères de tracé**.

### 3.2 Pourquoi un SVG inline plutôt qu'un fichier

- **La couleur suit `currentColor`** : la marque bascule d'elle-même en ivoire sur les fonds
  charbon, sans second fichier ni règle CSS supplémentaire.
- **Aucune requête réseau** : le logo est dans l'en-tête de chaque page.
- **Aucun décalage de mise en page** : pas d'image à charger.
- 2 Ko de tracé, contre ~8 Ko pour un PNG à densité correcte.

### 3.3 Verrouillage horizontal

L'original est empilé — Q au-dessus, mot en dessous. Trop haut pour un en-tête de 72 px.

Le composant `Logo` produit donc un **verrouillage horizontal** : marque à gauche, `QUALIFYR`
et `AGENCE` à droite. La variante `stacked` restitue le lockup d'origine là où la hauteur
n'est pas contrainte.

Le mot passe en **capitales serif** avec un interlettrage de `0.09em`, `AGENCE` en petites
capitales à `0.32em` — au plus près de la proportion du fichier fourni. Le point de laiton qui
tenait lieu de marque provisoire a été retiré : il n'a plus d'objet.

### 3.4 Ce qui a été mis à jour

| Élément | État |
|---|---|
| `src/components/ui/QualifyrMark.tsx` | **créé** — tracé du Q, `currentColor` |
| `src/components/ui/Logo.tsx` | marque + mot, variantes `large`, `stacked`, `inverse` |
| `src/components/ui/Logo.module.css` | verrouillage horizontal, proportions du lockup |
| `src/app/icon.svg` | favicon : Q ivoire sur carré charbon |
| `public/images/og/qualifyr-og.png` | image de partage régénérée avec la marque |
| `src/content/brand.ts` | `Qualifyr` / `Agence` — la mise en capitales est faite en CSS |

---

## 4. Ce qui reste à fournir

### 4.1 Le fichier vectoriel d'origine — **recommandé**

Le tracé actuel vient d'un JPEG de 179 px de large. C'est suffisant à l'écran, mais :

- les courbes sont une **approximation** du dessin d'origine, pas le dessin lui-même ;
- une impression en grand format ferait apparaître les irrégularités du seuillage ;
- les contre-formes fines dépendent d'un seuil de luminance, pas d'une intention de dessin.

**Envoyer le `.svg`, `.ai`, `.eps` ou `.pdf` vectoriel.** Le remplacement se fait dans un seul
fichier : `QualifyrMark.tsx`, en substituant l'attribut `d` du `<path>`. Rien d'autre à
toucher.

### 4.2 La police du mot — **à confirmer**

`QUALIFYR` est composé en **Manrope 700**, conformément au rôle d'interface du wordmark.
Le fichier fourni semble utiliser une autre serif (un Trajan ou apparenté, à empattements
plus marqués).

Deux possibilités :

- **conserver Manrope** — le logo reste cohérent avec la navigation et l'interface ;
- **fournir la police d'origine** — la marque est alors fidèle, mais introduit une troisième
  famille dans le projet (+ poids, + licence à vérifier).

En l'absence de réponse, Manrope est conservée : c'est le choix le plus léger et le plus
cohérent.

### 4.3 Le lockup complet en vectoriel — **facultatif**

Si le verrouillage horizontal doit reprendre exactement les proportions d'un lockup officiel,
il faut le fichier correspondant. Sinon, la composition actuelle fait foi.

---

## 5. Si la décision devait changer

Revenir au dégradé doré est possible, mais suppose :

1. de modifier `AGENTS.md` §5 et `docs/03` §1.6 pour acter l'exception — sinon la prochaine
   passe d'audit signalera une violation ;
2. de remplacer le SVG monochrome par un fichier avec dégradé, ce qui fait perdre l'adaptation
   automatique aux fonds sombres ;
3. d'accepter que le doré métallique jure avec la retenue éditoriale du reste du site — ivoire,
   charbon, filets fins, aucun effet.

Ce n'est pas une impossibilité technique, c'est un arbitrage d'identité. Il est documenté ici
pour qu'il reste explicite.
