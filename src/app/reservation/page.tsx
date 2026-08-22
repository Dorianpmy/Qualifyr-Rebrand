import type { Metadata } from 'next';
import Link from 'next/link';

import { DarkPageShell } from '@/components/editorial/DarkPageShell';
import { EditorialHeader } from '@/components/editorial/EditorialHeader';
import { Section } from '@/components/agency/Section';

/**
 * `/reservation` sans identifiant de professionnel.
 *
 * **Cette route n'existait pas, et c'était un vrai trou** (créée le
 * 22/08/2026). Le tunnel de réservation ne vit que sous
 * `/reservation/[slug]` : la racine tombait donc sur la 404 générale du site,
 * qui parle d'un lien cassé sans rien proposer d'utile.
 *
 * Or on n'arrive pas ici par hasard. Trois chemins y mènent, tous prévisibles :
 * le bouton « Page client » de l'espace pro quand le compte n'a pas encore de
 * fiche (le gabarit produisait `/reservation/` — corrigé dans `AppShell`) ; un
 * lien partagé dont l'identifiant a sauté au copier-coller ; et quelqu'un qui
 * devine l'adresse en cherchant à réserver.
 *
 * Chacun de ces trois visiteurs a besoin d'autre chose, d'où les deux sorties
 * distinctes plus bas. Ce qu'il ne faut surtout pas faire, c'est rediriger
 * vers l'accueil : le visiteur perd le contexte et croit s'être trompé de
 * site.
 *
 * Non indexée : elle n'a pas de contenu propre à proposer à un moteur, et
 * laisser indexer une page d'aiguillage ferait concurrence aux vraies pages de
 * réservation des professionnels.
 */
export const metadata: Metadata = {
  title: 'Réserver un nettoyage',
  description:
    'Cette adresse doit être complétée par le nom du professionnel chez qui vous souhaitez réserver.',
  robots: { index: false, follow: false },
};

export default function ReservationIndexPage() {
  return (
    <DarkPageShell breadcrumb="Réservation">
      <EditorialHeader
        eyebrow="Réservation"
        title="Il manque le nom du professionnel."
        lead="Chaque professionnel qui utilise Qualifyr a sa propre page de réservation. L’adresse se termine par son nom — par exemple qualifyragence.com/reservation/son-nom — et c’est cette partie qui manque ici."
      />

      <Section className="pb-24">
        <div className="grid max-w-[46rem] gap-3 sm:grid-cols-2">
          {/* Deux sorties, dans l'ordre de fréquence : celui qui voulait
              réserver arrive avec un lien incomplet, il est majoritaire. Le
              professionnel qui teste sa propre page vient ensuite. */}
          <div className="rounded-2xl border border-hairline p-5">
            <h2 className="mb-2 text-[1rem] font-semibold text-primary">
              Vous vouliez réserver ?
            </h2>
            <p className="mb-4 text-[0.9375rem] leading-[1.6] text-muted">
              Reprenez le lien complet que le professionnel vous a transmis, ou
              demandez-le lui directement. Nous ne pouvons pas deviner de qui il
              s’agit à partir de cette adresse.
            </p>
            <Link
              href="/"
              className="text-[0.9375rem] !text-muted underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:!text-primary"
            >
              Découvrir Qualifyr
            </Link>
          </div>

          <div className="rounded-2xl border border-hairline p-5">
            <h2 className="mb-2 text-[1rem] font-semibold text-primary">
              Vous êtes le professionnel ?
            </h2>
            <p className="mb-4 text-[0.9375rem] leading-[1.6] text-muted">
              Votre page de réservation apparaît dès que votre fiche est créée.
              Vous la retrouverez ensuite depuis votre espace, sur le bouton
              central de la barre de navigation.
            </p>
            <Link
              href="/app"
              className="text-[0.9375rem] !text-muted underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:!text-primary"
            >
              Ouvrir mon espace pro
            </Link>
          </div>
        </div>
      </Section>
    </DarkPageShell>
  );
}
