export const campaignLinks = {
  instagram: '/diagnostic?utm_source=instagram&utm_medium=organic&utm_campaign=profil',
  tiktok: '/diagnostic?utm_source=tiktok&utm_medium=organic&utm_campaign=profil',
  linkedin: '/diagnostic?utm_source=linkedin&utm_medium=organic&utm_campaign=profil',
  'prospection-nettoyage': '/nettoyage-automobile?utm_source=prospection&utm_medium=dm&utm_campaign=nettoyage_auto',
  'prospection-conciergerie': '/conciergerie?utm_source=prospection&utm_medium=dm&utm_campaign=conciergerie',
  'preuve-sw': '/realisations/sw-car-cleaning?utm_source=prospection&utm_medium=dm&utm_campaign=preuve_sw',
  partenaire: '/diagnostic?utm_source=partenaire&utm_medium=referral&utm_campaign=partenaires',
} as const;

export type CampaignSlug = keyof typeof campaignLinks;

export function isCampaignSlug(value: string): value is CampaignSlug {
  return Object.prototype.hasOwnProperty.call(campaignLinks, value);
}
