import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

import { Logo } from '@/components/ui/Logo';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Divider } from '@/components/ui/Divider';

import { SectionHeading } from '@/components/editorial/SectionHeading';
import { EditorialCard } from '@/components/editorial/EditorialCard';
import { OutcomeCard } from '@/components/editorial/OutcomeCard';
import { JourneyStep } from '@/components/editorial/JourneyStep';
import { MethodStep } from '@/components/editorial/MethodStep';
import { CaseStudyCard } from '@/components/editorial/CaseStudyCard';
import { QuoteBlock } from '@/components/editorial/QuoteBlock';
import { FAQAccordion } from '@/components/editorial/FAQAccordion';
import { ContactPanel } from '@/components/editorial/ContactPanel';
import { CallToAction } from '@/components/editorial/CallToAction';

import { brand, collaboration, journey } from '@/content/brand';
import { faq } from '@/content/faq';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false, follow: false },
};

const swatches = [
  ['--color-ivory', 'Ivoire · fond'],
  ['--color-paper', 'Blanc chaud'],
  ['--color-sand', 'Sable'],
  ['--color-stone', 'Pierre'],
  ['--color-border', 'Filet'],
  ['--color-muted', 'Texte secondaire'],
  ['--color-brass', 'Laiton · décor'],
  ['--color-copper-deep', 'Cuivre · accent'],
  ['--color-espresso', 'Brun profond'],
  ['--color-ink', 'Charbon'],
] as const;

/**
 * Planche de référence du design system.
 *
 * Outil interne, accessible uniquement en développement (`npm run dev`).
 * Le fichier s'appelle `page.dev.tsx` : cette extension n'est déclarée dans
 * `pageExtensions` que hors production, donc ni la route ni sa feuille de
 * style n'existent dans le build livré.
 */
export default function DesignSystemPage() {
  return (
    <>
      <Section spacing="tight">
        <Container>
          <Breadcrumbs current="Design system" />
          <SectionHeading
            level={1}
            split
            eyebrow="Référence interne"
            title="Design system Qualifyr"
            lead="Planche de contrôle des composants globaux. Page de développement : elle renvoie 404 en production et ne fait pas partie de l’arborescence du site."
            className="stack-lg"
          />
        </Container>
      </Section>

      <Section spacing="tight" ruled>
        <Container>
          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Logo</h2>
            <div className={styles.row}>
              <Logo />
              <Logo size="large" />
            </div>
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Palette</h2>
            <div className={styles.swatches}>
              {swatches.map(([token, label]) => (
                <div key={token} className={styles.swatch}>
                  <div className={styles.chip} style={{ backgroundColor: `var(${token})` }} />
                  <span>{label}</span>
                  <code>{token}</code>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Boutons</h2>
            <div className={styles.row}>
              <Button>Principal</Button>
              <Button variant="secondary">Secondaire</Button>
              <Button variant="text">Bouton texte</Button>
              <Button withArrow>Avec flèche</Button>
            </div>
            <div className={styles.row}>
              <Button disabled>Désactivé</Button>
              <Button loading>Envoyer</Button>
              <ButtonLink href="/contact" withArrow>
                Lien d’action
              </ButtonLink>
            </div>
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Liens, sur-titres, filets</h2>
            <div className={styles.row}>
              <TextLink href="/methode">Lien interne</TextLink>
              <TextLink externalHref="https://qualifyragence.com">Lien externe</TextLink>
              <TextLink href="/a-propos" tone="quiet">
                Lien discret
              </TextLink>
            </div>
            <Eyebrow>Sur-titre avec filet</Eyebrow>
            <Eyebrow bare numbered>
              02 — sur-titre numéroté
            </Eyebrow>
            <Divider />
            <Divider tone="accent" short />
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Titre de section</h2>
            <SectionHeading
              split
              eyebrow="Méthode"
              title="Le parcours, pas seulement le site"
              lead={brand.explanation}
            />
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Blocs éditoriaux</h2>
            <div className={styles.trio}>
              <EditorialCard eyebrow="Cadrage" title="Partir de l’activité réelle">
                Vos prestations, votre zone, vos véhicules, vos contraintes de déplacement.
              </EditorialCard>
              <EditorialCard eyebrow="Lisibilité" title="Se faire comprendre vite">
                Ce que vous faites, où vous intervenez et comment réserver, en quelques
                secondes.
              </EditorialCard>
              <EditorialCard eyebrow="Suite" title="Ne rien perdre en route">
                Confirmations, rappels, demande d’avis : la suite d’un rendez-vous compte
                autant que le rendez-vous.
              </EditorialCard>
            </div>
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Effets sur l’activité</h2>
            <div className={styles.trio}>
              <OutcomeCard means="Parcours de réservation" result="Moins d’allers-retours avant un rendez-vous">
                Le véhicule, la prestation et l’adresse sont connus avant l’échange.
              </OutcomeCard>
              <OutcomeCard means="Zone d’intervention affichée" result="Moins de demandes hors secteur">
                Le client sait immédiatement si vous vous déplacez chez lui.
              </OutcomeCard>
              <OutcomeCard means="Demande d’avis" result="Des avis récoltés au bon moment">
                Juste après la prestation, quand le client est satisfait.
              </OutcomeCard>
            </div>
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Parcours — six étapes</h2>
            <ul className={styles.sequence}>
              {journey.map((step) => (
                <JourneyStep key={step.number} number={step.number} label={step.label} />
              ))}
            </ul>
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Déroulé d’une collaboration</h2>
            <ol className={styles.timeline}>
              {collaboration.map((step) => (
                <MethodStep key={step.number} number={step.number} title={step.title}>
                  {step.body}
                </MethodStep>
              ))}
            </ol>
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Réalisation</h2>
            <p className={styles.note}>
              `EditorialMedia` n’est pas illustré ici : aucune photographie réelle n’est encore
              disponible dans le dépôt. Le composant exige une image authentique et un texte
              alternatif ; aucun visuel de substitution n’est généré.
            </p>
            <CaseStudyCard
              client="SW Carcleaning"
              title="Un parcours pensé pour le nettoyage à domicile"
              summary="Structuration des prestations et conception du parcours, de la première recherche jusqu’au rendez-vous confirmé."
              deliverables={[
                'Clarification du positionnement',
                'Structuration des prestations',
                'Conception du site',
                'Parcours de réservation',
              ]}
              action={<TextLink href="/realisations">Voir la réalisation</TextLink>}
            />
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Phrase manifeste</h2>
            <QuoteBlock>
              Le problème n’est pas le manque de compétence. C’est l’énergie perdue entre une
              recherche et un rendez-vous confirmé.
            </QuoteBlock>
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Questions fréquentes</h2>
            <FAQAccordion items={faq} />
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Panneau de contact</h2>
            <ContactPanel title="Prendre contact">
              Aucun canal n’est renseigné dans la configuration : le panneau propose l’échange
              plutôt que d’inventer une adresse ou un numéro.
            </ContactPanel>
          </div>
        </Container>
      </Section>

      <Section surface="inverse">
        <Container>
          <CallToAction title="Faites grandir votre activité de nettoyage automobile.">
            {brand.explanation}
          </CallToAction>
        </Container>
      </Section>
    </>
  );
}
