'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Section } from './Section';

/**
 * Tableau comparatif — Qualifyr face aux alternatives réelles.
 *
 * **Pourquoi ce bloc manquait.** La page expliquait ce que fait le produit,
 * jamais ce qu'il fait *de plus*. Or le detailer ne part pas de zéro : il a
 * déjà Instagram, un carnet, un logiciel de rendez-vous généraliste. Tant
 * qu'on ne nomme pas ces solutions, il compare le prix de Qualifyr à zéro —
 * et zéro gagne toujours.
 *
 * **Les colonnes sont des catégories, pas des marques.** Nommer un concurrent
 * lui fait de la publicité auprès de gens qui ne le connaissaient pas, et
 * expose à devoir défendre chaque case si sa fiche change demain. « Un
 * logiciel de rendez-vous » se vérifie sans procès.
 *
 * **Aucune colonne n'est vide sur toute sa hauteur.** Un tableau où le
 * concurrent perd partout n'est pas lu comme une comparaison mais comme une
 * publicité — et le lecteur cherche alors ce qu'on lui cache. Instagram gagne
 * sur la découverte, le logiciel généraliste sur le prix : c'est vrai, et le
 * reconnaître rend crédibles les lignes où l'on gagne.
 *
 * **Traitement mobile : un tableau qui défile assume qu'il défile.**
 * `overflow-x-auto` seul laissait deviner qu'il manquait du contenu — la
 * colonne suivante coupée à mi-mot, sans indice que c'est volontaire. Trois
 * ajouts, repris de la référence envoyée, rendent le défilement lisible
 * plutôt que subi : une icône par ligne (le tableau se parcourt aussi à la
 * verticale, d'un coup d'œil, sans lire chaque intitulé), un fondu sur le
 * bord droit qui fait du texte coupé un indice plutôt qu'un accident, et une
 * piste de défilement sous le tableau qui montre la position — les trois
 * disparaissent d'eux-mêmes dès que le tableau tient sans défiler (à partir
 * de `lg`), calculés depuis le défilement réel plutôt que posés en dur.
 */

type Support = 'yes' | 'no' | 'partial';

type Row = {
  readonly label: string;
  readonly qualifyr: Support;
  readonly social: Support;
  readonly generic: Support;
};

const rows: readonly Row[] = [
  {
    label: 'Vous fait découvrir par de nouveaux clients',
    qualifyr: 'yes',
    social: 'yes',
    generic: 'no',
  },
  {
    label: 'Affiche un prix ferme selon le véhicule et son état',
    qualifyr: 'yes',
    social: 'no',
    generic: 'partial',
  },
  {
    label: 'Encaisse un acompte au moment de la réservation',
    qualifyr: 'yes',
    social: 'no',
    generic: 'partial',
  },
  {
    label: 'Calcule la distance et le coût du déplacement',
    qualifyr: 'yes',
    social: 'no',
    generic: 'no',
  },
  {
    label: 'Connaît le métier : formules, état réel, accès eau et courant',
    qualifyr: 'yes',
    social: 'no',
    generic: 'no',
  },
  {
    label: 'Va chercher des clients pendant que vous travaillez',
    qualifyr: 'yes',
    social: 'no',
    generic: 'no',
  },
  {
    label: 'Facture aux normes françaises et suisses',
    qualifyr: 'yes',
    social: 'no',
    generic: 'partial',
  },
  {
    label: 'Ne coûte rien',
    qualifyr: 'no',
    social: 'yes',
    generic: 'no',
  },
];

/* Une icône par ligne, dans l'ordre de `rows` ci-dessus. Traits simples,
   cohérents avec `Lock()` dans `AgentGrid.tsx` : `viewBox="0 0 24 24"`,
   aucun remplissage, un seul poids de trait. */
const rowIcons: readonly (() => ReactNode)[] = [
  () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M19.5 19.5 15 15" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.3 3.5H6a2.5 2.5 0 0 0-2.5 2.5v5.3a2.5 2.5 0 0 0 .73 1.77l8.7 8.7a2.5 2.5 0 0 0 3.54 0l5.06-5.06a2.5 2.5 0 0 0 0-3.54l-8.7-8.7a2.5 2.5 0 0 0-1.5-.73Z" />
      <circle cx="8.3" cy="8.3" r="1.1" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12.5" rx="2.2" />
      <path d="M3 10.3h18" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21.2s7-7.4 7-12.3a7 7 0 1 0-14 0c0 4.9 7 12.3 7 12.3Z" />
      <circle cx="12" cy="8.9" r="2.4" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.2 6.4a4 4 0 0 0-5.4 5.3L3.5 18l2.5 2.5 6.3-6.3a4 4 0 0 0 5.3-5.4l-2.6 2.6-2.3-2.3 2.5-2.7Z" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21v-8.2" />
      <path d="M8.4 15.7a5.1 5.1 0 0 1 7.2 0" />
      <path d="M5.3 12.5a9.3 9.3 0 0 1 13.4 0" />
      <circle cx="12" cy="12.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 3h8l3.5 3.5V21h-11.5Z" />
      <path d="M9 9.3h6M9 12.8h6M9 16.3h3.3" />
    </svg>
  ),
  () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6.9 17.1 17.1 6.9" />
    </svg>
  ),
];

function Mark({ value, strong }: { readonly value: Support; readonly strong: boolean }) {
  if (value === 'yes') {
    return (
      <svg
        viewBox="0 0 16 16"
        role="img"
        aria-label="Oui"
        className="mx-auto size-[1.15rem] fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
        style={{ stroke: strong ? 'var(--accent-2)' : 'rgba(255,255,255,0.32)' }}
      >
        <path d="M3 8.5l3.2 3.2L13 4.8" />
      </svg>
    );
  }

  if (value === 'partial') {
    /* Un tiret et non une demi-coche : « partiellement » se comprend mieux en
       lisant la légende qu'en devinant un symbole intermédiaire. */
    return (
      <span role="img" aria-label="Partiellement" className="mx-auto block text-faint">
        —
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      role="img"
      aria-label="Non"
      className="mx-auto size-[0.95rem] fill-none stroke-white/15 [stroke-linecap:round] [stroke-width:2]"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function CompareSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ hasOverflow: false, ratio: 1, progress: 0 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setScrollState({
        hasOverflow: max > 4,
        ratio: el.clientWidth / el.scrollWidth,
        progress: max > 4 ? el.scrollLeft / max : 0,
      });
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  return (
    <Section labelledBy="compare-title" className="border-t border-hairline py-24">
      <header className="mx-auto mb-12 max-w-[46rem] text-center">
        <p className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
          La différence
        </p>
        <h2
          id="compare-title"
          className="mb-5 text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold leading-[1.16] tracking-[-0.025em] text-primary"
        >
          Vous avez déjà des solutions. Voilà ce qu’elles ne font pas.
        </h2>
        <p className="mx-auto max-w-[36rem] text-[1.0625rem] leading-[1.65] text-muted">
          Instagram vous fait connaître et un logiciel de rendez-vous bloque des créneaux. Aucun des
          deux ne sait ce que coûte un intérieur de SUV plein de poils de chien.
        </p>
      </header>

      {/* `overflow-x-auto` : sur un téléphone, quatre colonnes ne tiennent pas.
          Le tableau défile latéralement plutôt que de comprimer les libellés
          en colonnes de deux caractères. Le fondu et la piste ci-dessous
          rendent ce défilement visible plutôt que découvert par accident. */}
      <div className="relative mx-auto max-w-[58rem]">
        <div ref={scrollRef} className="overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-start">
          <thead>
            <tr>
              <th className="w-[38%] pb-4 text-start text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-faint">
                <span className="sr-only">Fonctionnalité</span>
              </th>
              {/* La colonne Qualifyr porte le seul contour dégradé du tableau —
                  elle doit se lire comme la réponse, pas comme une option.
                  Céladon seul, sans le sable (`--accent-1`) : cette teinte se
                  lit orange sur un écran réel (déjà constaté sur le halo du
                  hero), et un tableau comparatif n'est pas l'endroit pour
                  cette couleur-là. */}
              <th
                scope="col"
                className="rounded-t-xl border border-b-0 border-transparent px-3 py-3 text-[0.875rem] font-bold text-primary"
                style={{
                  background:
                    'linear-gradient(#121213, #121213) padding-box, linear-gradient(140deg, var(--accent-2), transparent 60%, var(--accent-2)) border-box',
                }}
              >
                Qualifyr
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-[0.875rem] font-semibold text-muted"
              >
                Instagram et messages
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-[0.875rem] font-semibold text-muted"
              >
                Logiciel de rendez-vous
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const RowIcon = rowIcons[index];
              return (
                <tr key={row.label} className="border-t border-hairline">
                  {/* Couleur posée en `style`, pas via `text-muted` : ce
                      libellé a été vu rendu en sable/orange en production
                      alors que la classe utilitaire vaut un gris neutre en
                      source — même symptôme que les icônes de
                      `BeforeAfterSection` plus haut dans le projet, une
                      classe qui cesse de s'appliquer sans cause identifiée.
                      Une couleur écrite en dur ne laisse plus de prise à ce
                      genre de perte silencieuse. */}
                  <th
                    scope="row"
                    className="py-3.5 pr-4 text-start text-[0.875rem] font-normal leading-[1.45]"
                    style={{ color: '#9a9a9c' }}
                  >
                    <span className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-faint [&_svg]:size-[0.95rem]">
                        {RowIcon ? <RowIcon /> : null}
                      </span>
                      <span className="pt-0.5">{row.label}</span>
                    </span>
                  </th>
                  <td
                    className={`border-x border-transparent px-3 py-3.5 text-center ${
                      index === rows.length - 1 ? 'rounded-b-xl border-b' : ''
                    }`}
                    style={{
                      background:
                        'linear-gradient(#121213, #121213) padding-box, linear-gradient(140deg, var(--accent-2), transparent 60%, var(--accent-2)) border-box',
                    }}
                  >
                    <Mark value={row.qualifyr} strong />
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <Mark value={row.social} strong={false} />
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <Mark value={row.generic} strong={false} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>

        {/* Fondu : le bord droit coupe une colonne en plein milieu quand il
            reste du défilement à faire — sans lui, ça ressemble à une mise en
            page cassée plutôt qu'à une invitation à glisser. Disparaît de
            lui-même une fois arrivé au bout. */}
        {scrollState.hasOverflow && scrollState.progress < 0.98 ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-12 rounded-r-xl"
            style={{ background: 'linear-gradient(to right, transparent, var(--color-ink))' }}
          />
        ) : null}
      </div>

      {/* Piste de défilement : position réelle, pas un décor. Absente tant
          que le tableau tient sans défiler (à partir de `lg` en pratique). */}
      {scrollState.hasOverflow ? (
        <div className="mx-auto mt-4 h-[3px] w-full max-w-[58rem] overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div
            className="h-full rounded-full bg-white/45"
            style={{
              width: `${Math.max(scrollState.ratio * 100, 8)}%`,
              marginLeft: `${scrollState.progress * (1 - Math.max(scrollState.ratio, 0.08)) * 100}%`,
            }}
          />
        </div>
      ) : null}

      <p className="mx-auto mt-8 max-w-[40rem] text-center text-[0.8125rem] leading-[1.6] text-faint">
        « — » signale une fonction partielle : présente, mais sans connaître les formules ni les
        véhicules. La dernière ligne est là parce qu’elle est vraie — Instagram ne vous coûte rien,
        et c’est son seul avantage décisif.
      </p>
    </Section>
  );
}
