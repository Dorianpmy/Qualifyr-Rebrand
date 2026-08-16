import type { Metadata } from 'next';

import { WhatsAppDirectButton } from '@/components/agency/WhatsAppDirectButton';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ContactForm } from '@/components/form/ContactForm';
import { ButtonAnchor } from '@/components/ui/Button';

import { contact, contactPage } from '@/content/contact';
import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/contact');

/**
 * Page Contact.
 *
 * Les coordonnées viennent de `src/content/contact.ts`. Aucun délai de réponse
 * n'est annoncé : il ne serait pas tenable aujourd'hui.
 */
export default function ContactPage() {
  return (
    <Section spacing="flush" className={styles.page}>
      <Container>
        <div className={styles.hero}>
          <p className={styles.eyebrow}>{contactPage.eyebrow}</p>
          <h1>{contactPage.title}</h1>
          <p className={styles.heroLead}>{contactPage.lead}</p>
        </div>

        <div className={styles.contactStage}>
          <section className={styles.brief} aria-labelledby="contact-brief-title">
            <div className={styles.briefHeading}>
              <div>
                <span className={styles.sectionNumber}>01</span>
                <h2 id="contact-brief-title">{contactPage.briefTitle}</h2>
              </div>
              <p>{contactPage.briefLead}</p>
            </div>

            <ContactForm className={styles.contactForm} />
          </section>

          <aside className={styles.direct} aria-labelledby="contact-direct-title">
            <div className={styles.directHeading}>
              <span className={styles.sectionNumber}>02</span>
              <h2 id="contact-direct-title">{contactPage.directTitle}</h2>
              <p>{contactPage.directLead}</p>
            </div>

            <div className={styles.directOptions}>
              <article className={styles.directCard}>
                <span className={styles.cardIndex}>01</span>
                <h3>WhatsApp</h3>
                <p>Pour ouvrir une conversation et expliquer votre besoin simplement.</p>
                <WhatsAppDirectButton
                  variant="inverseSecondary"
                  withArrow
                  className={styles.cardAction}
                >
                  Écrire sur WhatsApp
                </WhatsAppDirectButton>
              </article>

              {contact.email ? (
                <article className={styles.directCard}>
                  <span className={styles.cardIndex}>02</span>
                  <h3>E-mail</h3>
                  <p>Pour détailler votre demande ou joindre des informations utiles.</p>
                  <ButtonAnchor
                    href={contact.email.href}
                    variant="inverseSecondary"
                    withArrow
                    className={styles.cardAction}
                  >
                    Écrire un e-mail
                  </ButtonAnchor>
                </article>
              ) : null}
            </div>

            <p className={styles.confidentiality}>
              Vos informations servent uniquement à répondre à votre demande.
            </p>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
