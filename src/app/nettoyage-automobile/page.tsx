import type { Metadata } from 'next';
import { BookingFlow } from '@/components/detailing/BookingFlow';
import { VerticalServicePage } from '@/components/editorial/VerticalServicePage';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { automotiveVertical } from '@/content/verticals';
import { loadDetailerBySlug } from '@/lib/detailing/config';
import { buildMetadata } from '@/lib/metadata';
import { faqPage, verticalService, webPage } from '@/lib/structured-data';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/nettoyage-automobile');

/**
 * Compte de démonstration du produit.
 *
 * Le tunnel est intégré ici plutôt que renvoyé vers `/reservation/…` : la page
 * métier porte tout l'argumentaire de vente, et un lien sortant obligeait le
 * prospect à quitter la démonstration pour retrouver les raisons de nous
 * choisir. L'outil se manipule donc au milieu de la page qui le vend.
 */
const DEMO_SLUG = 'clean-auto-test';

// Le tunnel lit prix, options et disponibilités dans une base qui change à
// tout moment : la page ne peut pas être figée au build.
export const dynamic = 'force-dynamic';

export default async function AutomotiveCleaningPage() {
  const detailer = await loadDetailerBySlug(DEMO_SLUG);

  return (
    <>
      <JsonLd data={webPage('/nettoyage-automobile')} />
      <JsonLd data={verticalService(automotiveVertical)} />
      <JsonLd data={faqPage('/nettoyage-automobile', automotiveVertical.faq)} />
      <VerticalServicePage content={automotiveVertical} />

      {/* Rendu seulement si la démonstration répond. Une section de titre
          surmontant un tunnel absent vaudrait moins que pas de section du
          tout — et la page reste vendeuse sans elle. */}
      {detailer ? (
        <Section id="demonstration" surface="sunken" spacing="tight" ruled>
          <Container>
            <div className={styles.demoIntro}>
              <Eyebrow>La démonstration</Eyebrow>
              <h2>Réservez comme le ferait votre client.</h2>
              <p>
                Ce tunnel est le produit que nous éditons, branché sur un compte de
                démonstration. Les prix, les durées et les créneaux sont ceux d’un
                professionnel fictif — les vôtres se règlent depuis votre espace.
              </p>
            </div>

            <div className={styles.demoFrame}>
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
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
