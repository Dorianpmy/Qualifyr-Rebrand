import Image from 'next/image';

/**
 * Bandeau de preuve sociale — avatars superposés, étoiles, décompte.
 *
 * **Le décompte n'a pas de valeur par défaut, délibérément.** Un composant
 * qui affiche « +120 detailers » sans qu'on le lui demande finit en ligne avec
 * ce chiffre : personne ne pense à remplacer une valeur qui s'affiche déjà
 * correctement. En le rendant obligatoire, la question « combien exactement ? »
 * se pose au moment de poser le composant.
 *
 * **Les avatars acceptent des initiales.** Une photo de visage engage une
 * personne réelle : tant qu'on n'a pas son accord, on affiche un monogramme.
 * C'est aussi ce qui évite de piocher des portraits sur une banque d'images —
 * un professionnel qui reconnaît une photo de stock cesse de croire le reste
 * de la page.
 */

export type ProofAvatar =
  | { readonly src: string; readonly alt: string }
  | { readonly initials: string; readonly alt: string };

export type SocialProofProps = {
  /** Formulation exacte affichée. Ex. « +120 detailers », « 12 pros équipés ». */
  readonly count: string;
  readonly avatars: readonly ProofAvatar[];
  /** Nombre d'étoiles pleines. Omis, aucune étoile n'est affichée. */
  readonly rating?: number;
  /** Ce que les étoiles mesurent réellement — exigé dès qu'il y a une note. */
  readonly ratingLabel?: string;
};

function Star({ filled }: { readonly filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-[1.15rem] ${filled ? 'fill-white' : 'fill-white/20'}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9L12 2.5z" />
    </svg>
  );
}

/* 38 px et un liseré blanc à 1 px, conformément à la charte.
   Le liseré passe par `ring` et non par `border` : une bordure entrerait dans
   le calcul de la taille et rognerait l'image de deux pixels. Le second anneau,
   de la couleur du fond, sépare les visages qui se chevauchent. */
const avatarClass =
  'block size-[38px] rounded-full object-cover ring-1 ring-white/25 ring-offset-[3px] ring-offset-ink max-[480px]:size-9';

export function SocialProof({ count, avatars, rating, ratingLabel }: SocialProofProps) {
  return (
    <div className="flex items-center gap-[1.1rem] font-sans">
      {/* Le chevauchement vient d'une marge négative et non d'un positionnement
          absolu : la liste garde sa largeur réelle et ne recouvre pas le texte
          quand on ajoute un cinquième portrait. */}
      <ul className="flex">
        {avatars.map((avatar) => (
          <li key={'src' in avatar ? avatar.src : avatar.initials} className="-ml-3 first:ml-0">
            {'src' in avatar ? (
              <Image
                src={avatar.src}
                alt={avatar.alt}
                width={96}
                height={96}
                sizes="38px"
                className={avatarClass}
              />
            ) : (
              <span
                role="img"
                aria-label={avatar.alt}
                className={`${avatarClass} flex items-center justify-center bg-panel-raised text-[0.6875rem] font-semibold tracking-[0.04em] text-muted`}
              >
                {avatar.initials}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="grid gap-0.5">
        {rating ? (
          <div
            className="flex gap-0.5"
            role="img"
            aria-label={ratingLabel ?? `${rating} étoiles sur 5`}
          >
            {[1, 2, 3, 4, 5].map((position) => (
              <Star key={position} filled={position <= rating} />
            ))}
          </div>
        ) : null}
        <p className="text-base font-medium tracking-[-0.01em] text-muted max-[480px]:text-[0.92rem]">
          {count}
        </p>
      </div>
    </div>
  );
}
