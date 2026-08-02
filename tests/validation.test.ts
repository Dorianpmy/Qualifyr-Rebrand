import { describe, expect, it } from 'vitest';
import {
  clean,
  contactSchema,
  diagnosticSchema,
  diagnosticStepSchemas,
  fieldErrors,
  MIN_ELAPSED_MS,
} from '@/lib/validation';

const validDiagnostic = {
  activity: 'nettoyage-detailing',
  activityDetails: '',
  practiceMode: 'domicile',
  conciergeType: '',
  company: 'Éclat Mobile',
  website: 'https://eclat-mobile.fr',
  siteSituation: 'site-decale',
  demandSources: ['recommandation', 'whatsapp'],
  situationNote: 'Les demandes sont souvent incomplètes.',
  priorities: ['clarifier-offre', 'prise-contact'],
  desiredResult: 'Recevoir des demandes plus précises.',
  timing: 'un-trois-mois',
  budgetStatus: 'pas-encore',
  budgetAmount: '',
  constraints: '',
  firstName: 'Camille',
  lastName: 'Rousseau',
  email: 'camille@eclat-mobile.fr',
  phone: '06 12 34 56 78',
  preferredContact: 'whatsapp',
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
  it('retire les caractères de contrôle et normalise les espaces', () => {
    expect(clean('  Éclat\u0000    Mobile  ')).toBe('Éclat Mobile');
  });

  it('borne les contenus et ignore les valeurs non textuelles', () => {
    expect(clean('x'.repeat(50), 10)).toHaveLength(10);
    expect(clean(null)).toBe('');
  });
});

describe('diagnosticSchema', () => {
  it('accepte et nettoie une demande complète', () => {
    const result = diagnosticSchema.safeParse({
      ...validDiagnostic,
      firstName: '  Camille ',
      email: '  CAMILLE@Eclat-Mobile.FR ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('Camille');
      expect(result.data.email).toBe('camille@eclat-mobile.fr');
    }
  });

  it('accepte une attribution bornée et refuse les champs inconnus', () => {
    const accepted = diagnosticSchema.safeParse({
      ...validDiagnostic,
      attribution: {
        firstTouch: {
          source: 'instagram',
          medium: 'organic',
          campaign: 'profil',
          landingPath: `/diagnostic?${'x'.repeat(700)}`,
        },
      },
    });
    expect(accepted.success).toBe(true);
    if (accepted.success) {
      expect(accepted.data.attribution?.firstTouch?.landingPath?.length).toBeLessThanOrEqual(500);
    }

    expect(diagnosticSchema.safeParse({
      ...validDiagnostic,
      attribution: { firstTouch: { email: 'interdit@example.fr' } },
    }).success).toBe(false);
  });

  it('accepte les champs facultatifs vides', () => {
    expect(diagnosticSchema.safeParse({
      ...validDiagnostic,
      website: '',
      phone: '',
      desiredResult: '',
      constraints: '',
    }).success).toBe(true);
  });

  for (const field of ['activity', 'company', 'siteSituation', 'timing', 'budgetStatus', 'firstName', 'email', 'preferredContact'] as const) {
    it(`refuse un « ${field} » vide`, () => {
      const result = diagnosticSchema.safeParse({ ...validDiagnostic, [field]: '' });
      expect(result.success).toBe(false);
      if (!result.success) expect(fieldErrors(result.error)[field]).toBeDefined();
    });
  }

  it('refuse une activité autre sans précision', () => {
    const result = diagnosticSchema.safeParse({
      ...validDiagnostic,
      activity: 'autre-service',
      activityDetails: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).activityDetails).toBeDefined();
  });

  it('accepte la précision facultative du nettoyage automobile', () => {
    const result = diagnosticSchema.safeParse({ ...validDiagnostic, practiceMode: '' });
    expect(result.success).toBe(true);
  });

  it('accepte le type de conciergerie facultatif', () => {
    const result = diagnosticSchema.safeParse({
      ...validDiagnostic,
      activity: 'conciergerie',
      practiceMode: '',
      conciergeType: '',
    });
    expect(result.success).toBe(true);
  });

  it('refuse une précision conditionnelle inconnue lorsqu’elle est renseignée', () => {
    const result = diagnosticSchema.safeParse({ ...validDiagnostic, practiceMode: 'valeur-inconnue' });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).practiceMode).toBeDefined();
  });

  it('accepte une autre entreprise de services renseignée', () => {
    expect(diagnosticSchema.safeParse({
      ...validDiagnostic,
      activity: 'autre-service',
      practiceMode: '',
      activityDetails: 'Photographe culinaire',
    }).success).toBe(true);
  });

  it('limite les choix multiples', () => {
    expect(diagnosticSchema.safeParse({ ...validDiagnostic, demandSources: [] }).success).toBe(false);
    expect(diagnosticSchema.safeParse({ ...validDiagnostic, priorities: [] }).success).toBe(false);
    expect(diagnosticSchema.safeParse({
      ...validDiagnostic,
      priorities: ['clarifier-offre', 'prise-contact', 'nouveau-site'],
    }).success).toBe(false);
  });

  it('borne les réponses libres aux limites éditoriales', () => {
    const result = diagnosticSchema.safeParse({
      ...validDiagnostic,
      situationNote: 'x'.repeat(500),
      constraints: 'x'.repeat(900),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.situationNote).toHaveLength(400);
      expect(result.data.constraints).toHaveLength(700);
    }
  });

  it('valide chaque étape indépendamment', () => {
    const slices = [
      validDiagnostic,
      validDiagnostic,
      validDiagnostic,
      validDiagnostic,
      validDiagnostic,
    ];
    diagnosticStepSchemas.forEach((schema, index) => {
      expect(schema.safeParse(slices[index]).success).toBe(true);
    });
  });

  it('refuse un consentement absent', () => {
    const result = diagnosticSchema.safeParse({ ...validDiagnostic, consent: false });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).consent).toBeDefined();
  });

  it('normalise un domaine sans protocole', () => {
    const result = diagnosticSchema.safeParse({ ...validDiagnostic, website: 'eclat-mobile.fr' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.website).toBe('https://eclat-mobile.fr');
  });

  it('refuse un domaine incomplet', () => {
    expect(diagnosticSchema.safeParse({ ...validDiagnostic, website: 'eclat' }).success).toBe(false);
  });
});

describe('validation partagée et anti-spam', () => {
  it('refuse les e-mails invalides', () => {
    for (const value of ['pas-un-email', 'a@', '@domaine.fr', '']) {
      const result = contactSchema.safeParse({ ...validContact, email: value });
      expect(result.success).toBe(false);
    }
  });

  it('borne un message long', () => {
    const result = contactSchema.safeParse({ ...validContact, message: 'x'.repeat(5000) });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.message).toHaveLength(2000);
  });

  it('conserve le piège pour que le serveur décide du rejet silencieux', () => {
    const result = contactSchema.safeParse({ ...validContact, fax: 'https://spam.example' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fax).not.toBe('');
  });

  it('expose un délai cohérent et refuse une durée négative', () => {
    expect(MIN_ELAPSED_MS).toBeGreaterThan(0);
    expect(MIN_ELAPSED_MS).toBeLessThan(30_000);
    expect(contactSchema.safeParse({ ...validContact, elapsedMs: -1 }).success).toBe(false);
  });

  it('produit des erreurs françaises adressables par champ', () => {
    const result = contactSchema.safeParse({ email: 'nope' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.fullName).toBeDefined();
      expect(errors.email).toBeDefined();
    }
  });
});
