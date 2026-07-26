/**
 * Insertion d'un bloc JSON-LD.
 *
 * Les données proviennent exclusivement de `src/lib/structured-data.ts`, qui
 * n'expose que des faits vérifiables. Le contenu est sérialisé par nos soins,
 * jamais construit à partir d'une saisie visiteur.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Sérialisation d'objets internes uniquement : aucune donnée externe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
