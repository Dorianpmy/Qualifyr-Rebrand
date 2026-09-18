# 12 — Logo Qualifyr : source et déclinaisons web

## 0. Icône « QUALIFYR en toutes lettres » — 18 septembre 2026

Demande de Dorian : remplacer le monogramme `Q` seul par le mot-symbole complet sur le
favicon et les icônes PWA (`icon.svg`, `qualifyr-48.png`, `qualifyr-192.png`,
`qualifyr-512.png`, `apple-touch-icon.png`) — pas le logo d'en-tête (`Logo.tsx` écrit déjà
« QUALIFYR » en toutes lettres, inchangé) ni le monogramme du bouton central mobile
(`QualifyrMark.tsx`, un signe distinct, pas une version réduite du mot-symbole).

Source fournie : rendu 3D blanc glacé sur fond sombre texturé, 1024×1024 — polarité inverse du
lockup de juillet (logo sombre sur fond clair). `scripts/generate-logo-assets.py` gère
maintenant les deux cas (détection par échantillonnage des quatre coins) et un nouveau mode
`--icon-only`, pour une source qui est déjà un mot-symbole autonome sans monogramme séparé à
isoler via `split_mark()` :

```
python3 scripts/generate-logo-assets.py chemin/vers/la-source.png --icon-only
```

**Couleur conservée, pas aplatie.** Contrairement au monogramme `Q`, recoloré en aplat
`IVORY` par `recolor()`/`save_icon()` (la version encore utilisée pour le lockup d'en-tête),
les icônes en place sur le site montrent déjà le dégradé/reflet du rendu d'origine — les
remplacer par un aplat unique aurait été une régression visible, pas un choix neutre.
`extract_alpha_photographic()` garde donc les pixels source, seul le canal alpha est calculé
(mêmes seuils que `extract_monochrome`, lissés en `smoothstep` pour ne pas laisser de bord en
escalier une fois recomposé sur `INK`).

**Remplissage à 84 % de la largeur**, contre 70/72 % pour le monogramme carré
(`save_icon_photographic`, `write_embedded_svg_photographic`) : le mot-symbole est très large
et bas (rapport ≈ 3,75:1) — sans ce remplissage généreux, les lettres deviendraient
minuscules sur un favicon 48×48. Limite assumée : à cette taille, le mot reste petit ; c'est
un compromis inhérent à tout mot-symbole utilisé comme icône carrée, pas un défaut du
traitement.

URLs mises à jour de `?v=5` à `?v=6` (`src/app/layout.tsx`, `src/app/manifest.ts`,
`src/app/app/manifest.webmanifest/route.ts`) pour contourner les caches.

## 1. Source validée le 31 juillet 2026

Dorian a fourni un nouveau visuel de marque composé de :

- un monogramme `Q` serif à longue queue courbe ;
- le mot-symbole `QUALIFYR` en capitales serif ;
- la mention `AGENCE` en petites capitales espacées ;
- une présentation photographique grise avec matière dorée et halo.

La demande est explicite : ce dessin remplace l'ancien logo dans tous les emplacements du
site, y compris le favicon.

Le fichier transmis par l'application Photos était temporaire et a expiré avant son accès par
le système de fichiers. Une base web haute définition a donc été extraite depuis l'image
jointe à la conversation. Ce fichier n'est pas présenté comme le master vectoriel officiel.

## 2. Adaptation à la direction artistique

La forme du nouveau logo est conservée. Les effets de présentation de la photographie ne font
pas partie du logo livré au navigateur :

- fond gris supprimé ;
- halo supprimé ;
- ombre et relief supprimés ;
- matière dorée remplacée par un aplat monochrome ;
- version charbon sur fond clair et version ivoire sur fond sombre.

Cette adaptation respecte `AGENTS.md` §5 et `docs/03-direction-artistique.md` §1.6 : le site
reste éditorial et ne bascule pas vers un effet de faux luxe noir-or. La couleur suit le
contexte ; le dessin reste le signe distinctif.

## 3. Déclinaisons à maintenir

| Usage | Fichier ou composant | Traitement |
|---|---|---|
| En-tête, menu mobile, footer | `Logo.tsx` | lockup horizontal complet, charbon ou ivoire |
| Monogramme réutilisable | `QualifyrMark.tsx` | nouveau `Q`, monochrome |
| Favicon vectoriel | `src/app/icon.svg` | nouveau `Q` ivoire sur fond charbon |
| Favicon PNG | `public/icons/qualifyr-48.png` | nouveau `Q`, 48 × 48 |
| Apple Touch Icon | `public/icons/apple-touch-icon.png` | nouveau `Q`, 180 × 180 |
| Manifest | `public/icons/qualifyr-192.png`, `qualifyr-512.png` | nouveau `Q`, fonds opaques |
| Partage social | `public/images/og/qualifyr-og-v2.png` | nouveau lockup, 1200 × 630 |

Les URL d'icônes portent un numéro de version afin de contourner les caches des navigateurs et
des moteurs après remplacement.

## 4. Limite et fichier recommandé

La déclinaison actuelle est adaptée à l'écran et aux petites tailles. Pour l'impression, la
signalétique ou une reproduction parfaitement fidèle, fournir le master officiel au format
`.svg`, `.ai`, `.eps` ou `.pdf`. Il remplacera la base web sans modifier l'architecture du
site.

Google peut conserver un ancien favicon plusieurs jours après la mise en production. Le
fichier servi par le site doit être vérifié immédiatement ; son affichage dans les résultats
de recherche dépend ensuite d'une nouvelle exploration par Google.
