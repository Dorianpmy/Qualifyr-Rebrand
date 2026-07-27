# 06 — Assets et informations manquants : SW Carcleaning

Document de travail. Il liste **précisément** ce qu'il faut fournir pour que l'étude de cas
`/realisations/sw-car-cleaning` soit complète.

Tant qu'un élément figure ici comme manquant, **il n'apparaît pas sur le site** : ni sous forme
de placeholder public, ni sous forme de mention « image à venir », ni sous forme de contenu
approché. La page est conçue pour être belle et crédible sans ces éléments, et pour les
accueillir sans être redessinée.

---

## 1. Ce qui a été fourni

Reçu en phase 10 :

| Fichier | Contenu | Exploitation |
|---|---|---|
| `index.html` (75 Ko) | Code source complet de la page d'accueil de https://www.swcarcleaning.ch/ | **Exploité** — a servi à établir chaque fait de l'étude de cas |
| `favicon.svg` (420 o) | Pictogramme de voiture, bleu électrique `#0066ff` | **Non repris** — voir §2.1 |

Le fichier HTML a permis de vérifier l'activité, la zone, la méthode, la structure du
parcours, les publics visés et les canaux de contact. L'étude de cas est passée de trois
livrables déduits d'une phrase à **six livrables constatables sur le site en ligne**, chacun
accompagné dans le code d'un champ `source` indiquant quoi regarder pour le vérifier.

**URL confirmée** : `https://www.swcarcleaning.ch/`, d'après le `canonical` du fichier. Le
lien « Voir le site du projet » est désormais actif dans le hero de l'étude de cas.

---

## 2. Ce qui manque encore

### 2.1 Logotype — non fourni

Le seul fichier de marque reçu est un **favicon** : un pictogramme de voiture générique,
420 octets, en bleu électrique `#0066ff`.

Il n'est **pas** utilisé, pour deux raisons cumulées :

1. **Ce n'est pas un logotype.** Un pictogramme d'icône de navigateur ne tient pas la place
   d'une marque sur un panneau de projet — le rendu serait pauvre.
2. **Le bleu électrique est proscrit** par `AGENTS.md` §5 et `docs/03` §1.7. L'afficher
   injecterait dans le site une couleur explicitement interdite.

Le panneau de projet reste donc typographique — une mise en page finie, pas une attente.
Si SW Carcleaning possède un vrai logotype vectoriel, l'envoyer :

| Fichier attendu | Format | Contrainte |
|---|---|---|
| `logo.svg` | SVG | Tracé vectoriel, sans fond |
| `logo.png` | PNG | Repli, ≥ 800 px de large, fond transparent |

À déposer dans `public/images/sw-car-cleaning/`, puis renseigner `logo` dans
`src/content/sw-car-cleaning.ts`. Rien d'autre à modifier.

**À trancher si le logo arrive** : s'il est lui aussi en bleu électrique, il faudra choisir
entre le reprendre tel quel — en actant une exception dans `AGENTS.md`, comme pour le logo
Qualifyr — ou le présenter en monochrome.

### 2.2 Captures d'écran — non fournies

Le code source a été transmis, mais aucune image. Format source **PNG ou JPG non compressé** :
la conversion AVIF/WebP est faite au build par `next/image`.

| Fichier | Contenu attendu | Dimensions minimales |
|---|---|---|
| `desktop-accueil.png` | Haut de la page d'accueil, écran large | 2560 × 1600 |
| `site-accueil.webp` | Hero et galerie de l’étude de cas | 1440 × 900 — **fourni** |
| `desktop-formules.png` | Section « Trouvez votre formule » | 2560 × 1600 |
| `mobile-accueil.png` | Même page sur téléphone | 828 × 1792 |
| `mobile-contact.png` | Parcours de prise de contact sur téléphone | 828 × 1792 |

**Captures réelles uniquement.** Pas de maquette recomposée, pas de cadre de téléphone ajouté
dans un outil de design, pas de rendu 3D.

### 2.3 Photographies — non fournies

| Fichier | Contenu attendu | Dimensions minimales |
|---|---|---|
| `detail-01.jpg` | Détail de carrosserie, matière, geste de travail | 2400 × 1600 |
| `detail-02.jpg` | Second détail, cadrage différent | 2400 × 1600 |

Photographies réelles du travail de SW Carcleaning. Aucune banque d'images.

### 2.4 Texte alternatif — obligatoire pour chaque image

Un texte écrit à la main, en français, décrivant ce que l'on voit — pas le nom du fichier.
Sans `alt`, le typage refuse l'image et le build échoue.

---

## 3. Informations encore à confirmer

| Information | État | Conséquence |
|---|---|---|
| **Autorisation écrite** d'utiliser le nom, le contenu et les visuels | **Non obtenue** | Condition préalable à la publication de la page |
| Périmètre exact du travail de Qualifyr | À confirmer | Les six livrables décrivent ce qui est constatable sur le site ; reste à confirmer que chacun relève bien de la mission |
| Google Business Profile | Non confirmé | Absent de la page |
| Période du projet | Aucune date connue | **Aucune date ne sera inventée**, et aucune n'est affichée |

---

## 4. Ce qui est affiché aujourd'hui, et sur quoi cela repose

**Contexte** — activité, zone, méthode et publics viennent tous du site : lavage et detailing
à domicile, Fribourg et alentours, travail entièrement manuel sans passage en station
automatique, trois publics distingués.

**Six livrables**, chacun vérifiable :

| Livrable | Où le constater sur le site |
|---|---|
| Direction artistique et identité | Identité visuelle de la page |
| Structure du parcours | Navigation : Accueil, Services, Formules, Abonnements, Zone, Contact |
| Présentation des formules | Section « Trouvez votre formule », blocs de publics |
| Zone d'intervention affichée | Section « Zone d'intervention » |
| Parcours de prise de contact | Boutons de devis, message pré-rempli |
| Cadre de confiance | « Un nettoyage clair, sans mauvaise surprise », CGV, politique de confidentialité |

**Les objectifs** sont présentés comme des objectifs de projet, avec une mention explicite
qu'ils ne constituent pas des résultats mesurés.

**Ce qui n'est volontairement pas repris**

- **Les tarifs publics de SW Carcleaning.** Ils évoluent, et ce qui compte dans une étude de
  cas est la décision de conception — afficher un prix d'entrée dès la première page — pas
  son montant.
- **Le téléphone, l'adresse e-mail et le compte Instagram** du client. Ce sont ses
  coordonnées, pas les nôtres ; les republier n'apporte rien et crée une donnée à maintenir.

**Aucun résultat n'est affiché** : ni pourcentage, ni chiffre d'affaires, ni hausse de
réservations, ni nombre de visiteurs, ni témoignage, ni date. Vérifié sur la page rendue.

---

## 5. Marche à suivre une fois les assets fournis

1. Déposer les fichiers dans `public/images/sw-car-cleaning/`.
2. Ouvrir `src/content/sw-car-cleaning.ts`.
3. Renseigner `plate.logo` avec le chemin, les dimensions et le texte alternatif du logo.
4. Ajouter les entrées dans le tableau `gallery` : `src`, `alt`, `width`, `height`, `device`,
   `caption`. La galerie apparaît automatiquement dès la première entrée — elle est masquée
   tant que le tableau est vide.
5. `externalUrl` est déjà renseigné — le lien figure dans le hero.
6. Déplacer les lignes correspondantes de la §3 vers la §4 de ce document.
7. Lancer `npm run lint`, `npm run typecheck`, `npm run build`.

Aucune modification de composant n'est nécessaire. Les emplacements existent déjà et sont
typés : une entrée sans `alt` fait échouer le typecheck.

---

## 6. Traitement des images une fois fournies

Appliqué automatiquement par `CaseGallery` et `next/image` :

- conversion **AVIF puis WebP**, repli sur le format source ;
- `width` et `height` déclarés — aucun décalage de mise en page ;
- `sizes` adapté au ratio (`desktop` ou `mobile`) ;
- `loading="lazy"` sur toutes les images hors du premier écran ;
- `priority` **uniquement** sur le visuel principal, s'il en existe un ;
- `alt` obligatoire, typé — absence bloquante au build.

Rien à configurer à la main lors de l'ajout.
