import { describe, expect, it } from 'vitest';
import {
  clean,
  contactSchema,
  fieldErrors,
  MIN_ELAPSED_MS,
} from '@/lib/validation';

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
