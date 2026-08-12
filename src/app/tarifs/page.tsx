import type { Metadata } from 'next';
import { BookingButton } from '@/components/agency/BookingButton';
import { DiagnosticLink } from '@/components/agency/DiagnosticLink';
import { PricingTable } from '@/components/agency/PricingTable';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { buildMetadata } from '@/lib/metadata';
import { webPage } from '@/lib/structured-data';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/tarifs');

/**
 * Tarifs affichés.
 *
 * Des fourchettes, pas des prix fermes : un site dépend du nombre de pages,
 * des contenus disponibles et du parcours attendu. L'objectif n'est pas d'être
 * exact, il est d'être **filtrant** — que celui dont le budget ne correspond
 * pas le sache avant de remplir un formulaire, et que celui pour qui c'est
 * accessible cesse d'hésiter.
 */
export default function PricingPage() {
  return (
    <>
      <JsonLd data={webPage('/tarifs')} />

      <Section ruled>
        <Container>
          <div className={styles.intro}>
            <div>
              <Eyebrow>Tarifs</Eyebrow>
              <h1>Ce que ça coûte, avant de nous parler.</h1>
            </div>
            <div className={styles.introCopy}>
              <p>
                Des fourchettes honnêtes plutôt qu’un devis à rallonge. Le prix exact dépend du
                nombre de pages, des contenus que vous avez déjà et du parcours souhaité — mais
                vous saurez tout de suite si nous sommes dans vos moyens.
              </p>
              <ul aria-label="Repères">
                <li>Prix affichés</li>
                <li>Devis sous 48 h</li>
                <li>Sans engagement</li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="sunken" ruled>
        <Container>
          <PricingTable />
        </Container>
      </Section>

      <Section ruled>
        <Container>
          <div className={styles.block}>
            <h2>Ce qui fait varier le prix.</h2>
            <ol className={styles.factors}>
              <li>
                <strong>Les contenus</strong>
                <span>
                  Textes et photographies existants font baisser le budget. Tout rédiger et
                  organiser depuis zéro le fait monter.
                </span>
              </li>
              <li>
                <strong>Le nombre de pages</strong>
                <span>
                  Une page métier bien construite vaut mieux que six pages creuses — nous le disons
                  quand c’est le cas.
                </span>
              </li>
              <li>
                <strong>Le parcours de demande</strong>
                <span>
                  Un formulaire simple ou un parcours qui qualifie, oriente et prépare l’échange ne
                  demandent pas le même travail.
                </span>
              </li>
            </ol>
          </div>
        </Container>
      </Section>

      <Section surface="sunken">
        <Container>
          <div className={styles.final}>
            <div>
              <Eyebrow>La suite</Eyebrow>
              <h2>Un chiffre précis, sous 48 heures.</h2>
              <p>
                Le diagnostic prend trois minutes et sert à cadrer votre situation. Vous recevez
                ensuite une proposition chiffrée, sans relance commerciale.
              </p>
            </div>
            <div className={styles.finalActions}>
              <DiagnosticLink ctaId="pricing_diagnostic">Faire le diagnostic</DiagnosticLink>
              <BookingButton ctaId="pricing_booking" variant="secondary">
                Réserver une analyse de parcours
              </BookingButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
