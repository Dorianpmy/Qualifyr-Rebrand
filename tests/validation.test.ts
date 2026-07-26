import { describe, expect, it } from 'vitest';
import {
  clean,
  contactSchema,
  diagnosticSchema,
  fieldErrors,
  MIN_ELAPSED_MS,
} from '@/lib/validation';

/** Jeu de données valide, réutilisé et modifié champ par champ. */
const validDiagnostic = {
  activity: 'nettoyage-auto-mobile',
  activityDetails: 'Citadines et utilitaires légers.',
  fullName: 'Camille Rousseau',
  company: 'Éclat Mobile',
  email: 'camille@eclat-mobile.fr',
  phone: '06 12 34 56 78',
  area: 'Lille et 20 km autour',
  website: 'https://eclat-mobile.fr',
  seniority: '1-3-ans',
  bookingMethods: ['telephone', 'whatsapp'],
  priority: 'simplifier-reservations',
  blocker: 'Trop d’allers-retours par message avant de fixer un rendez-vous.',
  message: '',
  consent: true,
  fax: '',
  elapsedMs: 9000,
  pageUrl: 'https://qualifyragence.com/diagnostic',
};

const validContact = {
  fullName: 'Camille Rousseau',
  email: 'camille@eclat-mobile.fr',
  company: '',
  message: 'Bonjour, j’aimerais comprendre comment vous travaillez.',
  consent: true,
  fax: '',
  elapsedMs: 9000,
  pageUrl: 'https://qualifyragence.com/contact',
};

describe('clean', () => {
  it('retire les caractères de contrôle', () => {
    expect(clean('a\u0000b\u001Fc')).toBe('abc');
  });

  it('normalise les espaces et coupe aux bornes', () => {
    expect(clean('  Éclat    Mobile  ')).toBe('Éclat Mobile');
  });

  it('tronque à la taille maximale', () => {
    expect(clean('x'.repeat(50), 10)).toHaveLength(10);
  });

  it('renvoie une chaîne vide pour une valeur non textuelle', () => {
    expect(clean(42)).toBe('');
    expect(clean(null)).toBe('');
    expect(clean(undefined)).toBe('');
  });
});

describe('diagnosticSchema — cas valide', () => {
  it('accepte un jeu complet', () => {
    const result = diagnosticSchema.safeParse(validDiagnostic);
    expect(result.success).toBe(true);
  });

  it('nettoie et normalise les valeurs', () => {
    const result = diagnosticSchema.safeParse({
      ...validDiagnostic,
      fullName: '  Camille   Rousseau ',
      email: '  CAMILLE@Eclat-Mobile.FR ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe('Camille Rousseau');
      expect(result.data.email).toBe('camille@eclat-mobile.fr');
    }
  });

  it('accepte les champs facultatifs vides', () => {
    const result = diagnosticSchema.safeParse({
      ...validDiagnostic,
      phone: '',
      website: '',
      message: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('diagnosticSchema — champs obligatoires', () => {
  const required = [
    'activity',
    'fullName',
    'company',
    'email',
    'area',
    'seniority',
    'priority',
    'blocker',
  ] as const;

  for (const field of required) {
    it(`refuse un « ${field} » vide`, () => {
      const result = diagnosticSchema.safeParse({ ...validDiagnostic, [field]: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(Object.keys(fieldErrors(result.error))).toContain(field);
      }
    });
  }

  it('refuse une liste de méthodes de réservation vide', () => {
    const result = diagnosticSchema.safeParse({ ...validDiagnostic, bookingMethods: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).bookingMethods).toBeDefined();
    }
  });

  it('refuse une méthode de réservation inconnue', () => {
    const result = diagnosticSchema.safeParse({
      ...validDiagnostic,
      bookingMethods: ['pigeon-voyageur'],
    });
    expect(result.success).toBe(false);
  });

  it('refuse un objectif prioritaire inconnu', () => {
    const result = diagnosticSchema.safeParse({ ...validDiagnostic, priority: 'autre' });
    expect(result.success).toBe(false);
  });
});

describe('diagnosticSchema — consentement', () => {
  it('refuse une case décochée', () => {
    const result = diagnosticSchema.safeParse({ ...validDiagnostic, consent: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).consent).toBeDefined();
    }
  });
});

describe('validation de l’e-mail', () => {
  const invalid = ['pas-un-email', 'a@', '@domaine.fr', 'a b@domaine.fr', ''];

  for (const value of invalid) {
    it(`refuse « ${value || '(vide)'} »`, () => {
      const result = contactSchema.safeParse({ ...validContact, email: value });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(fieldErrors(result.error).email).toBeDefined();
      }
    });
  }

  it('accepte une adresse valide', () => {
    const result = contactSchema.safeParse({ ...validContact, email: 'a.b+c@domaine.fr' });
    expect(result.success).toBe(true);
  });
});

describe('tailles maximales', () => {
  it('tronque un message trop long au lieu de le rejeter', () => {
    const result = contactSchema.safeParse({
      ...validContact,
      message: 'x'.repeat(5000),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toHaveLength(2000);
    }
  });

  it('borne le nom', () => {
    const result = contactSchema.safeParse({ ...validContact, fullName: 'x'.repeat(500) });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName.length).toBeLessThanOrEqual(120);
    }
  });
});

describe('URL facultative', () => {
  it('accepte une adresse vide', () => {
    expect(diagnosticSchema.safeParse({ ...validDiagnostic, website: '' }).success).toBe(
      true,
    );
  });

  it('refuse une adresse incomplète', () => {
    const result = diagnosticSchema.safeParse({ ...validDiagnostic, website: 'eclat' });
    expect(result.success).toBe(false);
  });
});

describe('anti-spam', () => {
  it('accepte le champ piège vide', () => {
    const result = contactSchema.safeParse({ ...validContact, fax: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fax).toBe('');
  });

  it('laisse passer la validation quand le champ piège est rempli', () => {
    // Le rejet est décidé côté serveur, pas par le schéma : cela permet de
    // répondre « ok » au robot sans lui indiquer ce qui l'a trahi.
    const result = contactSchema.safeParse({ ...validContact, fax: 'https://spam.example' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fax).not.toBe('');
  });

  it('expose un seuil de temps minimal cohérent', () => {
    expect(MIN_ELAPSED_MS).toBeGreaterThan(0);
    expect(MIN_ELAPSED_MS).toBeLessThan(30_000);
  });

  it('refuse un temps écoulé négatif', () => {
    const result = contactSchema.safeParse({ ...validContact, elapsedMs: -1 });
    expect(result.success).toBe(false);
  });
});

describe('fieldErrors', () => {
  it('renvoie des messages français lorsque des champs requis sont absents', () => {
    const result = contactSchema.safeParse({ email: 'nope' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.fullName).toBe('Indiquez votre prénom et votre nom.');
      expect(errors.message).toBe('Écrivez votre message (10 caractères minimum).');
      expect(errors.consent).toBe(
        'Votre accord est nécessaire pour que nous puissions vous répondre.',
      );
      expect(errors.elapsedMs).toBe('Le formulaire doit être affiché avant son envoi.');
      expect(Object.values(errors).join(' ')).not.toContain('Invalid input');
    }
  });

  it('ne garde que la première erreur par champ', () => {
    const result = contactSchema.safeParse({
      ...validContact,
      fullName: '',
      email: 'nope',
      message: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(Object.keys(errors).sort()).toEqual(['email', 'fullName', 'message']);
      for (const message of Object.values(errors)) {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      }
    }
  });
});
