/**
 * Pages locales — conciergeries de location courte durée.
 *
 * Le référencement local ne dépend pas de l'endroit d'où l'on écrit, mais de
 * l'endroit où se trouvent les clients : ces pages fonctionnent depuis
 * n'importe où.
 *
 * **Règle éditoriale.** Chaque ville a un contexte réel — réglementation,
 * saisonnalité, type de parc. Dupliquer un même texte en changeant le nom de la
 * ville produit du contenu que Google identifie comme dupliqué et qui ne se
 * positionne pas. Chaque entrée ci-dessous doit donc dire quelque chose de vrai
 * et de spécifique.
 */

export type City = {
  readonly slug: string;
  readonly name: string;
  /** Formulation locative : « à Lyon », « à Paris », « à Marseille ». */
  readonly inCity: string;
  readonly intro: string;
  /** Ce qui distingue réellement ce marché. Trois points, pas plus. */
  readonly context: readonly { readonly title: string; readonly body: string }[];
  readonly regulation: string;
};

export const cities = [
  {
    slug: 'lyon',
    name: 'Lyon',
    inCity: 'à Lyon',
    intro:
      'Lyon combine une demande d’affaires en semaine et une demande touristique le week-end, ce qui donne une occupation plus régulière que dans les villes purement saisonnières. Pour une conciergerie, cela change la façon de présenter un bien à un propriétaire : l’argument n’est pas la haute saison, c’est la stabilité.',
    context: [
      {
        title: 'Une demande à deux rythmes',
        body: 'Déplacements professionnels en semaine, séjours courts le week-end. Un propriétaire lyonnais est plus sensible à un taux d’occupation annuel qu’à un pic estival.',
      },
      {
        title: 'Un parc de petites surfaces',
        body: 'Studios et deux-pièces dominent dans la Presqu’île et à la Croix-Rousse. Vos formules et vos barèmes doivent refléter cette réalité plutôt qu’une moyenne nationale.',
      },
      {
        title: 'Une concurrence installée',
        body: 'Plusieurs conciergeries locales sont déjà référencées. Se distinguer passe par la clarté de l’offre et la rapidité de réponse, pas par le prix.',
      },
    ],
    regulation:
      'Lyon applique un encadrement de la location meublée touristique, avec déclaration en mairie et, pour les résidences secondaires, une procédure de changement d’usage. Une conciergerie qui maîtrise ces démarches en fait un argument, pas une contrainte.',
  },
  {
    slug: 'marseille',
    name: 'Marseille',
    inCity: 'à Marseille',
    intro:
      'Marseille est un marché fortement saisonnier, où l’essentiel du revenu se concentre sur quelques mois. Pour une conciergerie, la difficulté n’est pas de remplir en juillet — c’est de convaincre un propriétaire que le reste de l’année vaut la peine d’être géré.',
    context: [
      {
        title: 'Une saisonnalité marquée',
        body: 'L’été concentre une part considérable du revenu annuel. Une estimation crédible doit montrer la répartition mois par mois, sinon le propriétaire suspecte une moyenne trompeuse.',
      },
      {
        title: 'Des quartiers très inégaux',
        body: 'Le Vieux-Port, le Panier et les Calanques n’ont pas les mêmes tarifs ni la même occupation. Un barème unique pour toute la ville dessert votre crédibilité.',
      },
      {
        title: 'Un parc hétérogène',
        body: 'Du studio en centre à la maison avec extérieur, l’écart de potentiel est considérable. Vos formules doivent pouvoir absorber cette diversité.',
      },
    ],
    regulation:
      'Marseille impose la déclaration des meublés de tourisme et encadre le changement d’usage dans plusieurs arrondissements. Les règles évoluent régulièrement : vérifiez l’état du droit local avant tout engagement auprès d’un propriétaire.',
  },
  {
    slug: 'paris',
    name: 'Paris',
    inCity: 'à Paris',
    intro:
      'Paris est le marché le plus rentable de France et le plus contraint. La limite annuelle de location d’une résidence principale y structure toute l’activité : une conciergerie parisienne vend d’abord de la conformité, ensuite du revenu.',
    context: [
      {
        title: 'Le plafond des 120 jours',
        body: 'Une résidence principale ne peut être louée plus de 120 jours par an. Toute estimation qui ignore ce plafond est fausse, et le propriétaire le sait.',
      },
      {
        title: 'Un prix par nuit élevé',
        body: 'Le niveau de tarif compense en partie la limitation de durée. L’argument porte sur le revenu par nuit, pas sur le volume.',
      },
      {
        title: 'Une exigence de service',
        body: 'Le voyageur parisien note sévèrement. La qualité d’accueil et la réactivité pèsent davantage sur l’occupation que dans les autres villes.',
      },
    ],
    regulation:
      'Paris impose l’enregistrement des meublés de tourisme, l’affichage du numéro sur les annonces, et limite la location d’une résidence principale à 120 jours par an. Le changement d’usage avec compensation s’applique aux résidences secondaires.',
  },
] as const satisfies readonly City[];

export function getCity(slug: string): City | undefined {
  return cities.find((city) => city.slug === slug);
}
