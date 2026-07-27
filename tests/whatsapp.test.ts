import { describe, expect, it } from 'vitest';
import { buildWhatsAppMessage } from '@/lib/whatsapp';

describe('buildWhatsAppMessage', () => {
  it('génère la demande structurée et omet les champs facultatifs vides', () => {
    const message = buildWhatsAppMessage({
      activity: 'Conciergerie',
      situation: 'J’ai déjà un site à améliorer',
      need: 'Mieux qualifier mes demandes',
      objective: 'Recevoir des demandes plus précises',
      timing: 'Dans les trois prochains mois',
      firstName: 'Camille',
      company: 'Maison Camille',
      website: '',
      detail: '',
    });

    expect(message).toBe(
      'Bonjour, je souhaite discuter de mon projet avec Qualifyr.\n\n' +
      'Activité : Conciergerie\n' +
      'Situation actuelle : J’ai déjà un site à améliorer\n' +
      'Besoin principal : Mieux qualifier mes demandes\n' +
      'Objectif : Recevoir des demandes plus précises\n' +
      'Démarrage souhaité : Dans les trois prochains mois\n' +
      'Entreprise : Maison Camille\n' +
      'Prénom : Camille',
    );
  });
});
