import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookingFlow } from '@/components/detailing/BookingFlow';
import { BookingIntro } from '@/components/detailing/BookingIntro';
import { site } from '@/content/site';
import { listPublishedCases } from '@/lib/detailing/cases';
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

  // Les réalisations sont un argument, pas une donnée critique : leur absence
  // ne doit jamais empêcher la page de se charger.
  const cases = await listPublishedCases(detailer.id).catch(() => []);

  // « À partir de » vient du catalogue réel du professionnel. Écrire un
  // montant en dur garantissait qu'il devienne faux à la première grille
  // tarifaire modifiée — et un prix d'appel démenti trois écrans plus loin
  // coûte plus cher que pas de prix d'appel du tout.
  const prices = detailer.quoteConfig.prices;
  const startingPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.basePrice)) : null;
  const shortestMinutes = prices.length > 0 ? Math.min(...prices.map((p) => p.baseMinutes)) : null;

  return (
    <>
      <BookingIntro
        name={detailer.name}
        city={detailer.city}
        country={detailer.country}
        intro={detailer.intro}
        yearsExperience={detailer.yearsExperience}
        insuranceLabel={detailer.insuranceLabel}
        freeCancellationHours={detailer.freeCancellationHours}
        mobileService={detailer.mobileService}
        workshopService={detailer.workshopService}
        depositEnabled={detailer.quoteConfig.depositEnabled}
        startingPrice={startingPrice}
        shortestMinutes={shortestMinutes}
        cases={cases}
      />

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
