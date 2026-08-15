/**
 * Différences France / Suisse, rassemblées en un seul endroit.
 *
 * **Pourquoi un module plutôt que des `if country === 'CH'` dans les pages.**
 * Un professionnel suisse n'est pas un professionnel français avec une autre
 * devise : la TVA n'est pas la même, le code postal a quatre chiffres et non
 * cinq, l'indicatif est +41, et le franc s'écrit avant le montant. Ces quatre
 * règles apparaissent dans le tunnel, dans le dashboard, dans les e-mails et
 * sur les factures. Éparpillées, l'une d'elles finit toujours par être oubliée
 * — et une facture suisse portant « TVA 20 % » n'est pas une coquille, c'est
 * un document non conforme.
 *
 * Tout est ici, sans dépendance à React, donc utilisable aussi bien dans un
 * composant client que dans la génération serveur des PDF.
 */

export type Country = 'FR' | 'CH';

export type CountryProfile = {
  readonly country: Country;
  readonly label: string;
  /** Code ISO utilisé par `Intl.NumberFormat`. */
  readonly currency: 'EUR' | 'CHF';
  readonly locale: 'fr-FR' | 'fr-CH';
  /** Taux normal de TVA, en pourcentage. */
  readonly vatRate: number;
  /** Nom exact de la taxe sur les documents officiels. */
  readonly vatLabel: string;
  readonly postalDigits: number;
  readonly postalLabel: string;
  readonly phonePrefix: string;
  readonly phonePlaceholder: string;
  /**
   * Arrondi d'affichage. La Suisse n'a plus de pièce de 1 ni 2 centimes : un
   * montant en espèces se règle au multiple de 5 centimes le plus proche. Sur
   * des prix de prestation toujours entiers, la règle ne mord pas aujourd'hui,
   * mais elle mordra dès la première remise en pourcentage.
   */
  readonly cashRounding: number;
};

export const countryProfiles: Record<Country, CountryProfile> = {
  FR: {
    country: 'FR',
    label: 'France',
    currency: 'EUR',
    locale: 'fr-FR',
    vatRate: 20,
    vatLabel: 'TVA',
    postalDigits: 5,
    postalLabel: 'Code postal',
    phonePrefix: '+33',
    phonePlaceholder: '06 12 34 56 78',
    cashRounding: 0.01,
  },
  CH: {
    country: 'CH',
    label: 'Suisse',
    currency: 'CHF',
    locale: 'fr-CH',
    vatRate: 8.1,
    vatLabel: 'TVA',
    postalDigits: 4,
    postalLabel: 'NPA',
    phonePrefix: '+41',
    phonePlaceholder: '079 123 45 67',
    cashRounding: 0.05,
  },
};

/**
 * Résout un profil depuis une valeur de base éventuellement absente.
 *
 * La France est le défaut parce que c'est le marché existant : une fiche créée
 * avant l'ajout de la colonne doit continuer à afficher des euros, pas des
 * francs.
 */
export function profileFor(country: string | null | undefined): CountryProfile {
  return country === 'CH' ? countryProfiles.CH : countryProfiles.FR;
}

/**
 * Montant lisible par un client.
 *
 * `Intl` place le symbole selon la convention locale — « 289 € » en France,
 * « CHF 289.00 » en Suisse — ce qu'aucune concaténation manuelle ne fait
 * correctement dans les deux cas.
 */
export function formatMoney(value: number, profile: CountryProfile): string {
  return new Intl.NumberFormat(profile.locale, {
    style: 'currency',
    currency: profile.currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

/** Arrondi au plus petit échelon monétaire du pays. */
export function roundToCash(value: number, profile: CountryProfile): number {
  const step = profile.cashRounding;
  return Math.round(value / step) * step;
}

/** Part de TVA contenue dans un montant TTC. */
export function vatShare(grossValue: number, profile: CountryProfile): number {
  return grossValue - grossValue / (1 + profile.vatRate / 100);
}

/**
 * Validation du code postal.
 *
 * Volontairement limitée à la longueur : un NPA suisse va de 1000 à 9999 et un
 * code postal français de 01000 à 98890, mais les listes exhaustives changent
 * et un client bloqué par un code postal pourtant valide est un client perdu.
 * Le professionnel voit l'adresse et corrigera si besoin.
 */
export function isValidPostal(value: string, profile: CountryProfile): boolean {
  const digits = value.trim();
  return new RegExp(`^\\d{${profile.postalDigits}}$`).test(digits);
}
