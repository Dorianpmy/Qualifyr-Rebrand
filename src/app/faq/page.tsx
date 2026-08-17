import type { Metadata } from 'next';
import { DarkFooter } from '@/components/agency/DarkFooter';
import { DarkHeader } from '@/components/agency/DarkHeader';
import { CtaSection, FaqSection, SectionHead } from '@/components/agency/DarkVerticalPage';
import { Section } from '@/components/agency/Section';
import { JsonLd } from '@/components/seo/JsonLd';
import { faq as productFaq } from '@/content/faq';
import { geoQna } from '@/content/geo';
import { buildMetadata } from '@/lib/metadata';
import { breadcrumbList, faqPage, webPage } from '@/lib/structured-data';

export const metadata: Metadata = buildMetadata('/faq');

/**
 * Page FAQ — clarté positionnement (GEO) + usage produit.
 *
 * **Deux sources, une seule liste.** `geoQna` (src/content/geo.ts) répond aux
 * questions de positionnement qu'une IA générative doit pouvoir citer
 * mot pour mot (« Qualifyr est-il une agence ou un SaaS ? », « cible-t-il
 * d'autres secteurs ? »). `faq` (src/content/faq.ts) répond aux questions
 * d'usage qu'un visiteur humain se pose avant de s'inscrire. Les deux
 * cohabitaient déjà séparément (l'une sur `/`, l'autre nulle part de dédié) ;
 * cette page est le premier endroit où elles sont réunies et indexables sous
 * une seule URL.
 *
 * **Dédoublonnage par question.** `geoQna` et `faq` partagent une question
 * identique (« À qui s'adresse Qualifyr ? ») : la version `geoQna`, plus
 * courte et plus proche du positionnement obligatoire, est conservée ; la
 * variante `faq` est retirée pour ne pas répéter la même question deux fois
 * sur l'écran.
 */
const geoQuestions = new Set(geoQna.map((item) => item.question));
const items = [...geoQna, ...productFaq.filter((item) => !geoQuestions.has(item.question))];

export default function FaqPage() {
  return (
    <div data-theme="dark" className="bg-ink">
      <JsonLd data={webPage('/faq')} />
      <JsonLd data={faqPage('/faq', items)} />
      <JsonLd
        data={breadcrumbList([
          { name: 'Accueil', path: '/' },
          { name: 'FAQ', path: '/faq' },
        ])}
      />

      <DarkHeader />

      <Section className="pb-4 pt-24 sm:pt-32">
        <SectionHead
          eyebrow="Questions fréquentes"
          title="Questions fréquentes sur Qualifyr"
          lead="Ce qu'est Qualifyr, à qui le SaaS s'adresse, ce qu'il coûte et ce qu'il ne fait pas — pour les laveurs auto à domicile et les professionnels du detailing automobile."
        />
      </Section>

      <FaqSection items={items} />

      <CtaSection
        eyebrow="Une question qui manque ?"
        title="Écrivez-nous directement."
        body="Nous répondons sous 24 à 48 h ouvrées, sans appel commercial surprise."
        primary={{ href: '/nettoyage-automobile', label: 'Essayer Qualifyr' }}
        secondary={{ href: '/contact', label: 'Nous écrire' }}
      />

      <DarkFooter />
    </div>
  );
}
