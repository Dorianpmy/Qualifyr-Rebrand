import { describe, expect, it } from 'vitest';
import { campaignLinks, isCampaignSlug } from '@/content/campaign-links';
import { hasCampaign, mergeAttribution, touchFromLocation } from '@/lib/attribution';
import type { AnalyticsEventName } from '@/lib/analytics';
import { GET } from '@/app/go/[campaign]/route';

describe('liens de campagne', () => {
  it('reste une liste blanche aux destinations attendues', () => {
    expect(campaignLinks).toEqual({
      instagram: '/contact?utm_source=instagram&utm_medium=organic&utm_campaign=profil',
      tiktok: '/contact?utm_source=tiktok&utm_medium=organic&utm_campaign=profil',
      linkedin: '/contact?utm_source=linkedin&utm_medium=organic&utm_campaign=profil',
      'prospection-nettoyage': '/nettoyage-automobile?utm_source=prospection&utm_medium=dm&utm_campaign=nettoyage_auto',
      partenaire: '/contact?utm_source=partenaire&utm_medium=referral&utm_campaign=partenaires',
    });
    expect(isCampaignSlug('instagram')).toBe(true);
    expect(isCampaignSlug('https://example.com')).toBe(false);
  });

  it('redirige chaque lien court vers sa destination interne exacte', async () => {
    for (const [campaign, destination] of Object.entries(campaignLinks)) {
      const response = await GET(
        new Request(`https://qualifyragence.com/go/${campaign}`),
        { params: Promise.resolve({ campaign }) },
      );
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        new URL(destination, 'https://qualifyragence.com').toString(),
      );
    }
  });

  it('renvoie tout slug inconnu vers l’accueil sans redirection ouverte', async () => {
    const response = await GET(
      new Request('https://qualifyragence.com/go/https:%2F%2Fexample.com'),
      { params: Promise.resolve({ campaign: 'https://example.com' }) },
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://qualifyragence.com/');
  });
});

describe('attribution de session', () => {
  it('capture uniquement les UTM permis, le référent externe et le chemin', () => {
    const touch = touchFromLocation(
      'https://qualifyragence.com/contact?utm_source=instagram&utm_medium=organic&utm_campaign=profil&email=non',
      'https://google.fr/search',
      new Date('2026-08-02T10:00:00.000Z'),
    );
    expect(touch).toMatchObject({
      source: 'instagram',
      medium: 'organic',
      campaign: 'profil',
      referrerDomain: 'google.fr',
      firstSeenAt: '2026-08-02T10:00:00.000Z',
    });
    expect(JSON.stringify(touch)).not.toContain('email');
    expect(hasCampaign(touch)).toBe(true);
  });

  it('préserve le premier contact et remplace le dernier lors d’une nouvelle campagne', () => {
    const first = touchFromLocation('https://qualifyragence.com/?utm_source=instagram');
    const second = touchFromLocation('https://qualifyragence.com/contact?utm_source=partenaire');
    const result = mergeAttribution(mergeAttribution(undefined, first), second);
    expect(result.firstTouch?.source).toBe('instagram');
    expect(result.lastTouch?.source).toBe('partenaire');
  });

  it('ne remplace pas le dernier contact lors d’une simple navigation interne', () => {
    const campaign = touchFromLocation('https://qualifyragence.com/?utm_source=instagram');
    const internal = touchFromLocation('https://qualifyragence.com/contact');
    const result = mergeAttribution(mergeAttribution(undefined, campaign), internal);
    expect(result.firstTouch?.source).toBe('instagram');
    expect(result.lastTouch?.source).toBe('instagram');
  });

  it('nettoie et limite les valeurs sans conserver les paramètres personnels', () => {
    const touch = touchFromLocation(
      `https://qualifyragence.com/contact?utm_source=${encodeURIComponent(`\u0000${'x'.repeat(200)}`)}&phone=0612345678`,
    );
    expect(touch.source).toHaveLength(80);
    expect(touch.source).not.toContain('\u0000');
    expect(touch.landingPath).not.toContain('phone');
  });

  it('reste sans erreur face à une URL invalide', () => {
    expect(() => touchFromLocation('pas une url')).not.toThrow();
    expect(touchFromLocation('pas une url').landingPath).toBeUndefined();
  });
});

describe('contrat de mesure', () => {
  it('expose les événements commerciaux attendus sans données personnelles', () => {
    const events: AnalyticsEventName[] = [
      'page_specialisee_viewed', 'case_study_viewed',
      'estimation_started', 'estimation_completed',
      'booking_opened', 'whatsapp_direct_opened', 'campaign_redirect_used',
    ];
    expect(events).toHaveLength(7);
  });
});
