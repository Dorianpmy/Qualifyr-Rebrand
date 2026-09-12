import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

/**
 * `isValidPaypalLink` — filtre d'hôte pour le lien PayPal personnel du
 * professionnel (docs/18-options-paiement-acompte.md §0.3).
 *
 * Ce n'est volontairement pas une vérification d'identité ni de propriété du
 * compte : juste un rejet des liens qui ne pointent manifestement pas vers
 * PayPal, puisque ce lien est ensuite montré comme cliquable à un client
 * final qui n'a aucune raison de le remettre en question.
 */
describe('isValidPaypalLink', () => {
  it('accepte un lien paypal.me', async () => {
    const { isValidPaypalLink } = await import('../src/lib/detailing/paypal-link');
    expect(isValidPaypalLink('https://paypal.me/dupontauto')).toBe(true);
  });

  it('accepte un lien paypal.com (avec ou sans www)', async () => {
    const { isValidPaypalLink } = await import('../src/lib/detailing/paypal-link');
    expect(isValidPaypalLink('https://www.paypal.com/paypalme/dupontauto')).toBe(true);
    expect(isValidPaypalLink('https://paypal.com/paypalme/dupontauto')).toBe(true);
  });

  it('refuse un autre domaine, même avec « paypal » dans le nom', async () => {
    const { isValidPaypalLink } = await import('../src/lib/detailing/paypal-link');
    expect(isValidPaypalLink('https://paypal.com.faux-site.fr/dupontauto')).toBe(false);
    expect(isValidPaypalLink('https://not-paypal.me/dupontauto')).toBe(false);
  });

  it('refuse le http non chiffré', async () => {
    const { isValidPaypalLink } = await import('../src/lib/detailing/paypal-link');
    expect(isValidPaypalLink('http://paypal.me/dupontauto')).toBe(false);
  });

  it('refuse une chaîne qui n’est pas une URL', async () => {
    const { isValidPaypalLink } = await import('../src/lib/detailing/paypal-link');
    expect(isValidPaypalLink('dupontauto')).toBe(false);
    expect(isValidPaypalLink('')).toBe(false);
  });
});
