import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookingFlow } from '@/components/detailing/BookingFlow';
import { EmbedAutoHeight } from '@/components/detailing/EmbedAutoHeight';
import { loadDetailerBySlug } from '@/lib/detailing/config';

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
