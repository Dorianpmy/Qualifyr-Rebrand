type IconName = 'arrow-right' | 'arrow-up-right' | 'plus' | 'minus' | 'close' | 'menu';

type IconProps = {
  name: IconName;
  /** Taille en em, relative au texte environnant. */
  size?: number;
  className?: string | undefined;
};

/**
 * Jeu d'icônes maison — une seule famille, trait fin (1.25 sur une grille 24),
 * extrémités arrondies, jamais remplies, jamais colorées, jamais en pastille.
 *
 * Les icônes sont toujours secondaires : elles accompagnent un texte, ne le
 * remplacent jamais et sont `aria-hidden`. Une icône seule dans un bouton doit
 * s'accompagner d'un libellé accessible côté appelant.
 *
 * Aucune dépendance externe : six tracés suffisent à tout le site.
 */
const paths: Record<IconName, string> = {
  'arrow-right': 'M4 12h16M14 6l6 6-6 6',
  'arrow-up-right': 'M7 17 17 7M8 7h9v9',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  menu: 'M3 8h18M3 16h18',
};

export function Icon({ name, size = 1, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={`${size}em`}
      height={`${size}em`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...(className ? { className } : {})}
    >
      <path d={paths[name]} />
    </svg>
  );
}
