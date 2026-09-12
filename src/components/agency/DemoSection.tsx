'use client';

import { useState } from 'react';
import { Section } from './Section';

/**
 * Démo vivante du tunnel de réservation.
 *
 * **Pourquoi une démo réelle et pas une capture d'écran.** Le professionnel
 * n'achète pas une page de réservation, il achète la certitude que son client
 * ira jusqu'au bout tout seul. Une capture montre à quoi ça ressemble ; seule
 * une démo qu'on manipule montre que c'est faisable. C'est aussi la meilleure
 * réponse à l'objection silencieuse — « mes clients ne sauront pas s'en
 * servir » : il essaie lui-même, en trente secondes.
 *
 * **Le tunnel est chargé dans une iframe, pas réimplémenté.** Une maquette
 * séparée finirait par diverger du produit réel, et la démo mentirait sans que
 * personne s'en aperçoive. Ici c'est `/embed/demo`, exactement ce que verront
 * ses clients.
 *
 * **L'iframe ne se charge qu'au clic.** Elle embarque une page complète, ses
 * polices et son JavaScript ; la charger d'office ajouterait tout cela au poids
 * d'une page d'accueil que la plupart des visiteurs quitteront avant d'y
 * arriver. L'affiche statique donne l'envie, le clic paie le coût.
 *
 * **Le cadre est un téléphone, délibérément.** Les clients du detailer
 * réservent depuis leur téléphone ; montrer le tunnel dans une fenêtre de
 * bureau donnerait une idée fausse de l'écran sur lequel il se joue.
 */

export function DemoSection() {
  const [started, setStarted] = useState(false);

  return (
    <Section labelledBy="demo-title" className="border-t border-hairline py-24">
      <header className="mx-auto mb-12 max-w-[46rem] text-center">
        <p className="mb-2 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
          Le tunnel de réservation
        </p>
        <h2
          id="demo-title"
          className="mb-4 text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold leading-[1.12] tracking-[-0.025em] text-primary"
        >
          Essayez-le comme le ferait votre client.
        </h2>
        <p className="mx-auto max-w-[36rem] text-[1.0625rem] leading-[1.65] text-muted">
          C’est le vrai tunnel, pas une maquette. Choisissez un véhicule, une formule, un créneau —
          et regardez le prix se calculer pendant que vous avancez.
        </p>
      </header>

      <div className="flex justify-center">
        {/* Le cadre du téléphone. `p-2` et les coins très arrondis suffisent à
            évoquer l'appareil : dessiner une encoche et des boutons ferait
            entrer un objet illustré dans une charte qui n'en contient aucun. */}
        <div
          className="w-full max-w-[24rem] rounded-[2.25rem] border border-transparent p-2"
          style={{
            background:
              'linear-gradient(#141416, #141416) padding-box, linear-gradient(140deg, var(--accent-1), transparent 50%, var(--accent-2)) border-box',
          }}
        >
          <div className="relative overflow-hidden rounded-[1.75rem] bg-[#0e0e0f]">
            {started ? (
              <iframe
                src="/embed/demo"
                title="Démonstration du tunnel de réservation Qualifyr"
                className="block h-[38rem] w-full border-0"
                /* La démo n'a aucune raison d'accéder à la caméra, au micro ou
                   à la position ; la sandbox lui laisse le strict nécessaire
                   pour fonctionner. */
                sandbox="allow-scripts allow-forms allow-same-origin"
                loading="lazy"
              />
            ) : (
              <div className="flex h-[38rem] flex-col items-center justify-center gap-6 px-8 text-center">
                <div className="grid w-full gap-2.5">
                  {/* Un aperçu figé des trois premières étapes. Il ne promet
                      rien que le tunnel ne tienne : ce sont ses vrais
                      intitulés. */}
                  {['Votre véhicule', 'La formule', 'Le créneau'].map((step, index) => (
                    <div
                      key={step}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-start"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-[0.75rem] font-semibold text-faint">
                        {index + 1}
                      </span>
                      <span className="text-[0.875rem] text-muted">{step}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  className="cta-solid inline-flex min-h-[48px] cursor-pointer items-center rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink transition-colors duration-150 hover:bg-white/90"
                >
                  Lancer la démo
                </button>

                <p className="text-[0.8125rem] leading-[1.5] text-faint">
                  Aucune réservation n’est enregistrée et aucun paiement n’est déclenché.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {started ? (
        <p className="mx-auto mt-6 max-w-[30rem] text-center text-[0.8125rem] leading-[1.6] text-faint">
          Vous êtes dans une démonstration : les créneaux sont fictifs et rien n’est encaissé.
        </p>
      ) : null}
    </Section>
  );
}
