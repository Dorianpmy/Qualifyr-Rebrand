import { describe, expect, it } from 'vitest';

import { estimationOffers, offerById, type OfferId } from '../src/content/estimation-offers';
import { questions, recommend, type Answers } from '../src/lib/estimation';
import { capabilitiesOf, type Capability } from '../src/lib/billing/entitlements';

/**
 * Le parcours d'estimation doit recommander des offres qui existent, à des
 * gens à qui elles servent.
 *
 * **Le test le plus important est le dernier bloc.** Il relie ce que la page
 * promet (`included`) à ce que la matrice de permissions accorde réellement.
 * Sans lui, on ajoute une ligne alléchante à une offre sans ouvrir le droit
 * correspondant, et le client le découvre après avoir payé. C'est exactement
 * le mécanisme de `tests/pricing-matches-entitlements.test.ts`, appliqué à la
 * seconde page qui vend.
 */

/* Réponses complètes minimales, pour n'avoir à faire varier qu'une chose à la
   fois dans chaque cas. Sans base commune, chaque test réécrirait huit
   réponses et la variable réellement testée se perdrait dans le bruit. */
const base: Answers = {
  activity: ['lavage'],
  channels: ['telephone'],
  problems: [],
  priorities: [],
  scope: ['inconnu'],
  volume: ['10-30'],
  budget: ['plus-80'],
  website: ['oui-ameliorer'],
};

describe('questions', () => {
  it('couvre les huit étapes, toutes avec des choix', () => {
    expect(questions).toHaveLength(8);
    for (const question of questions) {
      expect(question.choices.length, `${question.id} sans choix`).toBeGreaterThan(1);
      // Aucun identifiant de choix ne doit être dupliqué : deux `id` identiques
      // rendraient l'un des deux insélectionnable.
      const ids = question.choices.map((c) => c.id);
      expect(new Set(ids).size, `${question.id} a des identifiants en double`).toBe(ids.length);
    }
  });

  it('déclare un champ libre uniquement sur un choix qui existe', () => {
    for (const question of questions) {
      if (!question.freeTextFor) continue;
      expect(
        question.choices.some((c) => c.id === question.freeTextFor),
        `${question.id}.freeTextFor pointe vers un choix inexistant`,
      ).toBe(true);
    }
  });
});

describe('recommandation', () => {
  it('respecte un choix explicite du prospect', () => {
    /*
     * Règle la plus forte du module. Contredire quelqu'un qui vient de
     * désigner une offre détruit la confiance dans tout le reste du résultat.
     */
    const cases: readonly [string, OfferId][] = [
      ['agent', 'agent'],
      ['reservation', 'reservation'],
      ['pack', 'pack'],
      ['complet', 'pack'],
      ['site-vitrine', 'site-vitrine'],
      ['site-reservation', 'site-reservation'],
    ];

    for (const [scope, expected] of cases) {
      expect(recommend({ ...base, scope: [scope] }).offerId, `scope=${scope}`).toBe(expected);
    }
  });

  it('propose le pack quand les deux besoins sont présents', () => {
    const result = recommend({
      ...base,
      problems: ['volume-clients', 'annulations'],
      priorities: ['trouver', 'reserver'],
    });

    expect(result.offerId).toBe('pack');
    expect(result.scores.acquisition).toBeGreaterThanOrEqual(3);
    expect(result.scores.organisation).toBeGreaterThanOrEqual(3);
  });

  it('propose la réservation seule quand seule l’organisation pèse', () => {
    const result = recommend({
      ...base,
      problems: ['annulations', 'devis-manuels'],
      priorities: ['reserver', 'acomptes'],
    });

    expect(result.offerId).toBe('reservation');
  });

  it('propose l’agent seul quand seule la recherche de clients pèse', () => {
    const result = recommend({
      ...base,
      activity: ['flottes'],
      problems: ['volume-clients'],
      priorities: ['trouver'],
    });

    expect(result.offerId).toBe('agent');
  });

  it('rétrograde quand l’offre dépasse le budget déclaré', () => {
    /*
     * Le pack est à 59 €. Avec un plafond à 20 €, on descend vers la moitié
     * la plus utile — ici l'organisation domine, mais la réservation est à
     * 49 €, donc hors budget elle aussi : c'est l'agent, à 17 €, qui reste.
     *
     * Montants et paliers réalignés le 24/08/2026 sur la grille 17/49/59.
     */
    const answers: Answers = {
      ...base,
      problems: ['volume-clients', 'annulations'],
      priorities: ['trouver', 'reserver'],
      budget: ['moins-20'],
    };

    expect(recommend({ ...answers, budget: ['plus-80'] }).offerId).toBe('pack');
    expect(recommend(answers).offerId).toBe('agent');
  });

  it('ne promeut jamais vers une offre plus chère à cause du budget', () => {
    /* Un budget large ne doit pas transformer un besoin simple en pack. */
    const result = recommend({
      ...base,
      activity: ['flottes'],
      problems: ['volume-clients'],
      priorities: ['trouver'],
      budget: ['plus-80'],
    });

    expect(result.offerId).toBe('agent');
  });

  it('ajoute le site en complément, sans remplacer l’abonnement', () => {
    const result = recommend({
      ...base,
      problems: ['annulations', 'visibilite'],
      priorities: ['reserver', 'site-pro'],
      website: ['non'],
    });

    expect(result.offerId).toBe('reservation');
    expect(result.companionOfferId).not.toBeNull();
    expect(['site-vitrine', 'site-reservation']).toContain(result.companionOfferId);
  });

  it('donne toujours une offre qui existe, quelles que soient les réponses', () => {
    /*
     * Balayage : chaque choix de chaque question, seul, ne doit jamais
     * produire une offre inconnue ni faire échouer le calcul. Une réponse
     * inattendue doit dégrader vers une recommandation sûre, pas planter la
     * page au moment où le prospect attend son résultat.
     */
    const known = new Set(estimationOffers.map((o) => o.id));

    for (const question of questions) {
      for (const choice of question.choices) {
        const result = recommend({ [question.id]: [choice.id] });
        expect(known.has(result.offerId), `${question.id}=${choice.id}`).toBe(true);
        expect(result.rationale.length).toBeGreaterThan(20);
      }
    }

    // Aucune réponse du tout : le cas d'un visiteur qui saute tout.
    expect(known.has(recommend({}).offerId)).toBe(true);
  });
});

describe('offres', () => {
  it('affiche un prix pour chacune, mensuel ou ponctuel', () => {
    for (const offer of estimationOffers) {
      const hasPrice = offer.monthly !== null || offer.oneOff !== null;
      expect(hasPrice, `${offer.id} sans prix`).toBe(true);
      // Jamais les deux : un montant mensuel ET un montant unique sur la même
      // ligne se lit comme un piège, et aucune offre n'en a besoin.
      expect(offer.monthly !== null && offer.oneOff !== null, `${offer.id} a deux prix`).toBe(
        false,
      );
    }
  });

  it('dit toujours ce qui n’est pas inclus', () => {
    /*
     * Une offre présentée uniquement par ses qualités prépare la déception à
     * la première facture. Cette règle est ce qui distingue la page
     * d'estimation d'une page de vente.
     */
    for (const offer of estimationOffers) {
      expect(offer.included.length, `${offer.id} sans inclusions`).toBeGreaterThan(0);
      expect(offer.excluded.length, `${offer.id} sans exclusions`).toBeGreaterThan(0);
    }
  });

  it('ne promet que des capacités réellement accordées par le plan', () => {
    /** Promesse commerciale → capacité technique. */
    const PROMISE_TO_CAPABILITY: Readonly<Record<string, Capability>> = {
      'Recensement des entreprises d’une zone à partir du répertoire officiel':
        'agent.prospecting',
      'Un rapport de secteur envoyé par e-mail': 'agent.report',
      'Page de réservation en ligne à votre nom': 'booking.public',
      'Acompte encaissé au moment de la réservation': 'payments.deposit',
      'Planning et prestations': 'planning',
      Factures: 'invoices',
      'Galerie avant/après': 'gallery',
      'Relance automatique des devis abandonnés': 'booking.recovery',
    };

    for (const offer of estimationOffers) {
      if (offer.plan === null) continue;
      const granted = capabilitiesOf(offer.plan);

      for (const promise of offer.included) {
        const capability = PROMISE_TO_CAPABILITY[promise];
        // Les lignes sans capacité (« Tout le système de réservation », « un
        // seul abonnement ») décrivent un cumul, pas un droit distinct.
        if (!capability) continue;

        expect(
          granted.includes(capability),
          `L’offre « ${offer.name} » promet « ${promise} » mais le plan « ${offer.plan} » n’accorde pas « ${capability} ».`,
        ).toBe(true);
      }
    }
  });

  it('lie chaque offre à abonnement à un plan connu, et l’inverse', () => {
    expect(offerById.agent.plan).toBe('agent');
    expect(offerById.reservation.plan).toBe('system');
    expect(offerById.pack.plan).toBe('complete');
    // Les prestations d'agence n'ont pas d'abonnement : leur associer un plan
    // ouvrirait un accès qu'elles ne vendent pas.
    expect(offerById['site-vitrine'].plan).toBeNull();
    expect(offerById['site-reservation'].plan).toBeNull();
  });
});
