import Image from 'next/image';
import Link from 'next/link';

import { AmbientGlow } from './AmbientGlow';
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
 * ## Visuel produit dans la relance — 20 septembre 2026
 *
 * La relance n'était qu'un titre centré et un bouton : rien ne montrait ce que le visiteur
 * obtient. Dorian fournit une capture réelle de l'espace pro (page Demandes) et demande une
 * composition à deux temps, texte d'un côté, capture de l'autre — voir
 * `docs/03-direction-artistique.md` §12.1 pour la justification de l'exception (la direction
 * artistique écarte les « captures d'interface », mais seulement sous leur forme flottante
 * avec ombre et reflet ; posée à plat, sans élévation, cette capture reste conforme).
 *
 * Recadrage effectué avant intégration : ligne `Pipeline réservations ·
 * /reservation/sw-carcleaning` (identifiant du compte client) retirée, ainsi que le nom et la
 * ville de l'entreprise dans la barre latérale (« SW Carcleaning », « Fribourg »). Les compteurs
 * affichés sont ceux, réels, du compte au moment de la capture — aucun chiffre n'a été modifié
 * ni ajouté.
 *
 * ## Retour de Dorian le 20/09 (même jour) — capture de bureau plutôt que mobile
 *
 * La première capture était une capture de téléphone (portrait), posée dans un cadre étroit
 * façon écran de mobile — Dorian n'aime pas ce rendu (« je déteste ce bloc, enlève ce screen
 * iPhone ») : à côté d'une page pensée pour du bureau, un portrait de téléphone lit comme un
 * corps étranger plutôt que comme la continuité de la page. Remplacée par une capture de la
 * même page (Demandes) prise sur bureau — sidebar, KPI et calendrier dans leur mise en page
 * réelle, au format paysage natif du reste du site. Même retrait des informations du compte
 * (nom, ville, identifiant d'URL), aucun chiffre modifié. Fichier :
 * `public/images/app-preview/espace-pro-demandes-desktop.webp` ; l'ancienne capture mobile
 * (`espace-pro-demandes.webp`) est supprimée, plus aucune référence n'y pointe.
 *
 * ## Halo d'ambiance en option — 20/09 (troisième retour)
 *
 * Dorian compare une capture de `FinalCtaSection` (fond charbon, halo chaud diffus derrière la
 * carte « Agent Qualifyr ») à une capture du pied de page juste en dessous (fond plat, aucun
 * halo) et demande de reprendre le fond coloré du premier pour le second — la coupure entre les
 * deux sections se voyait trop nettement, glow puis noir plat sans transition.
 *
 * `AmbientGlow` est déjà le mécanisme du système pour ça (voir `Section.tsx`), réservé à deux ou
 * trois endroits par page — l'entrée et la sortie. Sur l'accueil, `DarkHero` tient l'entrée
 * (`glow="top"`) et `FinalCtaSection` tient la sortie (`glow="bottom"`) : ajouter un halo ici
 * porterait ce total à trois, encore dans le budget documenté, et prolonge le même halo de
 * sortie au lieu d'en ouvrir un nouveau point de couleur.
 *
 * `DarkFooter` est cependant posé sur sept pages, dont six sans `FinalCtaSection` au-dessus —
 * y activer le halo partout dépasserait le budget sur des pages qui ont déjà leur propre clôture
 * colorée (`DarkVerticalPage`, `glow="bottom"`). D'où une prop plutôt qu'un comportement fixe :
 * `glow` reste à `false` par défaut (les six autres pages sont inchangées), et seul
 * `src/app/page.tsx` la passe à `true`.
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

export type DarkFooterProps = {
  /**
   * Prolonge le halo de sortie de `FinalCtaSection` dans le pied de page.
   * `false` par défaut : voir le commentaire d'en-tête — seul `src/app/page.tsx`
   * (la seule page qui pose `FinalCtaSection` juste au-dessus) l'active.
   */
  readonly glow?: boolean;
};

export function DarkFooter({ glow = false }: DarkFooterProps = {}) {
  const year = new Date().getFullYear();

  return (
    <footer
      data-theme="dark"
      className="relative isolate flex w-full justify-center overflow-hidden border-t border-hairline bg-ink"
    >
      {glow ? <AmbientGlow position="top" intensity="soft" /> : null}
      <div className="w-full max-w-7xl px-4 pb-12 pt-20 md:px-8 md:pt-24">
        {/* La relance occupe la largeur, au-dessus des liens : elle doit être
            lue avant eux, pas trouvée après.
            Deux colonnes sur grand écran — texte et bouton à gauche, capture
            réelle de l'espace pro à droite — une seule colonne, image sous le
            texte, sur mobile. Voir le commentaire d'en-tête pour la
            justification de la capture et son recadrage. */}
        <div className="mb-20 grid items-center gap-10 text-center lg:grid-cols-[0.8fr_1.05fr] lg:gap-14 lg:text-left">
          <div className="flex flex-col items-center gap-5 lg:items-start">
            <h2 className="max-w-[28rem] text-[clamp(1.5rem,3vw,2.1rem)] font-bold leading-[1.15] tracking-[-0.025em] text-primary">
              Votre zone est analysée en une minute.
            </h2>
            <p className="max-w-[26rem] text-[0.9375rem] leading-[1.6] text-muted">
              Un espace pour suivre vos demandes, votre planning et vos prestations — sans rien
              à installer.
            </p>
            <Link
              href="/#agent-title"
              className="cta-solid inline-flex min-h-[48px] items-center rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-white/90"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Cadre à arêtes franches, sans ombre ni reflet — composition
              écartée par docs/03-direction-artistique.md §12 sous sa forme
              flottante uniquement ; posée à plat, elle reste conforme (§12.1).
              Capture desktop (paysage) plutôt que mobile : la première version
              (capture de téléphone en portrait) lisait comme un écran flottant
              greffé dans une mise en page pensée pour du paysage — retiré à la
              demande de Dorian le 20/09. */}
          <div className="relative mx-auto aspect-[1400/847] w-full max-w-[34rem] overflow-hidden border border-hairline lg:mx-0 lg:max-w-none">
            <Image
              src="/images/app-preview/espace-pro-demandes-desktop.webp"
              alt="Page Demandes de l'espace pro Qualifyr : demandes, compteurs de réservations et calendrier mensuel."
              fill
              sizes="(min-width: 62rem) 44rem, 34rem"
              className="object-cover object-top"
            />
          </div>
        </div>

        {/* Première zone : signature de marque à gauche, navigation à droite.
            La colonne de marque est plus large que les autres (`1.4fr`) —
            elle porte le logo et une phrase, pas une liste. */}
        <div className="grid gap-12 border-t border-hairline pt-14 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))] lg:gap-8">
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
