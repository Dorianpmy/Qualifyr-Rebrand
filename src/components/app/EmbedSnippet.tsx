'use client';

import { useState } from 'react';
import styles from './EmbedSnippet.module.css';

/**
 * Code d'intégration à coller sur le site du professionnel.
 *
 * L'origine est lue depuis le navigateur plutôt qu'écrite en dur : en
 * développement le code affiché doit pointer vers `localhost`, sinon le pro
 * teste une intégration qui charge la production et croit que ça marche.
 */
export function EmbedSnippet({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window === 'undefined' ? 'https://qualifyragence.com' : window.location.origin;

  const snippet = `<div data-qualifyr="${slug}"></div>\n<script src="${origin}/embed.js" async></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.snippet}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>Mettre la réservation sur ton propre site</h2>
          <p className={styles.hint}>
            Colle ces deux lignes à l’endroit où le formulaire doit apparaître. Le cadre s’adapte
            tout seul à la hauteur de chaque étape, et les demandes arrivent dans tes Demandes
            exactement comme celles de ta page Qualifyr.
          </p>
        </div>
        <button type="button" className={styles.copy} onClick={copy}>
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>

      <pre className={styles.code}>
        <code>{snippet}</code>
      </pre>

      <p className={styles.hint}>
        Ta page publique reste active en parallèle — utile pour tes fiches Google, tes stories et
        tes cartes de visite, où tu ne peux pas coller de code.
      </p>
    </div>
  );
}
