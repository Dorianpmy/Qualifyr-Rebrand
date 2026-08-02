# 12 — Logo Qualifyr : source et déclinaisons web

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
