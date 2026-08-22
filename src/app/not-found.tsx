import type { Metadata } from 'next';
import Link from 'next/link';

import { DarkPageShell } from '@/components/editorial/DarkPageShell';
import { EditorialHeader } from '@/components/editorial/EditorialHeader';
import { Section } from '@/components/agency/Section';

/**
 * Page 404 — refonte à la charte sombre (22/08/2026).
 *
 * **Elle appartenait encore à l'ancienne identité**, comme les cinq pages
 * refondues plus tôt : `Section`/`Container` de `components/layout`, aucun
 * `data-theme="dark"`, donc en-tête et pied de page clairs conservés — voir
 * `DarkPageShell` pour le mécanisme exact. Un visiteur qui se trompait
 * d'adresse changeait de site en cours de route, ce qui se lit comme une
 * panne plutôt que comme une erreur de lien.
 *
 * **Trois sorties plutôt qu'un bouton d'appel à l'action.** L'ancienne version
 * proposait l'accueil et le CTA commercial. Or on n'arrive pas ici en cherchant
 * à acheter : on y arrive en cherchant quelque chose de précis qu'on n'a pas
 * trouvé. Les trois destinations couvrent les trois intentions réelles —
 * comprendre le produit, réserver chez un professionnel, entrer dans son
 * espace — et laissent le visiteur choisir au lieu de le pousser.
 */
export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: false },
};

const exits = [
  {
    href: '/',
    title: 'L’accueil',
    detail: 'Ce que fait Qualifyr, en une page.',
  },
  {
    href: '/fonctionnalites',
    title: 'Les fonctionnalités',
    detail: 'Le détail de ce que le produit prend en charge.',
  },
  {
    href: '/contact',
    title: 'Nous écrire',
    detail: 'Si vous cherchiez quelque chose de précis, dites-le nous.',
  },
] as const;

export default function NotFound() {
  return (
    <DarkPageShell breadcrumb="Page introuvable">
      <EditorialHeader
        eyebrow="Erreur 404"
        title="Cette page n’existe pas."
        lead="Le lien est peut-être incomplet, ou la page a changé d’adresse. Rien n’est cassé de votre côté."
      />

      <Section className="pb-24">
        <ul className="grid max-w-[46rem] gap-3 sm:grid-cols-3">
          {exits.map((exit) => (
            <li key={exit.href}>
              <Link
                href={exit.href}
                className="block h-full rounded-2xl border border-hairline p-5 no-underline transition-colors duration-150 hover:border-hairline-strong"
              >
                <span className="mb-1.5 block text-[0.9375rem] font-semibold !text-primary">
                  {exit.title}
                </span>
                <span className="block text-[0.8125rem] leading-[1.5] text-faint">
                  {exit.detail}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </DarkPageShell>
  );
}
