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
 * Position de chacune des bulles du nuage décoratif — même disposition à
 * toutes les tailles d'écran (18/08/2026, demande explicite : « le même
 * format que desktop » sur mobile aussi). Une première version affichait un
 * nuage dispersé en pourcentages de la largeur de la section sur desktop,
 * et une simple rangée empilée en flux normal en dessous de 1024px : deux
 * mises en page différentes, exactement ce que le format mobile ne devait
 * pas être. Ici, un seul conteneur `max-w-[26rem]` (donc jamais plus large
 * que la colonne de texte), centré, à toutes les tailles.
 *
 * Revu le 22/08/2026 : les positions ci-dessus se chevauchaient et
 * masquaient du texte (ex. « Un agent démarche pour vous » caché derrière
 * « Un client de plus cette semaine »), signalé directement par Dorian sur
 * capture d'écran, desktop et mobile. Nouvelle disposition en deux colonnes
 * (gauche : index 0/2/4, droite : index 1/3) + trois rangées verticales
 * suffisamment espacées : vérifié à la main qu'à la largeur mobile la plus
 * étroite réaliste (~320px de contenu), la bulle la plus large de chaque
 * colonne laisse au moins ~30px de marge avec l'autre colonne, et que
 * chaque rangée laisse au moins ~0.5rem de marge verticale même si son
 * texte passe sur deux lignes. Le conteneur est passé de 9.75rem à
 * 11.25rem pour loger la troisième rangée.
 */
const heroCloudPositions = [
  { left: 0, top: 0, transform: 'rotate(-5deg)' },
  { right: 0, top: '0.25rem', transform: 'rotate(4deg)' },
  { left: '4%', top: '4rem', transform: 'rotate(-3deg)' },
  { right: '2%', top: '4rem', transform: 'rotate(5deg)' },
  { left: 0, top: '7.5rem', transform: 'rotate(3deg)' },
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
        <div
          aria-hidden="true"
          className="relative mx-auto mb-6 w-full max-w-[26rem] overflow-visible"
          style={{ height: '11.25rem' }}
        >
          {messages.map((text, index) => (
            <MessageBubble
              key={text}
              text={text}
              /* Le rang déclenche l'arrivée « impact » et l'échelonne : les
                 bulles se posent l'une après l'autre, comme des messages qui
                 arrivent. Toutes ensemble, elles se liraient comme un bloc. */
              order={index}
              compact={index === 1 || index === 2 || index === 3}
              style={{
                ...heroCloudPositions[index % heroCloudPositions.length],
                zIndex: index === 0 || index === 4 ? 2 : 1,
              }}
            />
          ))}
        </div>
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

        {/* Configuration du 18/08/2026 (demande explicite) : taille, graisse,
            crénage et interligne en `style`, pas en classes Tailwind — même
            précaution que partout ailleurs dans ce projet face aux
            `!important` de la charte historique (voir `globals.css`, section
            3, désormais scopée mais par prudence). `750` n'est atteignable
            que parce que `fonts.ts` charge Manrope en graisse variable (pas
            de `weight` fixe) : un poids intermédiaire entre 700 et 800
            n'existe dans aucun fichier statique. */}
        <h1
          className="mb-6 text-primary"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 750,
            letterSpacing: '-0.055em',
            lineHeight: 0.94,
          }}
        >
          {title}
          {highlight ? (
            <>
              {' '}
              <span className="text-faint">{highlight}</span>
            </>
          ) : null}
        </h1>

        <p
          className="mb-9 max-w-[34rem] text-[1.0625rem] text-muted"
          style={{ fontWeight: 400, lineHeight: 1.6, letterSpacing: '-0.01em' }}
        >
          {subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ctaHref}
            data-analytics-event="cta_hero_clicked"
            data-cta-id={ctaLabel}
            className="cta-solid group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-white/90"
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
              data-analytics-event="cta_secondary_clicked"
              data-cta-id={secondaryLabel}
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
