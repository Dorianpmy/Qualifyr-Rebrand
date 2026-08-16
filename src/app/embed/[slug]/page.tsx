import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookingFlow } from '@/components/detailing/BookingFlow';
import { EmbedAutoHeight } from '@/components/detailing/EmbedAutoHeight';
import { loadDetailerBySlug } from '@/lib/detailing/config';
import { DEMO_DETAILER, DEMO_QUOTE_CONFIG } from '@/lib/detailing/demo';

/**
 * Tunnel de réservation embarqué sur le site du professionnel.
 *
 * **Pourquoi une route distincte de `/reservation/[slug]`.** La page publique
 * porte un en-tête qui vend la prestation : promesse, prix d'appel, preuve
 * avant/après. Rejoué dans une page qui contient déjà tout ça, il fait doublon
 * et donne l'impression d'un service collé de travers. L'embarqué ne contient
 * donc que le formulaire — la vente est déjà faite par le site d'accueil.
 *
 * La page reste indexable à `noindex` : deux URL servant le même tunnel se
 * cannibaliseraient dans les résultats de recherche.
 */

type EmbedPageProps = {
  readonly params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { slug } = await params;

  /*
   * Cas particulier : `slug === 'demo'`.
   *
   * `demo` n'est pas le slug d'un client : c'est celui que `DemoSection`
   * charge dans l'iframe du tunnel, sur la page d'accueil elle-même. Une
   * version antérieure cherchait ici une fiche `detailers` publiée avec ce
   * slug, et affichait un message d'excuse quand elle manquait — ce qui
   * s'est reproduit plusieurs fois en production (projet Supabase mal
   * configuré, ligne dépubliée). On ne dépend plus de la base du tout pour
   * ce cas précis : `DEMO_DETAILER` et `DEMO_QUOTE_CONFIG` sont codés en dur
   * dans `lib/detailing/demo.ts`, et `BookingFlow` en mode `demo` ne fait
   * plus aucun appel réseau pour les créneaux ni pour la réservation finale.
   * Cette page ne peut plus casser pour une raison qui vient de Supabase.
   */
  if (slug === 'demo') {
    return (
      <>
        <EmbedAutoHeight />
        <BookingFlow detailer={DEMO_DETAILER} quoteConfig={DEMO_QUOTE_CONFIG} demo />
      </>
    );
  }

  const detailer = await loadDetailerBySlug(slug);
  if (!detailer) notFound();

  return (
    <>
      <EmbedAutoHeight />
      <BookingFlow
        detailer={{
          id: detailer.id,
          slug: detailer.slug,
          name: detailer.name,
          city: detailer.city,
          country: detailer.country,
          scopeLabels: detailer.scopeLabels,
          base: detailer.base,
          mobileService: detailer.mobileService,
          workshopService: detailer.workshopService,
          workshopAddress: detailer.workshopAddress,
        }}
        quoteConfig={detailer.quoteConfig}
      />
    </>
  );
}
