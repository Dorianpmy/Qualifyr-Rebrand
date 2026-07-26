/**
 * Contenu de la page À propos.
 *
 * Aucune histoire de fondateur n'est racontée : ni date de création, ni
 * anecdote d'origine, ni parcours personnel, tant que Dorian ne les a pas
 * fournis et validés. La page parle de la façon de travailler, qui est vraie
 * et vérifiable, plutôt que d'une biographie qui ne l'est pas.
 *
 * Interdiction explicite : ne pas mentionner Lombok tant que cette
 * installation et cette communication ne sont pas officiellement rattachées à
 * la marque.
 */

export const aboutPage = {
  eyebrow: 'À propos',
  title: 'Qualifyr aide deux métiers de service à transformer leur savoir-faire en activité.',
  lead: 'Le travail est déjà là. Ce qui manque souvent, c’est ce qui le relie à la prochaine réservation.',
} as const;

export const aboutIntro = [
  'Qualifyr accompagne deux verticales précises : le nettoyage automobile mobile, avec le detailing à domicile, et les conciergeries. Nous ne cherchons pas à servir tous les métiers. Nous adaptons une même méthode aux véhicules, zones et créneaux d’un côté, aux besoins, séjours, destinations et demandes d’accompagnement de l’autre.',
  'Nous travaillons à distance, ce qui permet d’intervenir où que vous soyez sans facturer des déplacements qui n’apportent rien. Les échanges sont directs, en français simple, avec la personne qui construit réellement le parcours.',
] as const;

export const philosophy = [
  {
    number: '01',
    title: 'La clarté avant l’effet',
    body: 'Un client qui comprend en quelques secondes ce que vous proposez, où vous intervenez et comment réserver n’a pas besoin d’être convaincu. Il décide. Tout ce qui n’aide pas à cette compréhension est retiré.',
  },
  {
    number: '02',
    title: 'Le parcours entier, pas un livrable isolé',
    body: 'Une belle page qui ne mène nulle part ne change rien à votre activité. Nous regardons l’enchaînement complet, de la première recherche jusqu’à l’avis et à la réservation suivante.',
  },
  {
    number: '03',
    title: 'Votre autonomie',
    body: 'Vous devez pouvoir comprendre ce qui a été mis en place, l’utiliser sans mode d’emploi et le faire évoluer. Un parcours que vous ne maîtrisez pas devient une dépendance, pas un atout.',
  },
  {
    number: '04',
    title: 'Le même soin que le vôtre',
    body: 'Vous livrez une prestation ou un accompagnement sans laisser de place au flou. Nous appliquons ce niveau d’exigence à ce que nous construisons : finition, lisibilité, rapidité d’affichage, confort sur téléphone.',
  },
] as const;

export const howWeWork = [
  {
    title: 'Nous commençons par écouter',
    body: 'Votre organisation actuelle est le point de départ. Pas un modèle, pas un modèle de site, pas une méthode importée d’un autre secteur.',
  },
  {
    title: 'Nous disons ce qui n’est pas utile',
    body: 'Si une idée ne sert pas une réservation, nous vous le disons plutôt que de la facturer.',
  },
  {
    title: 'Nous restons joignables',
    body: 'Un projet ne s’arrête pas à la mise en ligne. Les premières semaines d’usage révèlent presque toujours des ajustements.',
  },
] as const;

export const refusals = [
  {
    title: 'Empiler des outils sans raison',
    body: 'Chaque outil ajouté doit retirer une contrainte. Sinon, il en crée une.',
  },
  {
    title: 'Promettre des résultats irréalistes',
    body: 'Nous ne garantissons ni volume de clients, ni chiffre, ni délai de retour. Personne ne le peut honnêtement.',
  },
  {
    title: 'Imposer un système trop complexe',
    body: 'Si vous devez apprendre un nouveau métier pour utiliser ce que nous livrons, nous nous sommes trompés.',
  },
  {
    title: 'Masquer le projet derrière du jargon',
    body: 'Vous devez pouvoir répéter à quelqu’un d’autre ce que nous construisons, avec vos mots.',
  },
  {
    title: 'Créer un beau site sans penser au parcours',
    body: 'L’esthétique compte, mais elle vient après la question : qu’est-ce qui empêche aujourd’hui une réservation ?',
  },
] as const;
