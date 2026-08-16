/**
 * Tailwind CSS v4, via son greffon PostCSS.
 *
 * Le dépôt n'avait aucune configuration PostCSS : les CSS Modules sont
 * traités directement par Next. Ce fichier n'ajoute que Tailwind ; les
 * modules existants continuent de passer par le même pipeline, inchangés.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
