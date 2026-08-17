'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Ligne « style chargement » posée sous chaque étape numérotée.
 *
 * **Pourquoi un composant client isolé et pas tout `DarkVerticalPage.tsx`.**
 * `JourneySection` et ses voisins n'ont besoin de rien côté client — seule
 * cette barre a besoin d'observer le scroll. Marquer le fichier entier
 * `'use client'` aurait transformé cinq composants en composants client pour
 * l'un d'eux seulement.
 *
 * **Remplissage décalé par étape, pas simultané.** Les quatre barres qui se
 * rempliraient d'un coup ne raconteraient rien ; décalées de 150 ms chacune,
 * elles rejouent visuellement l'ordre « Découvrir → Choisir → Préciser →
 * Réserver » que la section décrit déjà par le texte — l'animation renforce
 * la lecture au lieu de s'y ajouter sans rapport.
 */
export function StepLoadingBar({ index }: { readonly index: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setFilled(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          const timeout = setTimeout(() => setFilled(true), index * 150);
          observer.disconnect();
          return () => clearTimeout(timeout);
        }
        return undefined;
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-white/10"
    >
      <div
        className="h-full rounded-full"
        style={{
          width: filled ? '100%' : '0%',
          background: 'linear-gradient(90deg, var(--accent-1), var(--accent-3) 50%, var(--accent-2))',
          transition: 'width 700ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
}
