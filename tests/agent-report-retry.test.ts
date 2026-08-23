import { describe, expect, it } from 'vitest';

import {
  MAX_REPORT_AGE_MS,
  buildReportErrorMessage,
  nextReportState,
} from '../src/lib/agent/report-retry';

/**
 * `/api/agent/process` marquait une zone `termine` même quand son rapport
 * n'était jamais parti — le professionnel ne recevait rien, et rien ne le
 * retentait. `nextReportState` porte désormais cette décision, séparée de la
 * route pour être testable sans réseau ni base : voir son commentaire d'en-
 * tête pour pourquoi le plafond se mesure en temps écoulé, pas en nombre de
 * tentatives.
 */

const NOW = new Date('2026-08-24T12:00:00Z');

describe('nextReportState — total nul', () => {
  it('est une fin normale, jamais un échec', () => {
    const result = nextReportState({
      total: 0,
      reportSent: false,
      previousAttempts: 0,
      previousFirstFailedAt: null,
      now: NOW,
    });
    expect(result).toEqual({ status: 'termine', reportAttempts: 0, reportFirstFailedAt: null });
  });

  it('reste une fin normale même si des tentatives précédentes existaient', () => {
    // Cas impossible en pratique (agent_prospects n'est jamais vidé), mais la
    // fonction doit rester sûre par construction, pas seulement par chance.
    const result = nextReportState({
      total: 0,
      reportSent: false,
      previousAttempts: 4,
      previousFirstFailedAt: '2026-08-20T00:00:00Z',
      now: NOW,
    });
    expect(result.status).toBe('termine');
    expect(result.reportFirstFailedAt).toBeNull();
  });
});

describe('nextReportState — envoi réussi', () => {
  it('termine et efface le compteur d’horloge, même après des échecs précédents', () => {
    const result = nextReportState({
      total: 5,
      reportSent: true,
      previousAttempts: 3,
      previousFirstFailedAt: '2026-08-23T12:00:00Z',
      now: NOW,
    });
    expect(result).toEqual({ status: 'termine', reportAttempts: 3, reportFirstFailedAt: null });
  });
});

describe('nextReportState — échec d’envoi', () => {
  it('première tentative : pose l’horloge à maintenant, reste en attente', () => {
    const result = nextReportState({
      total: 5,
      reportSent: false,
      previousAttempts: 0,
      previousFirstFailedAt: null,
      now: NOW,
    });
    expect(result).toEqual({
      status: 'rapport_en_attente',
      reportAttempts: 1,
      reportFirstFailedAt: NOW.toISOString(),
    });
  });

  it('ne déplace jamais l’horloge une fois posée', () => {
    const firstFailure = '2026-08-24T00:00:00Z'; // douze heures avant NOW
    const result = nextReportState({
      total: 5,
      reportSent: false,
      previousAttempts: 6,
      previousFirstFailedAt: firstFailure,
      now: NOW,
    });
    expect(result.reportFirstFailedAt).toBe(firstFailure);
    expect(result.reportAttempts).toBe(7);
    expect(result.status).toBe('rapport_en_attente');
  });

  it('juste avant le plafond de 24h : encore en attente', () => {
    const almostCapped = new Date(NOW.getTime() - (MAX_REPORT_AGE_MS - 1)).toISOString();
    const result = nextReportState({
      total: 5,
      reportSent: false,
      previousAttempts: 1,
      previousFirstFailedAt: almostCapped,
      now: NOW,
    });
    expect(result.status).toBe('rapport_en_attente');
  });

  it('au plafond de 24h pile : passe en échec', () => {
    const exactlyCapped = new Date(NOW.getTime() - MAX_REPORT_AGE_MS).toISOString();
    const result = nextReportState({
      total: 5,
      reportSent: false,
      previousAttempts: 1,
      previousFirstFailedAt: exactlyCapped,
      now: NOW,
    });
    expect(result.status).toBe('echec');
  });

  it('au-delà du plafond : passe en échec, quel que soit le nombre de tentatives', () => {
    const longAgo = new Date(NOW.getTime() - MAX_REPORT_AGE_MS * 5).toISOString();
    const result = nextReportState({
      total: 5,
      reportSent: false,
      previousAttempts: 1,
      previousFirstFailedAt: longAgo,
      now: NOW,
    });
    expect(result.status).toBe('echec');
  });

  it('n’atteint jamais le plafond sur la seule base du nombre de tentatives', () => {
    // Le défaut corrigé : un compteur seul aurait fait dépendre le délai réel
    // du débit de la file des renvois. Une seule tentative, horloge posée à
    // l'instant présent : encore en attente, peu importe combien de fois la
    // zone a déjà été vue.
    const result = nextReportState({
      total: 5,
      reportSent: false,
      previousAttempts: 200,
      previousFirstFailedAt: NOW.toISOString(),
      now: NOW,
    });
    expect(result.status).toBe('rapport_en_attente');
  });
});

describe('buildReportErrorMessage', () => {
  it('renvoie null sans erreur de scan ni échec d’envoi', () => {
    expect(
      buildReportErrorMessage({ scanErrors: [], sendFailureReason: null, capped: false, attempts: 0 }),
    ).toBeNull();
  });

  it('ne remplace jamais un échec d’envoi réel par null sous prétexte qu’il n’y a pas d’erreur de scan', () => {
    // Le cas qui a motivé cette fonction : sur un renvoi, `scanErrors` est
    // toujours vide (l'analyse n'est pas rejouée) — une version naïve aurait
    // écrit `null` alors que l'envoi échoue toujours.
    const message = buildReportErrorMessage({
      scanErrors: [],
      sendFailureReason: 'BOOKING_FROM_EMAIL manquante en production',
      capped: false,
      attempts: 2,
    });
    expect(message).toBe('BOOKING_FROM_EMAIL manquante en production');
  });

  it('combine erreurs de scan et échec d’envoi quand les deux existent', () => {
    const message = buildReportErrorMessage({
      scanErrors: ['segment loueurs: délai dépassé'],
      sendFailureReason: 'RESEND_API_KEY manquante',
      capped: false,
      attempts: 1,
    });
    expect(message).toBe('segment loueurs: délai dépassé | RESEND_API_KEY manquante');
  });

  it('ajoute la mention d’abandon uniquement quand le plafond est atteint', () => {
    const message = buildReportErrorMessage({
      scanErrors: [],
      sendFailureReason: 'échec Resend : rate_limited',
      capped: true,
      attempts: 40,
    });
    expect(message).toContain('échec Resend : rate_limited');
    expect(message).toMatch(/abandon après 40/);
  });
});
