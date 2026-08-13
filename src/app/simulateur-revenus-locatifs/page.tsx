import type { Metadata } from 'next';
import Link from 'next/link';
import { RentalEstimator } from '@/components/agency/RentalEstimator';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { buildMetadata } from '@/lib/metadata';
import { webPage } from '@/lib/structured-data';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/simulateur-revenus-locatifs');

export default function RentalEstimatorPage() {
  return (
    <>
      <JsonLd data={webPage('/simulateur-revenus-locatifs')} />

      {/* Introduction volontairement courte.
          Sur un téléphone de 667 px, un titre, un paragraphe complet, des
          repères et le premier champ du simulateur ne tiennent pas ensemble
          au-dessus de la ligne de flottaison. L'explication détaillée est donc
          descendue sous l'outil : c'est elle qu'on lit après avoir joué, pas
          avant. Reste ici une seule phrase, qui dit ce qu'on obtient. */}
      <Section spacing="tight" ruled>
        <Container>
          <div className={styles.intro}>
            <div>
              <Eyebrow>Simulateur · Location courte durée</Eyebrow>
              <h1>Combien ce logement pourrait-il rapporter ?</h1>
            </div>
            <div className={styles.introCopy}>
              <p>Quatre choix, une fourchette de revenus annuels et ce qu’il en resterait.</p>
              <ul className={styles.markers} aria-label="Repères du simulateur">
                <li>Résultat immédiat</li>
                <li>Sans inscription</li>
                <li>Fourchette indicative</li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="sunken" spacing="tight" ruled>
        <Container>
          <RentalEstimator />
        </Container>
      </Section>

      <Section spacing="tight">
        <Container>
          <div className={styles.notes}>
            <h2>Comment lire cette estimation</h2>
            <p>
              Quatre choix suffisent pour obtenir une fourchette de revenus annuels, le prix moyen
              par nuit correspondant et ce qu’il resterait au propriétaire une fois la conciergerie
              rémunérée.
            </p>
            <p>
              Le calcul croise un prix moyen par nuit et un taux d’occupation observés dans la ville
              choisie, puis les corrige selon le type de logement, sa capacité d’accueil et son
              niveau de finition. Il s’agit d’un ordre de grandeur destiné à savoir si un projet
              mérite d’être étudié, pas d’une expertise.
            </p>
            <p>
              Trois facteurs peuvent déplacer sensiblement le résultat : l’emplacement précis dans la
              ville, la qualité des photographies et de l’annonce, et la réglementation locale — de
              nombreuses communes encadrent désormais la location courte durée. Une conciergerie
              professionnelle agit surtout sur les deux derniers.
            </p>
            <p>
              Vous êtes une conciergerie et vous souhaitez proposer ce simulateur à vos propres
              propriétaires, avec vos barèmes et vos couleurs&nbsp;?{' '}
              <Link href="/outil-conciergerie">Découvrez notre outil d’acquisition</Link>.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
