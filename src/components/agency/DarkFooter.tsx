import Link from 'next/link';

import { Logo } from '@/components/ui/Logo';
import { agents } from '@/content/agents';
import { contact } from '@/content/contact';

/**
 * Pied de page du site vitrine.
 *
 * ## Refonte du 22/08/2026 — le pied de page n'avait pas d'identité
 *
 * **Le vrai logo n'y était pas.** Ni ici, ni dans l'en-tête sombre : les deux
 * écrivaient « Qualifyr » en gras. Le lockup officiel
 * (`/images/brand/qualifyr-lockup.png`) existait pourtant, décliné en masque
 * monochrome par `components/ui/Logo` — mais ce composant n'était utilisé que
 * par l'en-tête et le pied de page **clairs**, ceux que `[data-legacy-chrome]`
 * masque sur toutes les pages sombres. Autrement dit : le logo de la marque
 * n'était affiché nulle part sur le site réellement visible.
 *
 * Le masque monochrome est la bonne façon de l'employer ici. Le fichier
 * d'origine est un mot-symbole en volume, blanc glacé ; posé tel quel sur le
 * fond de la charte, il ramènerait un rendu brillant qui jure avec le reste.
 * Réduit à sa silhouette et recoloré en `currentColor`, il garde sa forme et
 * prend la couleur du contexte.
 *
 * **Quatre groupes plutôt que trois.** « Aller plus loin » regroupait cinq
 * entrées sans rapport entre elles — un espace client, une page métier, un
 * simulateur, une FAQ et un formulaire. Un intitulé qui ne décrit pas ce qu'il
 * contient fait chercher au mauvais endroit. Les mêmes liens se répartissent
 * maintenant entre « Entreprise » (qui nous sommes, comment nous joindre) et
 * « Ressources » (ce qu'on peut lire ou essayer seul).
 *
 * **Aucun lien n'a été inventé ni supprimé.** Les douze destinations d'avant
 * sont toutes présentes, redistribuées entre les quatre groupes. Trois pages
 * existantes (`/a-propos`, `/methode`, `/blog`) avaient été ajoutées puis
 * retirées le soir même : un pied de page n'est pas un plan du site, il liste
 * ce qu'on veut mettre en avant. S'ajoutent seulement les deux comptes
 * sociaux, qui viennent de `content/contact.ts` — donc confirmés, pas devinés.
 *
 * **La ligne d'agents en bas n'est pas un ornement.** Trois points colorés
 * suffisent à rappeler que le produit est fait de trois briques distinctes,
 * ce qui est l'idée que le reste de la page défend. C'est aussi le seul
 * endroit du pied de page qui porte de la couleur : le brief de la charte
 * demande de la personnalité, pas un aplat.
 *
 * ---
 *
 * ## Correctif du 22/08/2026 (matin) — dix-huit liens morts
 *
 * Ce composant est rendu sur sept pages, et son groupe « Produit » ne
 * contenait que des ancres nues (`#agent-title`, `#demo-title`…). Une ancre
 * nue ne cible que la page courante : ces sections n'existent que sur
 * l'accueil, donc dix-huit liens ne faisaient rien — dont l'appel à l'action
 * principal, qui ne fonctionnait que sur la seule page où il est inutile.
 *
 * Le préfixe `/#ancre` fait de l'ancre une destination absolue. Il est
 * conservé, et `tests/footer-links.test.ts` empêche la régression.
 *
 * ---
 *
 * ## Relance retirée — 20 septembre 2026
 *
 * Une relance a vécu ici une journée : titre, phrase, bouton et capture du tableau de bord,
 * au-dessus des colonnes de liens. Elle a été retirée le soir même, en même temps qu'elle était
 * fusionnée dans `FinalCtaSection` (voir l'en-tête de ce composant pour le raisonnement).
 *
 * **Ce n'est pas seulement un déplacement.** Sur l'accueil, la relance doublonnait avec
 * `FinalCtaSection` juste au-dessus ; sur les six autres pages qui rendent ce pied de page, elle
 * doublonnait avec leur propre `CtaSection` (`DarkVerticalPage`), qui ferme déjà chacune d'elles.
 * Le pied de page redevient donc ce qu'il doit être : de la navigation, une signature et les
 * mentions légales — pas un troisième appel à l'action que personne ne lit.
 *
 * L'historique du visuel produit (capture recadrée, anonymisée, deux fois refaite) est conservé
 * dans `docs/03-direction-artistique.md` §12.1 et dans `FinalCtaSection.tsx`, qui l'affiche
 * désormais.
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
    /* `/a-propos` et `/methode` avaient été ajoutés ici le 22/08/2026 puis
       retirés le soir même à la demande de Dorian : le pied de page ne liste
       que les destinations qu'il veut mettre en avant, pas tout ce qui
       existe. Les deux pages restent en ligne et atteignables ailleurs. */
    title: 'Entreprise',
    links: [
      { href: '/nettoyage-automobile', label: 'Pour les laveurs auto' },
      { href: '/contact', label: 'Nous écrire' },
    ],
  },
  {
    /* `/blog` retiré pour la même raison, le même jour. */
    title: 'Ressources',
    links: [
      { href: '/faq', label: 'Questions fréquentes' },
      { href: '/estimation', label: 'Estimation' },
      { href: '/app', label: 'Espace professionnel' },
    ],
  },
  {
    /*
     * Les deux liens d'origine pointaient vers `/confidentialite` et `/cgv`,
     * deux routes inexistantes (404 confirmés). Les trois destinations
     * ci-dessous sont vérifiées, et les conditions de vente doivent rester
     * atteignables depuis toutes les pages pour être opposables.
     */
    title: 'Légal',
    links: [
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/conditions-generales-de-vente', label: 'Conditions de vente' },
      { href: '/politique-de-confidentialite', label: 'Confidentialité' },
    ],
  },
] as const;

/** Marchés où le produit est effectivement proposé. */
const markets = ['France', 'Belgique', 'Suisse', 'Luxembourg'] as const;

export function DarkFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-theme="dark"
      className="flex w-full justify-center border-t border-hairline bg-ink"
    >
      <div className="w-full max-w-7xl px-4 pb-12 pt-20 md:px-8 md:pt-24">
        {/* Première zone : signature de marque à gauche, navigation à droite.
            La colonne de marque est plus large que les autres (`1.4fr`) —
            elle porte le logo et une phrase, pas une liste.

            Plus de filet ni d'espacement en haut depuis le retrait de la
            relance : le `<footer>` porte déjà sa propre bordure haute, et deux
            filets à quelques pixels l'un de l'autre se voyaient comme un
            défaut. */}
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))] lg:gap-8">
          <div className="max-w-[22rem]">
            {/* Le logo officiel, en masque monochrome recoloré par
                `currentColor` — voir l'en-tête du fichier. Le lien vers
                l'accueil en fait aussi un point de sortie, ce qu'un pied de
                page doit toujours offrir. */}
            <Link
              href="/"
              aria-label="Qualifyr — retour à l’accueil"
              className="mb-5 inline-block text-primary no-underline opacity-90 transition-opacity duration-150 hover:opacity-100"
            >
              <Logo onDark />
            </Link>

            <p className="text-[0.875rem] leading-[1.65] text-muted">
              Le système qui aide les laveurs auto à trouver, qualifier et convertir leurs
              demandes.
            </p>

            {/* Les trois agents, réduits à leur plus simple expression : un
                point de leur couleur et leur nom court. C'est le seul endroit
                coloré du pied de page, et il sert à rappeler la structure du
                produit — pas à égayer. */}
            <ul className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
              {agents.map((agent) => (
                <li
                  key={agent.id}
                  className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.06em] text-faint"
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: `var(${agent.token})` }}
                  />
                  {agent.shortLabel}
                </li>
              ))}
            </ul>
          </div>

          {/* `prefetch={false}` sur les douze liens ci-dessous (18/09/2026,
              même correctif que `DarkHeader` : voir son commentaire). Ce
              pied de page est rendu sur sept pages ; dès qu'un visiteur
              défile jusqu'ici, Next.js précharge en arrière-plan les douze
              pages de destination d'un coup, alors qu'un seul clic suit en
              général. */}
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-faint">
                {group.title}
              </p>
              <ul className="grid gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={false}
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

        {/* Seconde zone. Trois informations à gauche, séparées par des points
            médians plutôt que par des barres : à cette taille de texte, une
            barre verticale se confond avec un `l` ou un `1`. */}
        <div className="mt-16 flex flex-col gap-4 border-t border-hairline pt-8 text-[0.8125rem] text-faint sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span>© {year} Qualifyr</span>
            <span aria-hidden="true" className="text-white/20">
              ·
            </span>
            <span>Prix hors taxes</span>
            <span aria-hidden="true" className="text-white/20">
              ·
            </span>
            <span>{markets.join(', ')}</span>
          </div>

          {/* Les comptes viennent de `content/contact.ts`, où ils sont
              confirmés — on n'invente pas un réseau social, et un lien vers un
              compte inexistant coûte plus cher que son absence. */}
          <ul className="flex items-center gap-5">
            {contact.social.map((account) => (
              <li key={account.href}>
                <a
                  href={account.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8125rem] !text-faint no-underline transition-colors duration-150 hover:!text-primary"
                >
                  {account.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
