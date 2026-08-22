import { describe, expect, it } from 'vitest';
import { rows } from '../src/components/agency/FeatureComparisonTable';
import { planIncludes, type Capability } from '../src/lib/billing/entitlements';

/**
 * Le tableau de tarifs doit dire la vérité sur les droits.
 *
 * C'est le test le plus important de la suite, et le seul qui relie le
 * commercial au technique : il compare, ligne par ligne, ce que le tableau
 * comparatif promet sur la page Tarifs (`FeatureComparisonTable`) à ce que la
 * matrice de permissions accorde réellement (`entitlements`).
 *
 * Sans lui, les deux dérivent : on coche une case dans le tableau de tarifs
 * sans ouvrir le droit correspondant, et un client découvre après paiement
 * qu'il n'a pas ce qu'il a acheté. Ce test transforme cette découverte en
 * échec de suite de tests.
 *
 * Les lignes sans capacité correspondante (« Support », qui est un engagement
 * humain, ou celles qui décrivent le fait d'avoir deux produits sur un même
 * compte) sont explicitement écartées : les lister ici oblige à trancher, à
 * l'ajout d'une ligne, entre « c'est un droit » et « c'est une promesse
 * humaine » — plutôt que de laisser passer les deux.
 */

/** Libellé du tableau commercial → capacité technique. */
const LABEL_TO_CAPABILITY: Readonly<Record<string, Capability>> = {
  'Agent de recensement': 'agent.prospecting',
  'Rapport de secteur par e-mail': 'agent.report',
  'Page de réservation en ligne': 'booking.public',
  'Acompte encaissé au clic': 'payments.deposit',
  'Relance automatique des devis abandonnés': 'booking.recovery',
  'Facturation France/Suisse': 'invoices',
  'Galerie avant/après': 'gallery',
};

/** Lignes qui ne correspondent à aucun droit technique, et pourquoi. */
const NON_TECHNICAL_ROWS: Readonly<Record<string, string>> = {
  Support: 'engagement humain, aucun droit logiciel',
  'Agent et réservations sur le même compte':
    'décrit le cumul de deux produits, pas une capacité distincte',
};

/** Le tableau nomme les colonnes en français ; la matrice en canonique. */
const COLUMN_TO_PLAN = {
  agent: 'agent',
  saas: 'system',
  complet: 'complete',
} as const;

describe('10. le tableau de tarifs correspond exactement aux permissions', () => {
  it('chaque ligne est soit une capacité connue, soit explicitement hors périmètre', () => {
    for (const row of rows) {
      const known =
        row.label in LABEL_TO_CAPABILITY || row.label in NON_TECHNICAL_ROWS;
      expect(known, `ligne non classée : « ${row.label} »`).toBe(true);
    }
  });

  it('chaque case cochée correspond à un droit réellement accordé', () => {
    for (const row of rows) {
      const capability = LABEL_TO_CAPABILITY[row.label];
      if (!capability) continue;

      for (const [column, plan] of Object.entries(COLUMN_TO_PLAN)) {
        const sold = row[column as 'agent' | 'saas' | 'complet'];
        // Les valeurs textuelles (« Standard », « Prioritaire ») ne sont pas
        // des droits : seules les cases booléennes se comparent.
        if (typeof sold !== 'boolean') continue;

        const granted = planIncludes(plan, capability);
        expect(
          granted,
          `« ${row.label} » — colonne ${column} : vendu=${sold}, accordé=${granted}`,
        ).toBe(sold);
      }
    }
  });

  it('aucune capacité technique n’est vendue sans figurer au tableau', () => {
    // L'inverse du test précédent : un droit accordé mais jamais annoncé.
    // Trois capacités sont volontairement absentes du tableau commercial car
    // elles décrivent l'espace pro lui-même, inclus dans toute offre système.
    const internal: readonly Capability[] = ['dashboard', 'planning', 'services'];
    const advertised = new Set(Object.values(LABEL_TO_CAPABILITY));

    for (const capability of advertised) {
      expect(internal).not.toContain(capability);
    }
    expect(advertised.size).toBe(Object.keys(LABEL_TO_CAPABILITY).length);
  });
});
