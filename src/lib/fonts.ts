import { Instrument_Sans, Manrope } from 'next/font/google';

/**
 * Typographie du site.
 *
 * **Instrument Sans pour les titres.** Manrope les portait jusqu'ici : ses
 * formes rondes et son crénage large fonctionnent en petit corps, mais à
 * 3 rem elles donnent des titres mous, qui s'étalent au lieu de tenir. Une
 * grotesque plus étroite se resserre en gros corps, ce qui est exactement ce
 * qu'on attend d'un titre de section.
 *
 * **Cormorant Garamond a disparu.** C'était la serif éditoriale de l'ancienne
 * charte, celle qui donnait l'air « agence de papa ». Elle n'était plus
 * appelée nulle part dans la nouvelle direction artistique, mais restait
 * chargée à chaque visite : quelques dizaines de kilo-octets pour rien, et
 * surtout une porte ouverte à sa réapparition par héritage.
 *
 * **Manrope reste pour le texte courant.** Ce qui la dessert en gros corps la
 * sert en petit : ses contreformes ouvertes tiennent mieux la lecture à
 * 15 px, notamment sur un écran de téléphone en plein soleil — la situation
 * réelle du professionnel qui consulte son espace entre deux véhicules.
 *
 * Deux familles, pas trois. Chaque famille supplémentaire est une requête
 * bloquante de plus avant le premier affichage du texte.
 */

export const displayFont = Instrument_Sans({
  subsets: ['latin'],
  // 600 et 700 seulement : les titres n'utilisent rien d'autre, et chaque
  // graisse chargée est un fichier de plus sur une connexion mobile.
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const bodyFont = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const fontClassName = `${displayFont.variable} ${bodyFont.variable}`;
