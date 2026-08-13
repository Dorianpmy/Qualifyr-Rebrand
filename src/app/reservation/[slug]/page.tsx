import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookingFlow } from '@/components/detailing/BookingFlow';
import { site } from '@/content/site';
import { loadDetailerBySlug } from '@/lib/detailing/config';

type ReservationPageProps = {
  readonly params: Promise<{ slug: string }>;
};

// Toujours rendue à la demande : prix, options et disponibilités viennent
// d'une base qui change à tout moment, jamais d'un instantané figé au build.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ReservationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detailer = await loadDetailerBySlug(slug);
  if (!detailer) return {};

  const title = `Réserver un nettoyage avec ${detailer.name}`;
  const description = detailer.city
    ? `Devis immédiat et réservation d'un créneau avec ${detailer.name}, à ${detailer.city}.`
    : `Devis immédiat et réservation d'un créneau avec ${detailer.name}.`;

  return {
    title,
    description,
    robots: site.indexable ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
  };
}

export default async function ReservationPage({ params }: ReservationPageProps) {
  const { slug } = await params;
  const detailer = await loadDetailerBySlug(slug);

  if (!detailer) notFound();

  return (
    <BookingFlow
      detailer={{
        id: detailer.id,
        slug: detailer.slug,
        name: detailer.name,
        city: detailer.city,
        mobileService: detailer.mobileService,
        workshopService: detailer.workshopService,
        workshopAddress: detailer.workshopAddress,
      }}
      quoteConfig={detailer.quoteConfig}
    />
  );
}
