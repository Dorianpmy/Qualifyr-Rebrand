import Link from 'next/link';

/**
 * Pied de page du site vitrine.
 *
 * **Ce n'est pas un plan du site.** Un pied de page à cinq colonnes de liens
 * sert un catalogue ; ici il n'y a que deux produits. Trois groupes courts
 * suffisent, et le reste de la place va à la dernière relance — c'est le
 * dernier endroit où quelqu'un qui a tout lu peut encore agir.
 *
 * **Les mentions légales ne sont pas facultatives.** Un professionnel qui
 * encaisse des acomptes via le service voudra vérifier à qui il confie l'argent
 * de ses clients ; l'absence de mentions est, à cet endroit précis, un signal
 * de défiance plus fort que n'importe quel argument de la page.
 *
 * **Aucun réseau social n'est listé.** Des icônes qui pointent vers des comptes
 * vides ou abandonnés font plus de mal que leur absence.
 */

const groups = [
  {
    title: 'Produit',
    links: [
      { href: '#demo-title', label: 'Tunnel de réservation' },
      { href: '#agent-title', label: 'Agent d’acquisition' },
      { href: '#pricing-title', label: 'Tarifs' },
      { href: '#before-after-title', label: 'Ce qui change' },
    ],
  },
  {
    title: 'Votre compte',
    links: [
      { href: '/app', label: 'Espace professionnel' },
      { href: '/nettoyage-automobile', label: 'Pour les laveurs auto' },
      { href: '/estimation', label: 'Estimation' },
      { href: '/contact', label: 'Nous écrire' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/confidentialite', label: 'Confidentialité' },
      { href: '/cgv', label: 'Conditions de vente' },
    ],
  },
] as const;

export function DarkFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-theme="dark"
      className="flex w-full justify-center border-t border-hairline bg-ink"
    >
      <div className="w-full max-w-7xl px-4 py-16 md:px-8">
        {/* La relance occupe la largeur, au-dessus des liens : elle doit être
            lue avant eux, pas trouvée après. */}
        <div className="mb-14 flex flex-col items-center gap-5 text-center">
          <h2 className="max-w-[28rem] text-[clamp(1.5rem,3vw,2.1rem)] font-bold leading-[1.15] tracking-[-0.025em] text-primary">
            Votre zone est analysée en une minute.
          </h2>
          <Link
            href="#agent-title"
            className="cta-solid accent-glow inline-flex min-h-[48px] items-center rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-white/90"
          >
            Commencer gratuitement
          </Link>
        </div>

        <div className="grid gap-10 border-t border-hairline pt-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="mb-2.5 text-[1.0625rem] font-bold tracking-[-0.02em] text-primary">
              Qualifyr
            </p>
            <p className="max-w-[24rem] text-[0.875rem] leading-[1.6] text-muted">
              Réservation en ligne et acquisition pour les professionnels du nettoyage automobile,
              en France et en Suisse.
            </p>
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="mb-3.5 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-faint">
                {group.title}
              </p>
              <ul className="grid gap-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.875rem] !text-muted no-underline transition-colors duration-150 hover:!text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-hairline pt-7 text-[0.8125rem] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Qualifyr. Tous droits réservés.</p>
          <p>Prix hors taxes. Abonnements mensuels, sans engagement.</p>
        </div>
      </div>
    </footer>
  );
}
