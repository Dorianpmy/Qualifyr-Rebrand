import { Section } from './Section';

/**
 * Comment ça marche — le parcours d'une réservation, en maquettes.
 *
 * **Pourquoi des maquettes et pas des paragraphes.** Un laveur ne lit pas une
 * description de produit ; il reconnaît un écran. Montrer le devis qui
 * s'affiche, le créneau qui se bloque et la fiche qui arrive dans l'agenda
 * fait comprendre le produit en trois secondes, là où trois paragraphes
 * demandent un effort que personne ne fournit sur une page de vente.
 *
 * **Aucun nom d'agent ici.** Cette section décrit ce qui se passe entre un
 * client et un professionnel. Introduire un nom de produit à cet endroit
 * ajoute une chose à comprendre au moment précis où l'on cherche à en
 * retirer.
 */

function Frame({
  step,
  label,
  children,
}: {
  readonly step: string;
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <figure className="m-0 grid gap-4">
      <div className="flex items-center gap-3">
        <span className="text-[0.8125rem] tabular-nums tracking-[0.1em] text-faint">{step}</span>
        <span className="h-px flex-1 bg-hairline" />
        <span className="text-[0.8125rem] font-medium text-muted">{label}</span>
      </div>
      {/* La maquette est une carte, pas une capture : elle reste nette à toute
          taille et ne vieillit pas quand l'interface bouge. */}
      <div className="surface-card p-5">{children}</div>
    </figure>
  );
}

export function HowItWorks() {
  return (
    <Section labelledBy="how-title" className="py-24">
        <header className="mx-auto mb-14 max-w-[46rem] text-center">
          <p className="mb-2 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
            Comment ça marche
          </p>
          <h2 id="how-title" className="mb-4 text-section">
            Trois écrans entre un curieux et un acompte encaissé.
          </h2>
          <p className="text-xl leading-[1.6] text-muted">
            Le client décrit son véhicule, voit son prix, choisit son heure. Vous ne faites rien —
            et la fiche vous attend.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-3 lg:gap-6">
          <Frame step="01" label="Il décrit son véhicule">
            <div className="grid gap-2.5">
              {[
                { size: 'Citadine', hint: 'Clio, 208, Twingo' },
                { size: 'Berline', hint: 'Golf, 308, Mégane' },
                { size: 'SUV / break', hint: 'Qashqai, 3008, Tiguan', on: true },
              ].map((row) => (
                <div
                  key={row.size}
                  className={`rounded-[10px] border p-3 ${
                    row.on ? 'border-white bg-white/[0.06]' : 'border-hairline'
                  }`}
                >
                  <p className="text-[0.9375rem] font-medium">{row.size}</p>
                  <p className="text-[0.8125rem] text-faint">{row.hint}</p>
                </div>
              ))}
            </div>
          </Frame>

          <Frame step="02" label="Le prix s’affiche">
            <div className="grid gap-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.8125rem] uppercase tracking-[0.04em] text-faint">
                  Estimation
                </span>
                <span className="text-[2rem] font-bold tabular-nums leading-none">289 €</span>
              </div>
              <div className="grid gap-2 border-t border-hairline pt-4 text-[0.875rem]">
                {[
                  ['Complet · SUV', '240 €'],
                  ['Poils et taches', '+ 49 €'],
                  ['Durée annoncée', '4 h'],
                ].map(([left, right]) => (
                  <div key={left} className="flex justify-between text-muted">
                    <span>{left}</span>
                    <span className="tabular-nums">{right}</span>
                  </div>
                ))}
              </div>
              <p className="text-[0.8125rem] text-faint">
                Montant ferme. Aucun devis à attendre.
              </p>
            </div>
          </Frame>

          <Frame step="03" label="Le créneau est bloqué">
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-2">
                {['09:00', '11:30', '14:00', '16:30', '18:00', '—'].map((slot, index) => (
                  <span
                    key={slot + index}
                    className={`rounded-full border px-2 py-2 text-center text-[0.8125rem] tabular-nums ${
                      index === 2
                        ? 'border-white bg-white font-medium text-ink'
                        : slot === '—'
                          ? 'border-hairline text-faint'
                          : 'border-hairline text-muted'
                    }`}
                  >
                    {slot}
                  </span>
                ))}
              </div>
              <div className="grid gap-1 border-t border-hairline pt-4">
                <p className="text-[0.9375rem] font-medium">Acompte 87 € encaissé</p>
                <p className="text-[0.8125rem] text-faint">
                  Le créneau est tenu. Annulation gratuite jusqu’à 24 h avant.
                </p>
              </div>
            </div>
          </Frame>
        </div>
    </Section>
  );
}
