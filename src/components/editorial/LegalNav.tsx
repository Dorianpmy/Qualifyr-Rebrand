import Link from 'next/link';
import { Section } from '@/components/agency/Section';

/**
 * Navigation secondaire entre les trois documents légaux.
 *
 * **Ils se lisent rarement seuls.** Quelqu'un qui vérifie les conditions de
 * vente veut souvent enchaîner sur la politique de confidentialité, ou
 * remonter à l'identité de l'éditeur. Sans ce relais, il doit redescendre au
 * pied de page à chaque fois.
 *
 * **La page courante reste affichée, mais inerte.** La retirer ferait bouger
 * la rangée d'un document à l'autre, ce qui donne l'impression de trois
 * navigations différentes. Elle est marquée `aria-current` et n'est pas un
 * lien : rien n'invite à cliquer sur l'endroit où l'on est déjà.
 */

const DOCUMENTS = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/conditions-generales-de-vente', label: 'Conditions de vente' },
  { href: '/politique-de-confidentialite', label: 'Confidentialité' },
] as const;

export function LegalNav({ current }: { readonly current: string }) {
  return (
    <Section className="border-t border-hairline py-10">
      <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-faint">
        Autres documents
      </p>

      <nav aria-label="Documents légaux">
        <ul className="flex flex-wrap gap-2.5">
          {DOCUMENTS.map((document) => {
            const active = document.href === current;

            return (
              <li key={document.href}>
                {active ? (
                  <span
                    aria-current="page"
                    className="inline-flex min-h-[40px] items-center rounded-full border border-hairline px-4 text-[0.8125rem] text-faint"
                  >
                    {document.label}
                  </span>
                ) : (
                  <Link
                    href={document.href}
                    className="inline-flex min-h-[40px] items-center rounded-full border border-hairline px-4 text-[0.8125rem] !text-muted no-underline transition-colors duration-150 hover:!text-primary hover:bg-white/[0.03]"
                  >
                    {document.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </Section>
  );
}
