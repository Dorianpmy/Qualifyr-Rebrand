import type { ReactNode } from 'react';
import { Section } from '@/components/agency/Section';

/**
 * En-tête éditorial des pages de texte.
 *
 * **La largeur est bornée à 34rem, et c'est le point important.** Une page
 * légale est faite pour être lue de bout en bout ; du texte courant sur toute
 * la largeur d'un écran de bureau fait perdre la ligne à chaque retour, ce qui
 * est précisément le défaut des cinq pages qu'on remplace. Trente-quatre rem
 * correspondent à environ soixante-dix caractères, la mesure de confort
 * habituelle en typographie.
 *
 * **La date de mise à jour est affichée, pas cachée en bas de page.** Sur des
 * conditions de vente ou une politique de confidentialité, c'est une
 * information contractuelle : le lecteur doit pouvoir vérifier d'un coup d'œil
 * quelle version il consulte.
 *
 * **Le halo est réservé à cette section.** La charte limite les halos à trois
 * par page ; ici il n'y en a qu'un, en haut, pour marquer l'entrée — le reste
 * de la page reste plat, comme le veut la lecture.
 */
export function EditorialHeader({
  eyebrow,
  title,
  lead,
  updatedAt,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead?: string;
  /** Date lisible, ex. « 22 août 2026 ». Affichée telle quelle. */
  readonly updatedAt?: string;
  /** Contenu additionnel sous le chapô — un bandeau d'engagements, par exemple. */
  readonly children?: ReactNode;
}) {
  return (
    <Section className="pb-14 pt-10 sm:pt-14" glow="top" glowIntensity="soft">
      <div className="max-w-[46rem]">
        <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-faint">
          {eyebrow}
        </p>

        <h1 className="mb-5 text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.06] tracking-[-0.03em] text-primary">
          {title}
        </h1>

        {lead ? (
          <p className="max-w-[34rem] text-[1.0625rem] leading-[1.7] text-muted">{lead}</p>
        ) : null}

        {updatedAt ? (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-hairline px-3.5 py-1.5 text-[0.75rem] text-faint">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full"
              style={{ background: 'rgba(255, 255, 255, 0.45)' }}
            />
            Dernière mise à jour : {updatedAt}
          </p>
        ) : null}

        {children}
      </div>
    </Section>
  );
}
