import Link from 'next/link';

/**
 * Pied de page du site vitrine.
 *
 * **Ce n'est pas un plan du site.** Un pied de page à cinq colonnes de liens
 * sert un catalogue ; ici il n'y a que deux produits. Trois groupes courts
 * suffisent, et le reste de la place va à la dernière relance — c'est le
 * dernier endroit où quelqu'un qui a tout lu peut encore agir.
 *
 * **Aucun réseau social n'est listé.** Des icônes qui pointent vers des comptes
 * vides ou abandonnés font plus de mal que leur absence.
 *
 * ---
 *
 * ## Refonte du 22/08/2026 — dix-huit liens morts
 *
 * Ce composant est rendu sur **sept pages**, et son groupe « Produit » ne
 * contenait que des ancres nues (`#agent-title`, `#demo-title`…). Or une ancre
 * nue ne cible que la page courante : ces sections n'existent que sur
 * l'accueil. Le décompte réel, page par page :
 *
 * | Page | Ancres mortes |
 * |---|---|
 * | `/` | 0 sur 4 |
 * | `/nettoyage-automobile` | 2 sur 4 |
 * | `/tarifs`, `/fonctionnalites`, `/logiciel-laveur-auto`, `/logiciel-detailing-automobile` | 3 sur 4 |
 * | `/faq` | **4 sur 4** |
 *
 * Soit dix-huit liens qui ne faisaient rien, plus le bouton d'appel à
 * l'action — « Commencer gratuitement », qui pointait lui aussi sur
 * `#agent-title` et **ne fonctionnait donc que sur l'accueil**, c'est-à-dire
 * la seule page où le visiteur n'en a pas besoin.
 *
 * **Correctif : `/#ancre` plutôt que `#ancre`.** Le préfixe fait de l'ancre
 * une destination absolue — le navigateur va sur l'accueil, puis à la section.
 * Le type `HomeAnchor` du projet (`/#${string}`) existe précisément pour ça.
 *
 * **Les deux liens de tête pointent désormais vers de vraies pages.** Un lien
 * de pied de page vers une ancre reste un mauvais lien de référencement et un
 * mauvais point d'entrée : `/fonctionnalites` et `/tarifs` sont des pages
 * complètes, indexables et partageables. Les ancres ne servent plus qu'aux
 * deux démonstrations qui n'ont pas de page à elles.
 *
 * **« Agent d'acquisition » devient « Agent de recensement ».** L'agent
 * interroge le répertoire Sirene et envoie un rapport ; il n'acquiert aucun
 * client. Le reste du site a été corrigé le même jour, ce libellé avait été
 * oublié (`docs/11`).
 *
 * **Les CGV entrent au pied de page.** La page n'existait pas quand ce
 * composant a été écrit ; elle existe depuis le 22/08/2026, et des conditions
 * de vente ne sont opposables que si elles sont atteignables avant l'achat,
 * donc depuis toutes les pages.
 *
 * **« Votre compte » devient « Aller plus loin ».** Trois de ses quatre
 * entrées ne concernaient pas un compte — une page métier, un simulateur et
 * un formulaire de contact. Un intitulé qui ne décrit pas ce qu'il regroupe
 * fait chercher au mauvais endroit.
 */

const groups = [
  {
    title: 'Produit',
    links: [
      { href: '/fonctionnalites', label: 'Fonctionnalités' },
      { href: '/tarifs', label: 'Tarifs' },
      // Ces deux-là n'ont pas de page dédiée : l'ancre absolue est la bonne
      // destination, et elle fonctionne depuis n'importe quelle page.
      { href: '/#demo-title', label: 'Tunnel de réservation' },
      { href: '/#agent-title', label: 'Agent de recensement' },
    ],
  },
  {
    title: 'Aller plus loin',
    links: [
      { href: '/app', label: 'Espace professionnel' },
      { href: '/nettoyage-automobile', label: 'Pour les laveurs auto' },
      { href: '/estimation', label: 'Estimation' },
      { href: '/faq', label: 'Questions fréquentes' },
      { href: '/contact', label: 'Nous écrire' },
    ],
  },
  {
    /*
     * Les deux liens d'origine pointaient vers `/confidentialite` et `/cgv`,
     * deux routes inexistantes (404 confirmés). Corrigés une première fois en
     * retirant le lien CGV, faute de page. La page existe désormais, et les
     * trois destinations ci-dessous sont vérifiées.
     */
    title: 'Légal',
    links: [
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/conditions-generales-de-vente', label: 'Conditions de vente' },
      { href: '/politique-de-confidentialite', label: 'Confidentialité' },
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
            lue avant eux, pas trouvée après.

            `/#agent-title` et non `#agent-title` : le bouton ne fonctionnait
            que sur l'accueil, soit la seule page où il ne sert à rien. */}
        <div className="mb-14 flex flex-col items-center gap-5 text-center">
          <h2 className="max-w-[28rem] text-[clamp(1.5rem,3vw,2.1rem)] font-bold leading-[1.15] tracking-[-0.025em] text-primary">
            Votre zone est analysée en une minute.
          </h2>
          <Link
            href="/#agent-title"
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
              Réservation en ligne et recensement de prospects pour les professionnels du nettoyage
              automobile, en France et en Suisse.
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
