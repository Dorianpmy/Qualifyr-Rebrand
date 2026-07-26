import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/editorial/SectionHeading';
import { ContactForm } from '@/components/form/ContactForm';
import { TextLink } from '@/components/ui/TextLink';

import { availableChannels, contactPage } from '@/content/contact';
import { buildMetadata } from '@/lib/metadata';
import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/contact');

/**
 * Page Contact.
 *
 * Les coordonnées viennent de `src/content/contact.ts` et **seules les valeurs
 * réellement configurées sont affichées**. Aucun délai de réponse n'est
 * annoncé : il ne serait pas tenable aujourd'hui. Aucun calendrier public
 * n'est intégré tant qu'aucun n'est configuré.
 */
export default function ContactPage() {
  const channels = availableChannels();

  return (
    <Section spacing="tight">
      <Container>
        <SectionHeading
          level={1}
          split
          eyebrow={contactPage.eyebrow}
          title={contactPage.title}
          lead={contactPage.lead}
        />

        <div className={styles.layout}>
          <div className={styles.aside}>
            <div className={styles.orient}>
              <p>
                Si vous souhaitez que nous regardions votre activité en détail, passez plutôt
                par le <TextLink href="/diagnostic">diagnostic</TextLink> : les questions y
                sont plus précises et l’échange qui suit est plus utile.
              </p>
              <p>{contactPage.orientationSuffix}</p>
            </div>

            {channels.length > 0 ? (
              <div className={styles.channels}>
                {channels.map((channel) => (
                  <div key={channel.href} className={styles.channel}>
                    <span className={styles.channelLabel}>{channel.label}</span>
                    <span className={styles.channelValue}>
                      <TextLink externalHref={channel.href}>{channel.value}</TextLink>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.channels}>
                <p className={styles.noChannel}>{contactPage.noChannel}</p>
              </div>
            )}
          </div>

          <ContactForm />
        </div>
      </Container>
    </Section>
  );
}
