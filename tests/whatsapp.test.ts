import { describe, expect, it } from 'vitest';
import {
  buildClientWhatsAppMessage,
  buildDirectWhatsAppMessage,
  buildWhatsAppUrl,
  isValidWhatsAppNumber,
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

describe('message WhatsApp client → professionnel', () => {
  it("nomme le professionnel, jamais Qualifyr", () => {
    const message = buildClientWhatsAppMessage('SW Carcleaning');
    expect(message).toContain('SW Carcleaning');
    expect(message).not.toContain('Qualifyr');
  });
});

describe('validité d’un numéro WhatsApp', () => {
  it('accepte un numéro exploitable, quel que soit son format de saisie', () => {
    expect(isValidWhatsAppNumber('+41 77 904 31 21')).toBe(true);
    expect(isValidWhatsAppNumber('0033763664857')).toBe(true);
  });

  it('refuse un numéro trop court, trop long, vide ou absent', () => {
    expect(isValidWhatsAppNumber('123')).toBe(false);
    expect(isValidWhatsAppNumber('1234567890123456')).toBe(false);
    expect(isValidWhatsAppNumber('')).toBe(false);
    expect(isValidWhatsAppNumber(null)).toBe(false);
    expect(isValidWhatsAppNumber(undefined)).toBe(false);
  });
});
