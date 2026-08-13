import { brand } from '@/content/brand';
import type { BlogArticle } from '@/content/blog';
import { company } from '@/content/company';
import { contact, serviceAreas } from '@/content/contact';
import type { FaqItem } from '@/content/faq';
import { homeSeo, pageMeta, site } from '@/content/site';
import type { VerticalServiceContent } from '@/content/verticals';
import type { Route } from '@/types';

/**
 * Données structurées (JSON-LD).
 *
 * **Uniquement des faits vérifiables.**
 * Recentrées 100 % nettoyage automobile / detailing.
 */

function absolute(path: string): string {
  return new URL(path, site.url).toString();
}

function servedCountries() {
  return serviceAreas.map((area) => ({
    '@type': 'Country',
    name: area,
  }));
}

export function organization() {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ProfessionalService'],
    '@id': `${site.url}/#organization`,
    name: brand.fullName,
    alternateName: brand.name,
    url: absolute('/'),
    description: homeSeo.description,
    logo: absolute('/icons/qualifyr-512.png?v=4'),
    image: absolute('/images/og/qualifyr-og-v3.png'),
    areaServed: servedCountries(),
    knowsAbout: [
      'Entreprises de services',
      'Clarification de l’offre',
      'Identité de marque',
      'Conception de sites web',
      'Parcours de contact',
      'Expérience utilisateur',
      'Nettoyage automobile mobile',
      'Detailing à domicile',
    ],
  };

  if (company.legalName) data.legalName = company.legalName;
  if (company.email) data.email = company.email;
  if (company.phone) data.telephone = company.phone;
  if (company.registrationNumber) data.taxID = company.registrationNumber;
  if (company.vatNumber) data.vatID = company.vatNumber;
  if (contact.social.length > 0) {
    data.sameAs = contact.social.map((network) => network.href);
  }

  return data;
}

export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: brand.fullName,
    url: absolute('/'),
    inLanguage: site.locale,
    description: homeSeo.description,
    publisher: { '@id': `${site.url}/#organization` },
  };
}

/** Page publique, décrite à partir des métadonnées centralisées. */
export function webPage(route: Route) {
  const meta = pageMeta[route];
  const url = absolute(route);
  const isVertical = route === '/nettoyage-automobile';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: meta.title,
    description: meta.description,
    inLanguage: site.locale,
    isPartOf: { '@id': `${site.url}/#website` },
    about: { '@id': `${site.url}/#organization` },
    publisher: { '@id': `${site.url}/#organization` },
    ...(isVertical ? { mainEntity: { '@id': `${url}#service` } } : {}),
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: absolute('/images/og/qualifyr-og-v3.png'),
      width: 1200,
      height: 630,
    },
  };
}

/** Service réellement présenté sur `/creation-site-web`, sans prix ni promesse. */
export function webDesignService() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${site.url}/creation-site-web#service`,
    name: 'Création de site web sur mesure',
    serviceType: 'Conception et création de sites web',
    url: absolute('/creation-site-web'),
    description:
      'Conception de sites web clairs, rapides et adaptés aux besoins réels des entreprises, de la structure des contenus jusqu’à la prise de contact.',
    provider: { '@id': `${site.url}/#organization` },
  };
}

/** Expertise métier réellement présentée, sans prix, résultat ni implantation inventée. */
export function verticalService(content: VerticalServiceContent) {
  const url = absolute(content.route);

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: 'Création de site internet pour nettoyage automobile et detailing',
    serviceType:
      'Création de site internet pour les professionnels du nettoyage automobile mobile et du detailing',
    url,
    description: pageMeta[content.route].description,
    category: ['Nettoyage automobile mobile', 'Detailing à domicile'],
    areaServed: servedCountries(),
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Professionnels du nettoyage automobile mobile et du detailing',
    },
    provider: { '@id': `${site.url}/#organization` },
    mainEntityOfPage: { '@id': `${url}#webpage` },
  };
}

/** Questions et réponses réellement affichées sur une page métier. */
export function faqPage(route: Route, items: readonly FaqItem[]) {
  const url = absolute(route);

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    url,
    inLanguage: site.locale,
    isPartOf: { '@id': `${url}#webpage` },
    about: { '@id': `${url}#service` },
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function blogIndex(articles: readonly BlogArticle[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${site.url}/blog#blog`,
    name: pageMeta['/blog'].title,
    description: pageMeta['/blog'].description,
    url: absolute('/blog'),
    inLanguage: site.locale,
    publisher: { '@id': `${site.url}/#organization` },
    blogPost: articles.map((article) => ({
      '@type': 'BlogPosting',
      headline: article.title,
      url: absolute(`/blog/${article.slug}`),
      datePublished: article.publishedAt,
      author: { '@id': `${site.url}/#organization` },
    })),
  };
}

export function blogPosting(article: BlogArticle) {
  const url = absolute(`/blog/${article.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: article.title,
    description: article.seoDescription,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    inLanguage: site.locale,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    author: { '@id': `${site.url}/#organization` },
    publisher: { '@id': `${site.url}/#organization` },
    isPartOf: { '@id': `${site.url}/blog#blog` },
    image: absolute('/images/og/qualifyr-og-v3.png'),
  };
}

export type Crumb = {
  readonly name: string;
  readonly path: Route;
};

/**
 * Fil d'Ariane structuré.
 * À n'ajouter que sur les pages qui affichent réellement un fil d'Ariane.
 */
export function breadcrumbList(items: readonly Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}
