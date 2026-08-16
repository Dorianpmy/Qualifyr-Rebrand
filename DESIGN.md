---
version: alpha
name: Qualifyr Dark Premium
description: Dark mode premium — fond noir sombre, cartes translucides, accents néon vert/blanc, Sans-Serif moderne.
colors:
  primary: "#0A0A0C"
  secondary: "#141417"
  tertiary: "#1A1A1D"
  accent: "#12b76a"
  accent-dim: "#0F9F5C"
  neutral: "#F5F5F7"
  muted: "#8A8A8E"
  border: "rgba(255,255,255,0.10)"
  border-strong: "rgba(255,255,255,0.18)"
typography:
  display:
    fontFamily: "Inter, Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  h1:
    fontFamily: "Inter, Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 4rem
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: "-0.035em"
  h2:
    fontFamily: "Inter, Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 2.25rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.01em"
  small:
    fontFamily: "Inter, Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: 8px
  md: 14px
  lg: 20px
  xl: 24px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.accent-dim}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "rgba(255,255,255,0.06)"
    textColor: "{colors.neutral}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-secondary-hover:
    backgroundColor: "rgba(255,255,255,0.10)"
    borderColor: "rgba(255,255,255,0.20)"
    textColor: "{colors.neutral}"
  card:
    backgroundColor: "{colors.secondary}"
    borderColor: "{colors.border}"
    borderWidth: "1px"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-hover:
    backgroundColor: "{colors.tertiary}"
    borderColor: "{colors.border-strong}"
  eyebrow:
    textColor: "{colors.muted}"
    fontWeight: 600
    letterSpacing: "0.12em"
    fontSize: "0.7rem"
  testimonial-card:
    backgroundColor: "rgba(20,20,23,0.6)"
    borderColor: "{colors.border}"
    borderWidth: "1px"
    rounded: "{rounded.md}"
    padding: "20px"
  star:
    color: "#F5B50A"
    fontSize: "1rem"
  avatar-stack:
    backgroundColor: "{colors.secondary}"
    borderColor: "{colors.border}"
    borderWidth: "1px"
    borderRadius: "{rounded.full}"
    padding: "10px"
---

# Direction Artistique — Qualifyr Agence (Site Vitrine)

## Overview

Refonte complète du site vitrine `qualifyragence.com` vers un **Dark Mode Premium** inspiré de `neverboring.app`. Ton sobre, spatial, high-contrast : fond presque noir, cartes translucides à bordures fines blanches à 10%, accents néon vert doux pour les CTA, typographie Sans-Serif moderne (Inter/Plus Jakarta Sans) sans serif.

## Colors

- **Primary (`#0A0A0C`)** : fond de page. Presque noir, jamais bordeaux ou bleu.
- **Secondary (`#141417`)** : cartes, conteneurs, overlays. Translucide quand il y a une image/surface derrière.
- **Accent (`#12b76a`)** : CTA, boutons principaux, highlights actifs. Vert néon doux, jamais fluorescent.
- **Neutral (`#F5F5F7`)** : texte principal sur fond sombre. Blanc crème, jamais pur #FFFFFF.
- **Muted (`#8A8A8E`)** : texte secondaire, labels, meta. Gris fumé.
- **Border** : `rgba(255,255,255,0.10)` — fines bordures blanches. À 10% de opacité, jamais épaisses ni colorées.

Règle absolue : aucune couleur chaude (copper, brass, terracotta) dans le site vitrine. La palette chaude reste uniquement dans le SaaS (dashboard Pro). Le site vitrine est orthogonal.

## Typography

Tout est **Sans-Serif**. Zéro serif, zéro Georgia, zéro Times.

- **Display / H1** : Inter (chargé via next/font), 700, large et tight. Titres heroes à 4rem+ sur desktop, clampé sur mobile. Letter-spacing négatif (-0.03em à -0.04em) pour le rendu premium.
- **H2** : Inter SemiBold 600, 2rem+, spacing négatif léger.
- **Body** : Inter Regular, 16px de base, 1.6 de line-height pour la lisibilité dans le dark.
- **Uppercase labels / Eyebrows** : Inter SemiBold, 0.7rem, tracking 0.12em — pour les sur-titres en « 01 — Service ».

Règle iOS : tous les champs de formulaire à `font-size: 16px` minimum pour éviter le zoom automatique Safari.

## Layout & Spacing

- Section spacing large : `clamp(5rem, 6vw, 10rem)` entre sections principales.
- Conteneur max `1200px` avec gutter `clamp(1rem, 4vw, 3rem)`.
- Hero : plein écran ou quasi-plein avec overlay subtil (gradient radial sombre vers transparent). Texte centré ou à gauche selon section.
- Grilles : 1 colonne sur mobile, 2 sur tablette, 3 sur desktop pour preuve sociale/services.

## Elevation & Depth

- Zéro ombre portée classique (box-shadow couleur).
- Profondeur par **bordures** + **fond légèrement différent** + **transparence**.
- Glows néon très discrets sur survol CTA (box-shadow 0 0 20px rgba(18,183,106,0.3)).
- Overlay hero : dégradé radial `radial-gradient(ellipse at top, transparent 40%, #0A0A0C 100%)`.

## Shapes

- Coins arrondis generaux : `rounded-xl` (16-20px) pour cartes, `rounded-full` pour avatars.
- Bordures : 1px uniquement, jamais 2px ou 3px. Couleur : `rgba(255,255,255,0.10)`.
- Boutons : coins `rounded-xl`, pas carrés, pas trop arrondis (pas de pill complet sauf sur boutons textuels courts).

## Components

### Bouton Primary (CTA)
Fond vert accent `#12b76a`, texte blanc. Survol : fond plus foncé `#0F9F5C` + légère glow. Coins `rounded-xl`. Padding `14px 28px`, texte 16px SemiBold. Flèche optionnelle.

### Bouton Secondary
Fond translucide `rgba(255,255,255,0.06)`, bordure `rgba(255,255,255,0.10)`. Survol : fond légèrement plus visible. Texte gris clair. Coins `rounded-xl`.

### Card (service / tarif / témoignage)
Fond `#141417`, bordure `1px rgba(255,255,255,0.10)`, coins `rounded-xl` (20px). Padding 24px. Survol légère élévation par changement de fond ou bordure.

### Preuve sociale (état social proof)
Block centré ou latéral avec : avatar stack (5-7 avatars en ligne avec chevauchement), texte "+100 détaillants satisfaits", étoiles 5/5 (jaune `#F5B50A`, taille 1rem). Cartes témoignages avec fond translucide.

### Formulaire (contact)
Champs avec fond `#1A1A1D`, bordure `rgba(255,255,255,0.10)`, texte blanc. Focus : bordure vert accent + glow subtil. Labels en gris clair uppercase petits. Bouton submit = CTA primary.

### Header
Fond transparent sur hero, puis `rgba(10,10,12,0.85)` + backdrop-blur une fois scrollé. Navigation en gris clair. Logo blanc. Bouton CTA dans header.

### Footer
Fond `#0A0A0C` (identique page). Liens en gris. Bordure fine séparatrice. Plus de serif dans les mentions.

## Do's and Don'ts

- **Faire** : utiliser `clamp()` pour tout ce qui est taille d'écran (typo, spacing, gaps).
- **Faire** : prévoir `prefers-reduced-motion` pour les animations.
- **Faire** : tester sur iOS Safari — champs 16px, targets ≥44px, safe-area-inset-bottom sur boutons flottants.
- **Ne pas faire** : jamais de serif, jamais de couleur chaude (copper/brass/terracotta).
- **Ne pas faire** : ne pas utiliser `box-shadow` colorée pour les edges. Bordure + fond suffit.
- **Ne pas faire** : texte blanc pur `#FFFFFF` — utiliser `#F5F5F7` ou `#E8E8EA` pour réduire l'effet de scintillation sur fond noir.
