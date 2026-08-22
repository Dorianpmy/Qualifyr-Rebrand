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
  scope,
}: {
  readonly children: ReactNode;
  /** Libellé de la page courante. Le lien « Accueil » est ajouté devant. */
  readonly breadcrumb?: string;
  /**
   * Classe de portée de la page.
   *
   * Elle ne sert pas à styler la coque : elle **conditionne** les règles de
   * `tailwind.css` qui habillent les formulaires hérités. Un sélecteur qui
   * exigerait seulement `.qualifyr-form` finirait un jour appliqué ailleurs
   * par simple réutilisation du nom ; en exigeant aussi la page, l'effet de
   * bord devient impossible.
   */
  readonly scope?: 'legal-page' | 'estimation-page' | 'contact-page';
}) {
  return (
    <>
      <DarkHeader />

      {/* `data-theme="dark"` est posé sur ce conteneur **et non sur `body`
          ou `html`** : sa portée s'arrête au corps de la page. Les autres
          pages du site, qui ne le portent pas, gardent leurs propres jetons.
          `DarkHeader` le pose déjà pour lui-même ; le répéter ici protège les
          sections si l'en-tête venait à changer. */}
      <div data-theme="dark" className={`bg-ink ${scope ?? ''}`.trim()}>
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
