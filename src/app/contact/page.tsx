import type { Metadata } from 'next';
import Link from 'next/link';

import { Section } from '@/components/agency/Section';
import { WhatsAppDirectButton } from '@/components/agency/WhatsAppDirectButton';
import { DarkPageShell } from '@/components/editorial/DarkPageShell';
import { EditorialHeader } from '@/components/editorial/EditorialHeader';
import { ContactForm } from '@/components/form/ContactForm';
import { JsonLd } from '@/components/seo/JsonLd';

import { contact, contactPage } from '@/content/contact';
import { breadcrumbList } from '@/lib/structured-data';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata('/contact');

/**
 * Nous écrire — refonte à la charte sombre (22/08/2026).
 *
 * **`ContactForm` n'a pas été réécrit, et c'est délibéré.** Il porte quatre
 * choses qui fonctionnent et qu'il aurait fallu dupliquer : la validation
 * partagée avec le serveur (`contactSchema`, le même schéma des deux côtés),
 * le déplacement du focus sur la première erreur, l'impossibilité d'un double
 * envoi, et l'anti-spam — un champ piège invisible plus un temps minimal de
 * remplissage. Le formulaire envoie réellement à `POST /api/contact`, qui
 * valide à nouveau, limite le débit et renvoie 503 si aucun transport d'e-mail
 * n'est configuré.
 *
 * Sa mise en couleur sombre passe par le conteneur `.dark-form`, qui redéfinit
 * les jetons hérités — voir `tailwind.css`. Zéro ligne du composant modifiée.
 *
 * **Aucun délai de réponse n'est annoncé.** La page précédente n'en promettait
 * pas non plus, pour une raison qui n'a pas changé : il ne serait pas tenable
 * aujourd'hui. Annoncer « réponse sous 24 h » et ne pas s'y tenir coûte plus
 * cher que de ne rien annoncer.
 */
export default function ContactPage() {
  return (
    <DarkPageShell breadcrumb="Nous écrire">
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'Contact', path: '/contact' },
        ])}
      />

      <EditorialHeader
        eyebrow={contactPage.eyebrow}
        title={contactPage.title}
        lead={contactPage.lead}
      />

      <Section className="border-t border-hairline py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
          <div className="max-w-[36rem]">
            <h2 className="mb-2 text-[1.375rem] font-bold leading-[1.2] tracking-[-0.02em] text-primary">
              {contactPage.briefTitle}
            </h2>
            <p className="mb-8 text-[0.9375rem] leading-[1.7] text-muted">
              {contactPage.briefLead}
            </p>

            {/* `.dark-form` : voir le commentaire en tête de fichier. */}
            <div className="dark-form">
              <ContactForm />
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="mb-2 text-[1.0625rem] font-bold tracking-[-0.02em] text-primary">
              {contactPage.directTitle}
            </h2>
            <p className="mb-5 text-[0.875rem] leading-[1.6] text-muted">
              {contactPage.directLead}
            </p>

            <div className="grid gap-3">
              <WhatsAppDirectButton
                ctaId="contact_whatsapp"
                variant="secondary"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-hairline px-5 text-[0.875rem] font-semibold !text-primary no-underline transition-colors duration-150 hover:bg-white/[0.04]"
              >
                Discuter sur WhatsApp
              </WhatsAppDirectButton>

              {/* Aucun canal n'est inventé : `contact.email` et
                  `contact.phone` valent `null` tant qu'ils ne sont pas
                  confirmés, et la ligne disparaît alors proprement. */}
              {contact.email ? (
                <a
                  href={contact.email.href}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-hairline px-5 text-[0.875rem] !text-muted no-underline transition-colors duration-150 hover:!text-primary hover:bg-white/[0.04]"
                >
                  {contact.email.value}
                </a>
              ) : null}

              {contact.phone ? (
                <a
                  href={contact.phone.href}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-hairline px-5 text-[0.875rem] !text-muted no-underline transition-colors duration-150 hover:!text-primary hover:bg-white/[0.04]"
                >
                  {contact.phone.value}
                </a>
              ) : null}
            </div>

            <p className="mt-6 text-[0.8125rem] leading-[1.6] text-faint">
              Les informations transmises servent uniquement à répondre à votre demande. Voir la{' '}
              <Link
                href="/politique-de-confidentialite"
                className="!text-faint underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:!text-muted"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </aside>
        </div>
      </Section>
    </DarkPageShell>
  );
}
