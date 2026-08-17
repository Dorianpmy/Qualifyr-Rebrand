import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/agency/Section';

/**
 * Inventaire des écrans du projet — page interne.
 *
 * **Pourquoi elle existe.** Le projet compte trois produits qui vivent dans le
 * même dépôt : un site de vente, un tunnel de réservation client, et un
 * dashboard professionnel. Sans carte, on oublie qu'un écran existe — et on le
 * redéveloppe, ou pire, on le laisse pourrir sans le voir.
 *
 * **Elle n'est pas publique.** `noindex, nofollow`, et aucun lien n'y mène
 * depuis le site. Elle expose la structure interne et les écrans en chantier :
 * ce n'est pas une information à donner à un concurrent, ni à un prospect qui
 * tomberait sur une page inachevée.
 *
 * **L'état est déclaré à la main, volontairement.** Un statut calculé
 * automatiquement dirait seulement si le fichier existe, ce qui n'apprend rien.
 * Ce qui compte est de savoir si l'écran est fini, s'il attend une donnée, ou
 * s'il est en cours de refonte — et cela, seul un humain le sait.
 */

export const metadata: Metadata = {
  title: 'Plan du projet — interne',
  robots: { index: false, follow: false, nocache: true },
};

type Status = 'live' | 'wip' | 'blocked';

type Screen = {
  readonly href: string;
  readonly label: string;
  readonly note: string;
  readonly status: Status;
};

type Group = {
  readonly title: string;
  readonly intro: string;
  readonly screens: readonly Screen[];
};

const groups: readonly Group[] = [
  {
    title: 'Site de vente',
    intro: 'Ce que voit un professionnel qui découvre Qualifyr.',
    screens: [
      { href: '/vitrine', label: 'Nouvelle vitrine', note: 'Charte sombre — en cours de validation', status: 'wip' },
      { href: '/', label: 'Accueil actuel', note: 'Ancienne charte, en ligne et référencé', status: 'live' },
      { href: '/nettoyage-automobile', label: 'Nettoyage automobile', note: 'Page métier', status: 'live' },
      { href: '/tarifs', label: 'Tarifs', note: 'À refondre — prix à confirmer', status: 'blocked' },
      { href: '/realisations', label: 'Réalisations', note: 'Cas clients', status: 'live' },
      { href: '/estimation', label: 'Estimation', note: 'Simulateur', status: 'live' },
      { href: '/contact', label: 'Contact', note: '', status: 'live' },
      { href: '/blog', label: 'Journal', note: '', status: 'live' },
    ],
  },
  {
    title: 'Tunnel client',
    intro: 'Ce que voit le client final d’un professionnel équipé.',
    screens: [
      {
        href: '/reservation/demo',
        label: 'Page de réservation',
        note: 'Devis, créneau, adresse géocodée — remplacer « demo » par un slug réel',
        status: 'live',
      },
      {
        href: '/embed/demo',
        label: 'Tunnel embarqué',
        note: 'Version sans en-tête, à coller sur le site du pro',
        status: 'live',
      },
    ],
  },
  {
    title: 'Dashboard professionnel',
    intro: 'Connexion requise. Le compte doit être rattaché à une fiche detailer.',
    screens: [
      { href: '/app', label: 'Demandes', note: 'Pipeline des réservations', status: 'live' },
      {
        href: '/app/prestations',
        label: 'Prestations',
        note: 'Tarifs, options, pays, code d’intégration',
        status: 'live',
      },
      { href: '/app/cases', label: 'Avant / Après', note: 'Galerie de preuves', status: 'live' },
      { href: '/app/invoices', label: 'Factures', note: '', status: 'live' },
      { href: '/app/login', label: 'Connexion', note: 'Lien magique ou mot de passe', status: 'live' },
    ],
  },
];

const statusLabel: Record<Status, string> = {
  live: 'En ligne',
  wip: 'En cours',
  blocked: 'Bloqué',
};

/* Le statut est la seule couleur de la page : trois pastilles suffisent à
   scanner l'état du projet sans lire une ligne.
   `live` posé en couleur arbitraire (#22c55e, la charte) plutôt qu'en
   `bg-emerald-400` (18/08/2026, recherche exhaustive du vert demandée
   explicitement) : `emerald-400` n'est pas la teinte de la charte. */
const statusDot: Record<Status, string> = {
  live: 'bg-[#22c55e]/70',
  wip: 'bg-amber-400/70',
  blocked: 'bg-rose-400/70',
};

export default function PlanPage() {
  return (
    <div data-theme="dark" className="min-h-dvh bg-ink">
      <Section className="py-20">
        <header className="mb-14 max-w-[46rem]">
          <p className="mb-2 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
            Interne — non publié
          </p>
          <h1 className="mb-4 text-[clamp(1.9rem,4vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.03em] text-primary">
            Tous les écrans du projet.
          </h1>
          <p className="text-[1.0625rem] leading-[1.65] text-muted">
            Trois produits dans un seul dépôt : le site qui vend, le tunnel que voient les clients
            de vos pros, et le dashboard où vos pros travaillent.
          </p>
        </header>

        <div className="grid gap-12">
          {groups.map((group) => (
            <section key={group.title}>
              <div className="mb-5 border-b border-hairline pb-4">
                <h2 className="text-[1.25rem] font-bold tracking-[-0.015em] text-primary">
                  {group.title}
                </h2>
                <p className="mt-1 text-[0.9375rem] text-muted">{group.intro}</p>
              </div>

              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.screens.map((screen) => (
                  <li key={screen.href}>
                    <Link
                      href={screen.href}
                      className="flex h-full flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 no-underline transition-colors duration-150 hover:border-white/20 hover:bg-white/[0.04] motion-reduce:transition-none"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`size-1.5 shrink-0 rounded-full ${statusDot[screen.status]}`}
                        />
                        <span className="text-[0.9375rem] font-semibold !text-primary">
                          {screen.label}
                        </span>
                      </span>
                      <span className="font-mono text-[0.75rem] !text-faint">{screen.href}</span>
                      {screen.note ? (
                        <span className="text-[0.8125rem] leading-[1.45] !text-muted">
                          {screen.note}
                        </span>
                      ) : null}
                      <span className="sr-only">{statusLabel[screen.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-14 border-t border-hairline pt-6">
          <p className="text-[0.8125rem] leading-[1.6] text-faint">
            Les écrans du dashboard exigent une session. Le tunnel utilise le slug «&nbsp;demo&nbsp;» ;
            remplacez-le par celui d’un professionnel réel pour voir de vraies données.
          </p>
        </footer>
      </Section>
    </div>
  );
}
