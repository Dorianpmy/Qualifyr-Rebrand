import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { cities, getCity } from '@/content/cities';
import { site } from '@/content/site';
import styles from './page.module.css';

/** Trois villes générées à la compilation : aucune page dynamique à l'exécution. */
export function generateStaticParams() {
  return cities.map((city) => ({ ville: city.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ville: string }>;
}): Promise<Metadata> {
  const { ville } = await params;
  const city = getCity(ville);

  if (!city) return { title: 'Page introuvable' };

  const title = `Site pour conciergerie ${city.inCity} — Qualifyr`;
  const description = `Site et outil d’acquisition pour les conciergeries de location courte durée ${city.inCity} : estimation de revenus, demandes de propriétaires qualifiées, réglementation locale.`;
  const url = new URL(`/conciergerie/${city.slug}`, site.url).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: site.indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title, description, url, type: 'website', locale: site.locale },
  };
}

export default async function ConciergeCityPage({
  params,
}: {
  params: Promise<{ ville: string }>;
}) {
  const { ville } = await params;
  const city = getCity(ville);

  if (!city) notFound();

  return (
    <>
      <Section ruled>
        <Container>
          <div className={styles.intro}>
            <div>
              <Eyebrow>Conciergeries · {city.name}</Eyebrow>
              <h1>Trouver des propriétaires {city.inCity}.</h1>
            </div>
            <div className={styles.introCopy}>
              <p>{city.intro}</p>
              <ul aria-label="Repères">
                <li>Site et parcours</li>
                <li>Outil à 79 €/mois</li>
                <li>Sans engagement</li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="sunken" ruled>
        <Container>
          <div className={styles.block}>
            <h2>Ce qui distingue le marché {city.inCity}.</h2>
            <ol className={styles.context}>
              {city.context.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section ruled>
        <Container>
          <div className={styles.block}>
            <h2>La réglementation locale.</h2>
            <p className={styles.regulation}>{city.regulation}</p>
            <p className={styles.disclaimer}>
              Ces informations sont données à titre indicatif et évoluent régulièrement. Vérifiez
              l’état du droit applicable auprès de la mairie {city.inCity} avant tout engagement.
            </p>
          </div>
        </Container>
      </Section>

      <Section surface="inverse">
        <Container>
          <div className={styles.cta}>
            <div>
              <Eyebrow inverse>Votre prochaine étape</Eyebrow>
              <h2>Une page qui vous apporte des propriétaires {city.inCity}.</h2>
              <p>
                Le propriétaire estime ce que son bien peut rapporter, laisse ses coordonnées, et la
                demande arrive dans votre tableau de bord — avec le logement décrit et l’estimation
                déjà calculée.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link className={styles.ctaPrimary} href="/outil-conciergerie">
                Découvrir l’outil
              </Link>
              <Link className={styles.ctaSecondary} href="/conciergerie">
                Voir l’offre de site complet
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="tight">
        <Container>
          <p className={styles.otherCities}>
            Autres villes :{' '}
            {cities
              .filter((entry) => entry.slug !== city.slug)
              .map((entry, index, list) => (
                <span key={entry.slug}>
                  <Link href={`/conciergerie/${entry.slug}`}>{entry.name}</Link>
                  {index < list.length - 1 ? ' · ' : ''}
                </span>
              ))}
          </p>
        </Container>
      </Section>
    </>
  );
}
