import Image from 'next/image';
import Link from 'next/link';
import { Section } from './Section';

/**
 * Fermeture de la page d'accueil, juste avant le pied de page.
 *
 * **Il manquait une sortie.** La page se terminait sur la FAQ — la dernière
 * chose lue était une objection, pas une invitation. Entre l'objection et le
 * pied de page, personne ne relance.
 *
 * **Pas de preuve sociale ici.** Les avatars et le compteur du hero sont déjà
 * signalés comme non vérifiés (voir `page.tsx`) ; les dupliquer dans cette
 * section aurait doublé le risque au lieu de le limiter à un seul endroit à
 * corriger. Les trois réassurances ci-dessous sont vraies dès aujourd'hui,
 * sans donnée à confirmer.
 *
 * ---
 *
 * ## Fusion avec la relance du pied de page — 20 septembre 2026
 *
 * La page se terminait sur **deux** blocs de clôture successifs : celui-ci
 * (sur-titre, titre, deux boutons, trois réassurances, carte « Agent Qualifyr »)
 * puis, immédiatement en dessous, la relance de `DarkFooter` (autre titre,
 * autre bouton, capture du tableau de bord). Deux invitations à la suite se
 * neutralisent : le lecteur ne sait plus laquelle est la bonne, et la seconde
 * donne l'impression d'avoir raté la première. Dorian : « y a-t-il moyen de
 * faire qu'un bloc et rassembler les deux ? »
 *
 * Les deux sont donc réunis ici, et la relance du pied de page est retirée —
 * ce qui la retire aussi des six autres pages, où elle doublonnait déjà avec
 * leur propre `CtaSection`.
 *
 * **La carte « Agent Qualifyr » laisse sa place à la capture réelle.** Elle
 * listait trois lignes d'exemple (zone analysée, devis relancé, acompte
 * encaissé) ; la capture du tableau de bord montre les mêmes idées en vrai,
 * avec les demandes, le planning et le calendrier. Entre une illustration et
 * une preuve, on garde la preuve. Le cadre, lui, est conservé : `node-hero`,
 * le contour tricolore et son halo, qui portait la carte et encadre désormais
 * la capture — le motif de la charte survit à la fusion.
 */

const reassurance = ['Sans carte bancaire pour tester', 'Résiliable en un clic', 'France et Suisse'] as const;

export function FinalCtaSection() {
  return (
    <Section labelledBy="final-cta-title" glow="bottom" className="border-t border-hairline py-24">
      {/* 72rem plutôt que 64, et la colonne de droite plus large que celle de
          gauche depuis la fusion : une capture de tableau de bord est dense —
          barre latérale, quatre compteurs, calendrier — et devient illisible
          en dessous de ~600 px. Le texte, lui, garde une mesure confortable à
          ~470 px. */}
      <div className="mx-auto grid max-w-[72rem] items-center gap-10 lg:grid-cols-[0.9fr_1.2fr] lg:gap-14">
        <div>
          <p className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
            Votre secteur vous attend
          </p>
          <h2
            id="final-cta-title"
            className="mb-5 text-[clamp(1.9rem,3.8vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.025em] text-primary"
          >
            Lancez l’agent. Il fait le reste.
          </h2>
          {/* Une phrase par moitié de la fusion : ce que l'agent fait dehors,
              puis ce que vous retrouvez dedans — la capture à droite montrant
              précisément le « dedans ». */}
          <p className="mb-8 max-w-[30rem] text-[1.0625rem] leading-[1.65] text-muted">
            Une zone gratuite, sans carte bancaire. Vous voyez ce que l’agent trouve, puis vous
            suivez vos demandes et votre planning dans un espace sans rien à installer.
          </p>

          <div className="mb-8 flex flex-wrap items-center gap-3">
            <Link
              href="#agent-title"
              className="cta-solid inline-flex min-h-[48px] items-center rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-white/90"
            >
              Analyser ma zone gratuitement
            </Link>
            <Link
              href="/creation-site-web"
              className="inline-flex min-h-[48px] items-center rounded-full px-6 text-[0.9375rem] font-semibold !text-primary no-underline transition-colors duration-150 hover:bg-white/[0.06]"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Créer mon site avec Qualifyr
            </Link>
          </div>

          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
            {reassurance.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[0.875rem] text-muted">
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="size-4 shrink-0 fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
                  style={{ stroke: 'var(--accent-2)' }}
                >
                  <path d="M3 8.5l3.2 3.2L13 4.8" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Capture réelle du tableau de bord, dans le cadre `node-hero` : même
            contour tricolore que l'agent central d'`AgentFlow` et la colonne
            « Avec Qualifyr » de `BeforeAfterSection` — le visiteur qui arrive
            jusqu'ici l'a déjà vu deux fois, le retrouver confirme au lieu
            d'introduire un nouveau visuel.

            Le cadre n'est pas une ombre portée sous une capture flottante (ce
            que `docs/03-direction-artistique.md` §12 écarte) : c'est un contour
            peint et son halo, déjà employés ailleurs sur la page, et la capture
            est posée dedans à plat. Voir §12.1 pour le détail du recadrage —
            nom, ville et identifiant du compte client retirés, aucun chiffre
            modifié. */}
        <div className="node-hero overflow-hidden rounded-[1.5rem] p-2 sm:p-2.5">
          <div className="relative aspect-[1400/847] w-full overflow-hidden rounded-[1.1rem]">
            <Image
              src="/images/app-preview/espace-pro-demandes-desktop.webp"
              alt="Page Demandes de l’espace pro Qualifyr : demandes, compteurs de réservations et calendrier mensuel."
              fill
              sizes="(min-width: 64rem) 40rem, (min-width: 40rem) 90vw, 100vw"
              className="object-cover object-top"
            />

            {/* Fondu bas : la capture se dissout dans le fond de la carte au
                lieu de s'arrêter sur une coupe nette. Un dégradé peint vers la
                couleur exacte du `padding-box` de `node-hero` (`#0f0f11`), et
                surtout pas un `mask-image` : tout effet qui promeut l'élément
                sur son propre calque est précisément ce qui a produit les
                rectangles noirs des bulles du hero sur Safari iOS (voir
                `MessageBubble.tsx`). */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%]"
              style={{ background: 'linear-gradient(to bottom, rgba(15,15,17,0), #0f0f11)' }}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
