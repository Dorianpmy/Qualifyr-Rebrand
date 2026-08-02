import { describe, expect, it } from 'vitest';
import {
  buildDirectWhatsAppMessage,
  buildDiagnosticWhatsAppMessage,
  buildWhatsAppUrl,
} from '@/lib/whatsapp';

describe('message WhatsApp direct', () => {
  it('reste court et ne simule aucun diagnostic', () => {
    expect(buildDirectWhatsAppMessage()).toBe(
      'Bonjour, je souhaite discuter de mon projet avec Qualifyr.',
    );
  });
});

describe('message WhatsApp du diagnostic', () => {
  const message = buildDiagnosticWhatsAppMessage({
    activity: 'Conciergerie',
    activityDetails: '',
    company: 'Maison Camille',
    website: '',
    siteSituation: 'Je n’ai pas encore de site',
    demandSources: ['Google', 'Recommandation / bouche-à-oreille'],
    situationNote: 'Les demandes sont souvent incomplètes.',
    priorities: ['Clarifier mon offre', 'Créer un nouveau site'],
    desiredResult: 'Recevoir des demandes mieux renseignées.',
    timing: 'Dans un à trois mois',
    budget: 'Pas encore',
    constraints: '',
    firstName: 'Camille',
    preferredContact: 'WhatsApp',
  });

  it('génère un résumé lisible sans ligne facultative vide', () => {
    expect(message).toContain('demande de diagnostic Qualifyr');
    expect(message).toContain('Priorités : Clarifier mon offre, Créer un nouveau site');
    expect(message).toContain('Canaux actuels : Google, Recommandation / bouche-à-oreille');
    expect(message).toContain('Frein principal : Les demandes sont souvent incomplètes.');
    expect(message).toContain('Entreprise : Maison Camille');
    expect(message).not.toContain('Site :');
    expect(message).not.toContain('Contrainte :');
  });

  it('encode le texte et refuse un numéro invalide', () => {
    const url = buildWhatsAppUrl('+33 7 63 66 48 57', message);
    expect(url).toMatch(/^https:\/\/wa\.me\/33763664857\?text=/);
    expect(url).toContain(encodeURIComponent('demande de diagnostic Qualifyr'));
    expect(buildWhatsAppUrl('', message)).toBeNull();
    expect(buildWhatsAppUrl('abc', message)).toBeNull();
  });
});
