/* eslint-disable no-console -- ce script a précisément pour sortie la console du terminal. */
import { campaignLinks } from '../src/content/campaign-links.ts';
import { productionUrl } from '../src/content/site.ts';

for (const [name, destination] of Object.entries(campaignLinks)) {
  const url = new URL(destination, productionUrl);
  console.log([
    `Nom : ${name}`,
    `Lien court : ${productionUrl}/go/${name}`,
    `Destination : ${url.pathname}`,
    `utm_source : ${url.searchParams.get('utm_source') ?? ''}`,
    `utm_medium : ${url.searchParams.get('utm_medium') ?? ''}`,
    `utm_campaign : ${url.searchParams.get('utm_campaign') ?? ''}`,
  ].join('\n'));
  console.log('');
}
