import { brand } from '@/content/brand';
import { company } from '@/content/company';
import { site } from '@/content/site';
import type { Route } from '@/types';

/**
 * Données structurées (JSON-LD).
 *
 * **Uniquement des faits vérifiables.** Trois types sont autorisés :
 * `Organization`, `WebSite`, `BreadcrumbList`.
 *
 * Interdits, et pour de bonnes raisons :
 * — `SoftwareApplication` : Qualifyr ne vend pas de logiciel ;
 * — `Product` / `Offer` : aucun tarif n'existe ;
 * — `AggregateRating`, `Review` : aucun avis n'a été recueilli ;
 * — `LocalBusiness` : aucune adresse n'est confirmée, et en inventer une pour
 *   obtenir un encart serait une fausse déclaration ;
 * — `FAQPage` : réservé à des cas d'usage restreints, et sans intérêt ici.
 *
 * Toute propriété dont la valeur est inconnue est **omise**, jamais devinée.
 */

function absolute(path: string): string {
  return new URL(path, site.url).toString();
}

export function organization() {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: brand.fullName,
    alternateName: brand.name,
    url: site.url,
    description: brand.descriptor,
    logo: absolute('/images/og/qualifyr-og.png'),
    image: absolute('/images/og/qualifyr-og.png'),
    // Le métier servi, sans revendiquer d'implantation géographique.
    knowsAbout: [
      'Nettoyage automobile mobile',
      'Detailing à domicile',
      'Parcours client',
      'Prise de rendez-vous',
    ],
  };

  // Ajoutées uniquement si elles existent réellement dans company.ts.
  if (company.legalName) data.legalName = company.legalName;
  if (company.email) data.email = company.email;
  if (company.phone) data.telephone = company.phone;
  if (company.registrationNumber) data.taxID = company.registrationNumber;
  if (company.vatNumber) data.vatID = company.vatNumber;

  return data;
}

export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: brand.fullName,
    url: site.url,
    inLanguage: site.locale,
    description: brand.descriptor,
    publisher: { '@id': `${site.url}/#organization` },
  };
}

export type Crumb = {
  readonly name: string;
  readonly path: Route;
};

/**
 * Fil d'Ariane structuré.
 * À n'ajouter que sur les pages qui affichent réellement un fil d'Ariane :
 * les données structurées doivent refléter ce que voit le visiteur.
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
