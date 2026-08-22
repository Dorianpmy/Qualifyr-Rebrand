import Link from 'next/link';
import type { ReactNode } from 'react';
import { DarkFooter } from '@/components/agency/DarkFooter';
import { DarkHeader } from '@/components/agency/DarkHeader';

/**
 * Coque des pages éditoriales à la charte sombre.
 *
 * **Ce composant fait plus que ranger trois éléments.** C'est lui qui fait
 * basculer une page dans la charte, et le mécanisme mérite d'être connu :
 * `layout.tsx` rend un en-tête et un pied de page **clairs**, hérités de
 * l'ancienne identité, enveloppés dans `[data-legacy-chrome]`. Une règle de
 * `tailwind.css` les masque dès qu'une page contient `[data-theme='dark']`.
 *
 * Une page qui ne pose pas cet attribut garde donc l'habillage clair — c'est
 * exactement ce qui distinguait les cinq dernières pages du reste du site.
 * Elles n'étaient pas « mal stylées » : elles appartenaient encore à l'ancien
 * système. `DarkHeader` porte cet attribut, ce qui suffit à déclencher le
 * masquage ; ce composant garantit qu'aucune page ne l'oublie.
 *
 * **Le fil d'Ariane est discret par choix.** Sur une page légale, il sert à se
 * repérer et à revenir, pas à décorer. Il reste donc en petites capitales
 * espacées, dans la couleur la plus effacée de la charte, et ne s'affiche que
 * s'il a quelque chose à dire.
 */
export function DarkPageShell({
  children,
  breadcrumb,
}: {
  readonly children: ReactNode;
  /** Libellé de la page courante. Le lien « Accueil » est ajouté devant. */
  readonly breadcrumb?: string;
}) {
  return (
    <>
      <DarkHeader />

      {/* `data-theme="dark"` est déjà posé par `DarkHeader`, mais le répéter
          ici protège le corps de la page : si l'en-tête venait à changer, les
          sections garderaient leurs jetons sombres au lieu de retomber sur la
          palette claire. */}
      <div data-theme="dark" className="bg-ink">
        {breadcrumb ? (
          <nav
            aria-label="Fil d’ariane"
            className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 pt-8 text-[0.75rem] uppercase tracking-[0.08em] text-faint md:px-8"
          >
            <Link
              href="/"
              className="!text-faint no-underline transition-colors duration-150 hover:!text-muted"
            >
              Accueil
            </Link>
            <span aria-hidden="true">·</span>
            <span className="text-muted">{breadcrumb}</span>
          </nav>
        ) : null}

        {children}
      </div>

      <DarkFooter />
    </>
  );
}
