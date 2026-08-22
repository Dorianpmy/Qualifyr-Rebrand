import type { ReactNode } from 'react';
import { Section } from '@/components/agency/Section';

/**
 * Corps d'une page légale : sommaire à gauche, sections numérotées à droite.
 *
 * **Le sommaire est un vrai outil, pas un ornement.** Sur des conditions de
 * vente, personne ne lit dans l'ordre : on cherche la clause de résiliation ou
 * la durée d'engagement. Il reste donc collé au défilement sur grand écran, et
 * passe au-dessus du texte en dessous de 1024 px — plutôt que d'être masqué,
 * car c'est sur mobile qu'un texte long est le plus difficile à parcourir.
 *
 * **La numérotation vient du CSS, pas du contenu.** Écrire « 01 » dans les
 * titres obligerait à tout renuméroter à chaque insertion, et la première
 * fois qu'on l'oublierait, deux sections porteraient le même numéro. Ici
 * l'index est calculé au rendu.
 *
 * **Une seule colonne de texte, bornée.** Les sections héritent de la largeur
 * de lecture ; aucune ne s'étale sur toute la page, quelle que soit la taille
 * de l'écran.
 */

export type LegalSection = {
  readonly id: string;
  readonly title: string;
  /** Paragraphes de texte brut. */
  readonly paragraphs?: readonly string[];
  /** Contenu libre, pour les sections qui ne sont pas du texte courant. */
  readonly body?: ReactNode;
};

function pad(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export function LegalSections({ sections }: { readonly sections: readonly LegalSection[] }) {
  return (
    <Section className="border-t border-hairline py-14">
      <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        {/* Sommaire. `self-start` est indispensable : sans lui, l'élément
            s'étire sur toute la hauteur de la grille et `sticky` n'a plus
            aucun espace dans lequel coller. */}
        <nav aria-label="Sommaire" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-faint">
            Sommaire
          </p>
          <ol className="grid gap-2.5">
            {sections.map((section, index) => (
              <li key={section.id} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="pt-[0.1rem] text-[0.6875rem] tabular-nums text-faint"
                >
                  {pad(index)}
                </span>
                <a
                  href={`#${section.id}`}
                  className="text-[0.8125rem] leading-[1.45] !text-muted no-underline transition-colors duration-150 hover:!text-primary"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid max-w-[38rem] gap-12">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              /* `scroll-mt` : sans cette marge, l'en-tête collant recouvre le
                 titre à l'arrivée depuis le sommaire — le lecteur atterrit sur
                 le deuxième paragraphe et croit avoir raté quelque chose. */
              className="scroll-mt-24"
            >
              <p className="mb-2 text-[0.6875rem] font-semibold tabular-nums tracking-[0.1em] text-faint">
                {pad(index)}
              </p>

              <h2
                id={`${section.id}-title`}
                className="mb-4 text-[1.375rem] font-bold leading-[1.2] tracking-[-0.02em] text-primary"
              >
                {section.title}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mb-3.5 text-[0.9375rem] leading-[1.75] text-muted last:mb-0"
                >
                  {paragraph}
                </p>
              ))}

              {section.body}
            </section>
          ))}
        </div>
      </div>
    </Section>
  );
}

/**
 * Bloc de données étiquetées — l'éditeur, l'hébergeur.
 *
 * **Une seule ligne par information, jamais de tableau.** Un tableau à deux
 * colonnes se casse sous 375 px : soit il déborde, soit les libellés
 * s'écrasent sur deux mots par ligne. Une liste de définitions se replie
 * naturellement en une colonne.
 *
 * **Les valeurs absentes ne sont pas masquées.** Sur des mentions légales, une
 * ligne manquante doit se voir : le visiteur comprend qu'elle sera publiée,
 * plutôt que d'ignorer qu'elle devrait exister. C'est aussi la règle du
 * projet — ne jamais inventer une valeur, ne jamais afficher de faux
 * remplissage.
 */
export function DataBlock({
  entries,
}: {
  readonly entries: readonly { readonly label: string; readonly value: string | null }[];
}) {
  return (
    <dl className="grid gap-0 overflow-hidden rounded-2xl border border-hairline">
      {entries.map((entry) => (
        <div
          key={entry.label}
          className="grid gap-1 border-b border-hairline px-4 py-3.5 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline sm:gap-4"
        >
          <dt className="text-[0.8125rem] text-faint">{entry.label}</dt>
          <dd className="text-[0.9375rem] leading-[1.5] text-primary">
            {entry.value ?? (
              <span className="text-faint">À publier avant la mise en ligne</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
