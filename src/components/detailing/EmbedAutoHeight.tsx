'use client';

import { useEffect } from 'react';

/**
 * Signale la hauteur du tunnel à la page qui l'héberge.
 *
 * **Le problème que ça règle.** Une iframe a une hauteur fixe décidée par le
 * site d'accueil. Le tunnel, lui, change de taille à chaque étape — l'étape
 * « créneau » avec vingt boutons d'horaires fait le double de l'étape
 * « véhicule ». Sans mesure, soit le formulaire est tronqué, soit il flotte
 * au milieu de six cents pixels de vide. Une barre de défilement interne n'est
 * pas une solution : sur mobile elle capture le geste et le visiteur ne peut
 * plus faire défiler la page.
 *
 * On mesure donc en continu et on publie la valeur. Le script d'intégration
 * côté professionnel écoute et redimensionne.
 *
 * **`targetOrigin: '*'` est volontaire.** Le message ne contient qu'un nombre
 * de pixels, aucune donnée du client, et nous ne connaissons pas à l'avance le
 * domaine qui héberge le tunnel.
 */
export function EmbedAutoHeight() {
  useEffect(() => {
    if (window.parent === window) return;

    let last = 0;

    const publish = () => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      // Un seuil d'un pixel évite une boucle : redimensionner le cadre modifie
      // parfois la hauteur mesurée de moins d'un pixel, ce qui republierait
      // indéfiniment.
      if (Math.abs(height - last) < 2) return;
      last = height;
      window.parent.postMessage({ type: 'qualifyr:height', height }, '*');
    };

    publish();

    const observer = new ResizeObserver(publish);
    observer.observe(document.documentElement);

    // Les changements d'étape modifient la hauteur après le rendu, donc après
    // que l'observateur a mesuré. Une republication différée les rattrape.
    const interval = window.setInterval(publish, 500);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
