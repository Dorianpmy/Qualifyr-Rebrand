import Link from 'next/link';
import { Section } from './Section';
import { SocialProof, type SocialProofProps } from './SocialProof';
import { TrustStrip } from './TrustStrip';

/**
 * Hero du site vitrine.
 *
 * **Centré et resserré.** Une première version alignait le titre à gauche sur
 * toute la largeur : à 72 rem et 4,5 rem de corps, la ligne devenait un mur.
 * La référence tient son hero dans une colonne étroite au centre, ce qui laisse
 * du noir de chaque côté — c'est ce vide qui produit l'impression d'épure, pas
 * la taille du texte.
 *
 * **Une seule action possible.** Un hero à deux boutons de poids égal ne
 * convertit pas deux fois mieux : il fait hésiter. Le bouton blanc plein est le
 * seul élément blanc plein de l'écran, et le lien secondaire est volontairement
 * sous-traité — une sortie pour ceux qui ne sont pas prêts, pas une seconde
 * proposition.
 *
 * **Les couleurs sont écrites explicitement.** La charte historique impose un
 * laiton doré aux titres via des sélecteurs `!important` très larges. Tant
 * qu'elle est en place, tout titre qui ne déclare pas sa couleur ressort doré.
 *
 * **La couleur n'apparaît qu'à deux endroits.** Le badge, et le halo derrière
 * le bouton. Partout ailleurs la page reste en gris : c'est ce qui fait que
 * ces deux points-là se remarquent. Une troisième zone colorée et l'effet
 * disparaît.
 */

export type DarkHeroProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly highlight?: string;
  readonly subtitle: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
  readonly secondaryLabel?: string;
  readonly secondaryHref?: string;
  readonly ctaNote?: string;
  readonly proof?: SocialProofProps;
  /**
   * Affiche le bandeau de réassurance à la place de la preuve sociale.
   * Les deux occupent la même place et ne cohabitent pas : deux blocs de
   * réassurance empilés se neutralisent.
   */
  readonly trust?: boolean;
};

export function DarkHero({
  eyebrow,
  title,
  highlight,
  subtitle,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  ctaNote,
  proof,
  trust,
}: DarkHeroProps) {
  return (
    <Section glow="top" glowIntensity="soft" className="pb-20 pt-24 sm:pt-32">
      {/* 44 rem : la colonne de lecture. Au-delà, le titre cesse d'être un
          objet et devient un bandeau. Elle vit à l'intérieur du conteneur
          commun, qui gère la largeur de page et le centrage. */}
      <div className="mx-auto flex max-w-[44rem] flex-col items-center text-center">
        {/* Bordure et texte en dégradé : le badge est le seul endroit de la
            page où la couleur apparaît en tant que telle. */}
        <p className="accent-ring mb-7 inline-flex items-center gap-2 rounded-full py-1.5 pl-2.5 pr-3.5 text-[0.8125rem] font-medium">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full"
            style={{ background: 'linear-gradient(100deg, var(--accent-1), var(--accent-2))' }}
          />
          <span className="accent-text">{eyebrow}</span>
        </p>

        {/* Corps plafonné à 3,5 rem, pas 4,5. La référence compose son titre
            plus petit que la plupart des pages SaaS — c'est ce qui lui donne
            l'air calme plutôt qu'insistant. */}
        <h1 className="mb-6 text-[clamp(2.1rem,5vw,3.4rem)] font-bold leading-[1.08] tracking-[-0.03em] text-primary">
          {title}
          {highlight ? (
            <>
              {' '}
              <span className="text-faint">{highlight}</span>
            </>
          ) : null}
        </h1>

        <p className="mb-9 max-w-[34rem] text-[1.0625rem] leading-[1.65] text-muted">{subtitle}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ctaHref}
            className="cta-solid accent-glow group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-white/90"
          >
            {ctaLabel}
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            >
              <path
                d="M4 10h11M11 5.5L15.5 10 11 14.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {secondaryLabel && secondaryHref ? (
            <Link
              href={secondaryHref}
              className="inline-flex min-h-[48px] items-center surface-pill px-6 text-[0.9375rem] font-medium !text-muted no-underline transition-colors duration-150 hover:!text-white"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>

        {ctaNote ? <p className="mt-4 text-[0.8125rem] text-faint">{ctaNote}</p> : null}

        {/* Pas de filet séparateur : dans la référence la preuve flotte, elle
            n'est pas posée dans un cadre. */}
        {proof ? (
          <div className="mt-14">
            <SocialProof {...proof} />
          </div>
        ) : trust ? (
          <div className="mt-14 w-full border-t border-hairline pt-10">
            <TrustStrip />
          </div>
        ) : null}
      </div>
    </Section>
  );
}
