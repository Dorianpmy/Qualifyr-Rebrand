import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { CallToAction } from '@/components/editorial/CallToAction';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import { InteractiveSitePreview } from '@/components/editorial/InteractiveSitePreview';
import { MethodStep } from '@/components/editorial/MethodStep';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { JsonLd } from '@/components/seo/JsonLd';
import { TextLink } from '@/components/ui/TextLink';

import {
  expectedOutcomes,
  includedWork,
  projectSteps,
  webDesignPage,
} from '@/content/web-design';
import { swCarCleaning } from '@/content/sw-car-cleaning';
import { buildMetadata } from '@/lib/metadata';
import { breadcrumbList, webDesignService } from '@/lib/structured-data';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/creation-site-web');

export default function WebDesignPage() {
  return (
    <>
      <Section spacing="tight">
        <Container>
          <JsonLd data={webDesignService()} />
          <JsonLd
            data={breadcrumbList([
              { name: 'Accueil', path: '/' },
              { name: 'Création de site web', path: '/creation-site-web' },
            ])}
          />
          <Breadcrumbs trail={[{ label: 'Accueil', href: '/' }]} current="Création de site web" />
          <div className={styles.hero}>
            <SectionHeading
              level={1}
              eyebrow={webDesignPage.eyebrow}
              title={webDesignPage.title}
              lead={webDesignPage.lead}
            />
            <p className={styles.intro}>
              Un site professionnel ne se limite pas à son apparence. Il doit présenter votre
              offre avec précision, rassurer sans exagérer et faciliter la prochaine étape.
            </p>
          </div>
        </Container>
      </Section>

      <Section surface="sunken" ruled spacing="tight">
        <Container>
          <SectionHeading
            eyebrow="Le rôle du site"
            title="Trois choses doivent rester évidentes."
          />
          <div className={styles.cards}>
            {expectedOutcomes.map((item) => (
              <EditorialCard key={item.title} title={item.title}>
                {item.body}
              </EditorialCard>
            ))}
          </div>
        </Container>
      </Section>

      <Section ruled spacing="tight">
        <Container>
          <div className={styles.included}>
            <SectionHeading
              eyebrow="Conception"
              title="Ce que nous prenons en charge."
              lead="Le périmètre exact dépend du projet. Chaque élément retenu doit servir la compréhension, l’usage ou la prise de contact."
            />
            <ul className={styles.list}>
              {includedWork.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </Container>
      </Section>

      <Section surface="raised" ruled spacing="tight">
        <Container>
          <SectionHeading eyebrow="Déroulement" title="Un projet construit dans le bon ordre." />
          <ol className={styles.steps}>
            {projectSteps.map((step) => (
              <MethodStep key={step.number} number={step.number} title={step.title}>
                {step.body}
              </MethodStep>
            ))}
          </ol>
        </Container>
      </Section>

      <Section spacing="tight">
        <Container>
          <div className={styles.caseStudy}>
            {swCarCleaning.externalUrl ? (
              <InteractiveSitePreview
                url={swCarCleaning.externalUrl}
                title="Site SW Carcleaning interactif"
                domain="swcarcleaning.ch"
                caption="Réalisation réelle · Fribourg"
                compact
              />
            ) : null}
            <div className={styles.caseText}>
              <SectionHeading
                eyebrow="Réalisation réelle"
                title="SW Carcleaning"
                lead="Une identité et un site conçus pour présenter un service de nettoyage automobile à domicile et faciliter la prise de contact."
              />
              <TextLink href="/realisations/sw-car-cleaning">Découvrir le projet</TextLink>
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="inverse">
        <Container>
          <CallToAction
            eyebrow="Votre projet"
            title="Présentez-nous le site que vous souhaitez créer."
            actionLabel="Parler de mon projet"
          >
            Votre activité, vos utilisateurs et ce que le site doit permettre de faire. Nous
            commencerons par clarifier le besoin avant de parler de pages ou de fonctionnalités.
          </CallToAction>
        </Container>
      </Section>
    </>
  );
}
