/**
 * Script d'intégration Qualifyr — tunnel de réservation sur le site d'un pro.
 *
 * Usage, à coller là où le formulaire doit apparaître :
 *
 *   <div data-qualifyr="mon-slug"></div>
 *   <script src="https://qualifyragence.com/embed.js" async></script>
 *
 * Contraintes qui ont dicté l'écriture :
 *
 * - **Aucune dépendance, aucun style injecté.** Le script tourne sur des sites
 *   que nous ne voyons jamais — WordPress, Wix, Squarespace, du HTML écrit à
 *   la main. Toute feuille de style ajoutée finirait par entrer en conflit
 *   avec celle de l'hôte.
 * - **Idempotent.** Certains constructeurs de sites injectent le même script
 *   deux fois, ou le rejouent à chaque navigation interne. Un conteneur déjà
 *   traité est laissé tel quel, sans quoi le visiteur verrait deux tunnels.
 * - **Pas de `document.write`.** Il détruit la page entière lorsqu'il est
 *   appelé après le chargement, ce qui est le cas avec `async`.
 */
(function () {
  'use strict';

  var ORIGIN = (function () {
    var current = document.currentScript;
    if (current && current.src) {
      try {
        return new URL(current.src).origin;
      } catch {
        /* URL exotique : on retombe sur le domaine de production. */
      }
    }
    return 'https://qualifyragence.com';
  })();

  var FLAG = 'qualifyrMounted';

  function mount(container) {
    if (container.dataset[FLAG] === '1') return;

    var slug = container.getAttribute('data-qualifyr');
    if (!slug) return;

    container.dataset[FLAG] = '1';

    var frame = document.createElement('iframe');
    frame.src = ORIGIN + '/embed/' + encodeURIComponent(slug);
    frame.title = 'Réservation en ligne';
    frame.loading = 'lazy';
    // `camera` autorise la prise de photo du véhicule depuis un téléphone ;
    // `payment` autorise le règlement de l'acompte.
    frame.allow = 'camera; payment';
    frame.setAttribute('scrolling', 'no');
    frame.style.width = '100%';
    frame.style.border = '0';
    frame.style.display = 'block';
    // Hauteur d'attente : assez pour que la première étape soit lisible avant
    // que la mesure réelle n'arrive, pas au point de laisser un trou béant si
    // le message n'arrivait jamais.
    frame.style.height = '760px';

    container.appendChild(frame);

    window.addEventListener('message', function (event) {
      if (event.origin !== ORIGIN) return;
      if (event.source !== frame.contentWindow) return;

      var data = event.data;
      if (!data || data.type !== 'qualifyr:height') return;

      var height = Number(data.height);
      if (!isFinite(height) || height < 200) return;

      frame.style.height = Math.ceil(height) + 'px';
    });
  }

  function scan() {
    var containers = document.querySelectorAll('[data-qualifyr]');
    for (var i = 0; i < containers.length; i += 1) {
      mount(containers[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  // Les sites construits en JavaScript insèrent parfois le conteneur après le
  // chargement. On surveille les ajouts plutôt que d'exiger un ordre précis.
  if (typeof MutationObserver === 'function') {
    new MutationObserver(scan).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();
