import Link from 'next/link';
import { MessageBubble } from './MessageBubble';
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
  /**
   * Bulles de messages bleues décoratives (demande explicite du 17/08/2026),
   * réservées à la page d'accueil : `DarkHero` est aussi utilisé par
   * `/nettoyage-automobile`, `/logiciel-laveur-auto` et
   * `/logiciel-detailing-automobile`, où ce nuage n'a pas été demandé — ne
   * s'affiche donc que si on le passe explicitement en prop, jamais par
   * défaut.
   */
  readonly messages?: readonly string[];
};

/**
 * Position de chacune des bulles du nuage décoratif, en pourcentage de la
 * largeur/hauteur de la section (le nuage occupe `inset-0` sur la `<section>`
 * elle-même, pas sur la colonne de texte étroite) — pensées pour rester dans
 * le vide de part et d'autre de la colonne centrale de 44rem sur un écran
 * large. Recyclées par index si `messages` contient plus ou moins de cinq
 * entrées.
 */
const heroCloudPositions = [
  { left: '-1%', top: '4%', transform: 'rotate(-6deg)' },
  { right: '-2%', top: '14%', transform: 'rotate(5deg)' },
  { left: '1%', top: '52%', transform: 'rotate(4deg)' },
  { right: '0%', top: '64%', transform: 'rotate(-5deg)' },
  { left: '36%', bottom: '-1%', transform: 'rotate(3deg)' },
] as const;

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
  messages,
}: DarkHeroProps) {
  return (
    <Section glow="top" glowIntensity="soft" className="pb-20 pt-24 sm:pt-32">
      {messages && messages.length > 0 ? (
        <>
          {/* Nuage dispersé, desktop uniquement (`lg:` = 1024px). En dessous,
              la colonne de texte (44rem) occupe déjà presque toute la
              largeur disponible : un nuage positionné en pourcentage de la
              section entière chevaucherait le texte plutôt que de flotter
              dans le vide à côté. `absolute inset-0` sur la `<section>`
              (positionnée) elle-même, placé AVANT le contenu dans le DOM :
              peint derrière lui sans z-index positif à gérer, le même
              principe que `AmbientGlow` juste en dessous dans la pile. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
            {messages.map((text, index) => (
              <MessageBubble
                key={text}
                text={text}
                compact={index % 2 === 1}
                style={{ ...heroCloudPositions[index % heroCloudPositions.length] }}
              />
            ))}
          </div>

          {/* Rangée compacte, en flux normal : de 320px à 1024px (mobile et
              tablette, y compris le portrait 768px explicitement demandé
              dans les tests). `flex-wrap` ne peut pas déborder de l'écran,
              contrairement à des positions en pourcentage sur une colonne
              étroite. */}
          <div
            aria-hidden="true"
            className="mx-auto mb-7 flex w-full max-w-[26rem] flex-wrap items-center justify-center gap-2 lg:hidden"
          >
            {messages.map((text) => (
              <MessageBubble key={text} text={text} compact position="static" />
            ))}
          </div>
        </>
      ) : null}

      {/* 44 rem : la colonne de lecture. Au-delà, le titre cesse d'être un
          objet et devient un bandeau. Elle vit à l'intérieur du conteneur
          commun, qui gère la largeur de page et le centrage. */}
      <div className="relative mx-auto flex max-w-[44rem] flex-col items-center text-center">
        {/* Bordure en dégradé : le badge est le seul endroit de la page où la
            couleur apparaît en tant que telle.

            Le texte, lui, n'est plus en dégradé. `accent-text` s'appuie sur
            `background-clip: text` avec un repli `color: var(--accent-1)` —
            et ce repli, le sable, se lit orange sur un écran réel (déjà
            documenté ailleurs dans ce fichier de style). Quand le
            clip-to-text ne s'applique pas — le même genre de perte
            silencieuse que d'autres classes dans ce projet — c'est ce repli
            qui reste affiché, orange en plein hero. Un gris neutre, comme
            tous les autres sur-titres du site, ne laisse plus cette
            possibilité. */}
        <p className="accent-ring mb-7 inline-flex items-center gap-2 rounded-full py-1.5 pl-2.5 pr-3.5 text-[0.8125rem] font-medium">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full"
            style={{ background: 'linear-gradient(100deg, var(--accent-1), var(--accent-2))' }}
          />
          <span className="text-faint">{eyebrow}</span>
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
