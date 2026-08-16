import { describe, expect, it } from 'vitest';
import {
  buildDirectWhatsAppMessage,
  buildWhatsAppUrl,
} from '@/lib/whatsapp';

describe('message WhatsApp direct', () => {
  it('reste court et ne simule aucun diagnostic', () => {
    expect(buildDirectWhatsAppMessage()).toBe(
      'Bonjour, je souhaite discuter de mon projet avec Qualifyr.',
    );
  });

  it('encode le texte et refuse un numéro invalide', () => {
    const message = buildDirectWhatsAppMessage('/contact');
    const url = buildWhatsAppUrl('+33 7 63 66 48 57', message);
    expect(url).toMatch(/^https:\/\/wa\.me\/33763664857\?text=/);
    expect(url).toContain(encodeURIComponent(message));
    expect(buildWhatsAppUrl('', message)).toBeNull();
    expect(buildWhatsAppUrl('abc', message)).toBeNull();
  });
});
