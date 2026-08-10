export type BlogSection = {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly points?: readonly string[];
};

export type BlogArticle = {
  readonly slug: string;
  readonly number: string;
  readonly category: string;
  readonly title: string;
  readonly excerpt: string;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly publishedAt: string;
  readonly introduction: string;
  readonly sections: readonly BlogSection[];
  readonly conclusion: string;
};

export const blogIntro = {
  eyebrow: 'Le journal',
  title: 'Des repères pour mieux présenter et développer votre activité.',
  body: 'Offre, identité, site et prise de contact : des articles concrets pour prendre de meilleures décisions, sans ajouter de complexité.',
} as const;

/**
 * File éditoriale Qualifyr.
 *
 * Chaque article est entièrement rédigé avant d'être planifié. La date sert
 * uniquement à rendre le contenu visible : elle ne déclenche aucune génération
 * et ne complète jamais un texte manquant.
 */
export const blogArticles = [
  {
    slug: 'rendre-une-offre-de-services-plus-facile-a-choisir',
    number: '01',
    category: 'Offre',
    title: 'Comment rendre une offre de services plus facile à choisir',
    excerpt:
      'Une offre claire ne dit pas tout. Elle aide le client à reconnaître son besoin, à comparer les options utiles et à savoir quoi faire ensuite.',
    seoTitle: 'Rendre une offre de services plus facile à choisir — Qualifyr',
    seoDescription:
      'Une méthode simple pour structurer une offre de services, présenter les bonnes différences et faciliter la décision du client.',
    publishedAt: '2026-07-31T10:00:00+02:00',
    introduction:
      'Quand une personne découvre votre activité, elle ne cherche pas une liste exhaustive. Elle cherche surtout à savoir si vous comprenez sa situation, si votre prestation lui correspond et comment avancer. Une offre efficace organise ces réponses dans le bon ordre.',
    sections: [
      {
        title: 'Commencer par la situation du client',
        paragraphs: [
          'Présenter immédiatement votre méthode, vos outils ou votre histoire oblige le visiteur à faire lui-même le lien avec son besoin. Commencez plutôt par les situations que vous prenez réellement en charge.',
          'Un professionnel du nettoyage automobile peut distinguer l’entretien courant, la remise en état et la préparation avant une vente. Une conciergerie peut distinguer l’organisation d’un séjour, une demande ponctuelle et un accompagnement plus complet. Le client se reconnaît avant de comparer.',
        ],
      },
      {
        title: 'Limiter les choix qui se ressemblent',
        paragraphs: [
          'Deux formules sont utiles lorsqu’elles correspondent à deux besoins différents. Elles deviennent confuses lorsqu’elles se distinguent seulement par quelques lignes techniques.',
          'Pour chaque option, indiquez à qui elle s’adresse, ce qu’elle comprend, ce qui reste à préciser et l’action suivante. Si deux options produisent la même décision, regroupez-les.',
        ],
        points: [
          'Un intitulé compris sans explication.',
          'Une phrase qui décrit la situation concernée.',
          'Les éléments décisifs, pas l’inventaire complet.',
          'Une prochaine étape claire.',
        ],
      },
      {
        title: 'Répondre aux hésitations au bon endroit',
        paragraphs: [
          'La zone d’intervention, les conditions de réservation, les délais de réponse ou les informations à préparer ne doivent pas être cachés dans une page secondaire. Placez chaque réponse près du moment où la question apparaît.',
          'L’objectif n’est pas d’écrire davantage. Il est de réduire les retours en arrière et les messages nécessaires avant qu’une demande puisse être comprise.',
        ],
      },
    ],
    conclusion:
      'Une offre claire permet au bon client de se situer rapidement. Avant d’ajouter une nouvelle formule, vérifiez donc si les options actuelles décrivent réellement des besoins différents et si chacune mène vers une action évidente.',
  },
  {
    slug: 'ce-que-la-page-accueil-doit-faire-comprendre',
    number: '02',
    category: 'Site',
    title: 'Ce que votre page d’accueil doit faire comprendre',
    excerpt:
      'Une bonne page d’accueil donne des repères immédiats : ce que vous faites, pour qui, pourquoi vous choisir et comment vous contacter.',
    seoTitle: 'Ce qu’une page d’accueil doit faire comprendre — Qualifyr',
    seoDescription:
      'Les informations essentielles à organiser sur la page d’accueil d’une entreprise de services pour guider clairement ses visiteurs.',
    publishedAt: '2026-07-31T09:00:00+02:00',
    introduction:
      'La page d’accueil n’a pas besoin de raconter toute l’entreprise. Elle doit donner assez de repères pour que le visiteur comprenne l’activité, vérifie qu’il est au bon endroit et poursuive sans hésiter.',
    sections: [
      {
        title: 'Une promesse concrète dès le premier écran',
        paragraphs: [
          'Un titre abstrait peut sembler élégant tout en laissant le métier invisible. Le premier écran doit relier votre savoir-faire à un résultat compréhensible, sans promesse excessive.',
          'Le texte qui suit précise le type de service, la zone ou le public concerné. Le visiteur ne devrait pas avoir à faire défiler la page pour comprendre ce que vous proposez.',
        ],
      },
      {
        title: 'Une preuve adaptée à votre maturité',
        paragraphs: [
          'Une réalisation réelle, des photographies de votre travail, une méthode clairement expliquée ou des informations précises sur la prestation peuvent rassurer. Choisissez ce que vous pouvez montrer honnêtement aujourd’hui.',
          'Une seule preuve détaillée vaut mieux qu’une grille de logos, de chiffres ou de déclarations impossibles à vérifier.',
        ],
      },
      {
        title: 'Un chemin principal, pas cinq actions concurrentes',
        paragraphs: [
          'Réserver, demander un devis, appeler, écrire et télécharger un document au même niveau créent une hésitation. Définissez l’action la plus utile pour commencer, puis gardez une alternative pour les personnes qui ne sont pas prêtes.',
        ],
        points: [
          'Le titre explique la valeur.',
          'Le sous-titre précise l’activité.',
          'La preuve répond au doute principal.',
          'Le bouton indique exactement ce qui se passe ensuite.',
        ],
      },
    ],
    conclusion:
      'Une page d’accueil réussie ne retient pas le visiteur par sa longueur. Elle lui donne confiance dans l’ordre : comprendre, vérifier, puis agir.',
  },
  {
    slug: 'formulaire-whatsapp-calendrier-quel-point-entree-choisir',
    number: '03',
    category: 'Contact',
    title: 'Formulaire, WhatsApp ou calendrier : quel point d’entrée choisir ?',
    excerpt:
      'Le bon canal dépend de la demande à traiter. L’enjeu est de recueillir assez d’informations sans rendre le premier contact pénible.',
    seoTitle: 'Formulaire, WhatsApp ou calendrier : que choisir ? — Qualifyr',
    seoDescription:
      'Comparez formulaire, WhatsApp et calendrier pour choisir un point de contact adapté à votre activité de services.',
    publishedAt: '2026-07-31T08:00:00+02:00',
    introduction:
      'Il n’existe pas un canal parfait pour toutes les activités. Le bon choix dépend du niveau d’information nécessaire avant de répondre, de la disponibilité de l’équipe et de la façon dont une prestation se confirme.',
    sections: [
      {
        title: 'WhatsApp pour ouvrir une conversation',
        paragraphs: [
          'WhatsApp convient aux questions courtes, aux demandes qui nécessitent une photo et aux clients qui veulent vérifier rapidement un point. Il crée une proximité immédiate.',
          'Il devient moins efficace lorsque chaque échange commence par les mêmes questions. Dans ce cas, un message préparé ou une courte étape de qualification peut éviter de tout reprendre manuellement.',
        ],
      },
      {
        title: 'Le formulaire pour structurer une demande',
        paragraphs: [
          'Un formulaire est utile lorsque la zone, le type de prestation, la date ou plusieurs contraintes sont indispensables pour répondre. Il ne doit demander que ce qui change réellement la suite.',
          'Chaque champ supplémentaire doit avoir une raison. Si l’information peut être demandée plus tard sans ralentir la réponse, retirez-la du premier contact.',
        ],
      },
      {
        title: 'Le calendrier lorsque le rendez-vous est la prochaine étape',
        paragraphs: [
          'Un calendrier est pertinent si un échange peut être réservé sans validation préalable. Il est moins adapté lorsque vous devez d’abord vérifier une zone, un budget, une disponibilité particulière ou la nature exacte du besoin.',
          'Les trois canaux peuvent coexister, à condition que chacun ait une fonction claire et qu’un seul soit présenté comme action principale.',
        ],
      },
    ],
    conclusion:
      'Choisissez le canal qui réduit le travail nécessaire des deux côtés. Un premier contact simple n’est pas forcément court : il demande juste les bonnes informations, au bon moment.',
  },
  {
    slug: 'identite-visuelle-utile-plus-qu-un-logo',
    number: '04',
    category: 'Identité',
    title: 'Une identité visuelle utile ne se résume pas à un logo',
    excerpt:
      'Le logo signe la marque. L’identité organise aussi les couleurs, la typographie, les images et la manière de présenter chaque information.',
    seoTitle: 'Une identité visuelle utile va au-delà du logo — Qualifyr',
    seoDescription:
      'Comprenez les éléments qui rendent une identité visuelle cohérente et réellement utile sur un site et les supports d’une entreprise.',
    publishedAt: '2026-08-01T08:00:00+02:00',
    introduction:
      'Un logo peut être reconnaissable sans suffire à donner une impression cohérente. L’identité visuelle prend forme dans tous les choix répétés : les proportions, les couleurs, les titres, les photographies et les détails d’interface.',
    sections: [
      {
        title: 'Définir une impression avant de choisir une couleur',
        paragraphs: [
          'Demandez d’abord ce que le client doit ressentir : précision, proximité, soin, calme ou énergie. La palette et la typographie viennent ensuite traduire cette intention.',
          'Copier les codes visuels les plus courants de son secteur peut aider à être reconnu, mais une identité forte sélectionne ces codes au lieu de tous les reprendre.',
        ],
      },
      {
        title: 'Créer des règles assez simples pour être tenues',
        paragraphs: [
          'Une identité devient utile lorsqu’elle peut être appliquée sur une page, une proposition commerciale, un véhicule ou une publication sans repartir de zéro.',
        ],
        points: [
          'Une palette principale courte.',
          'Deux familles typographiques au maximum.',
          'Une manière constante de traiter les images.',
          'Des espacements et des alignements reconnaissables.',
        ],
      },
      {
        title: 'Vérifier l’identité dans les situations réelles',
        paragraphs: [
          'Un symbole doit rester lisible en petit. Une couleur doit garder assez de contraste. Un titre doit fonctionner sur mobile. Une photographie doit être facile à reproduire avec les moyens disponibles.',
          'Tester ces contraintes évite de construire une identité séduisante dans une présentation, mais difficile à utiliser au quotidien.',
        ],
      },
    ],
    conclusion:
      'Le meilleur système visuel n’est pas celui qui multiplie les règles. C’est celui qui rend chaque nouveau support plus simple à composer et immédiatement cohérent avec les précédents.',
  },
  {
    slug: 'concevoir-un-site-mobile-pour-des-clients-presses',
    number: '05',
    category: 'Mobile',
    title: 'Concevoir un site mobile pour des clients pressés',
    excerpt:
      'Sur mobile, la clarté dépend moins du nombre d’effets que de l’ordre des informations, de la taille des actions et de la vitesse de lecture.',
    seoTitle: 'Concevoir un site mobile clair pour ses clients — Qualifyr',
    seoDescription:
      'Les choix essentiels pour rendre le site mobile d’une entreprise de services plus lisible, plus confortable et plus simple à contacter.',
    publishedAt: '2026-08-02T08:00:00+02:00',
    introduction:
      'Une personne qui consulte un service sur son téléphone peut être en déplacement, comparer plusieurs prestataires ou chercher une réponse précise. Le site doit rester confortable sans demander une attention prolongée.',
    sections: [
      {
        title: 'Raccourcir la distance jusqu’à l’information utile',
        paragraphs: [
          'Le menu, le titre et les premières sections doivent conduire rapidement vers les prestations, la zone, les conditions essentielles et le contact. Les éléments secondaires peuvent venir ensuite.',
          'Une page mobile n’est pas une version réduite du bureau. Elle demande une hiérarchie plus stricte et des phrases capables d’être comprises en quelques lignes.',
        ],
      },
      {
        title: 'Donner de l’espace aux actions',
        paragraphs: [
          'Les boutons trop proches, les liens fins et les formulaires serrés créent des erreurs. Les zones cliquables doivent être assez grandes et séparées, même si cela allonge légèrement la page.',
          'Le bouton principal doit rester identifiable sans occuper en permanence une partie importante de l’écran.',
        ],
      },
      {
        title: 'Protéger la vitesse et la stabilité',
        paragraphs: [
          'Les vidéos, les grandes images et les polices multiples peuvent ralentir l’affichage. Chaque média doit avoir une dimension définie afin que la page ne se déplace pas pendant le chargement.',
          'Avant d’ajouter un effet, vérifiez ce qu’il aide à comprendre. S’il n’aide ni la lecture ni l’action, il peut souvent être retiré.',
        ],
      },
    ],
    conclusion:
      'Un bon site mobile paraît simple parce que les décisions difficiles ont été prises en amont : quoi montrer, dans quel ordre et avec quelle action principale.',
  },
  {
    slug: 'construire-une-page-service-vraiment-utile',
    number: '06',
    category: 'Contenu',
    title: 'Construire une page de service vraiment utile',
    excerpt:
      'Une page de service doit aider le visiteur à se reconnaître, à comprendre le périmètre et à préparer une demande exploitable.',
    seoTitle: 'Construire une page de service vraiment utile — Qualifyr',
    seoDescription:
      'Une structure claire pour présenter une prestation, répondre aux hésitations et guider le visiteur vers une demande précise.',
    publishedAt: '2026-08-03T08:00:00+02:00',
    introduction:
      'Une page de service n’est pas une fiche technique. Elle relie un besoin concret à une façon de travailler, puis explique ce qu’il faut fournir pour avancer.',
    sections: [
      {
        title: 'Nommer le besoin avec les mots du client',
        paragraphs: [
          'Le titre doit correspondre à ce que la personne cherche ou tente de résoudre. Les termes internes, les noms de méthode et les formules de marque peuvent être expliqués ensuite.',
          'Décrivez les situations pour lesquelles la prestation est adaptée, mais aussi celles qui demandent une autre approche. Cette précision évite les demandes mal orientées.',
        ],
      },
      {
        title: 'Rendre le périmètre visible',
        paragraphs: [
          'Expliquez ce qui est compris, ce qui dépend d’un échange et les éventuelles conditions. Le visiteur doit pouvoir anticiper la suite sans lire des conditions longues ou deviner ce qui manque.',
        ],
        points: [
          'La situation prise en charge.',
          'Le déroulé essentiel de la prestation.',
          'Les informations nécessaires avant de confirmer.',
          'Le prochain geste attendu du client.',
        ],
      },
      {
        title: 'Terminer par une action liée à la page',
        paragraphs: [
          'Un bouton “Contact” générique perd le contexte que la page vient de construire. Préférez une action précise : décrire le véhicule, présenter le séjour, vérifier la zone ou réserver un échange.',
          'Le formulaire ou le message peut reprendre automatiquement le service consulté afin d’éviter au client de tout répéter.',
        ],
      },
    ],
    conclusion:
      'Une page de service est utile lorsque le visiteur comprend non seulement ce que vous faites, mais aussi si cette prestation lui correspond et comment lancer la demande.',
  },
  {
    slug: 'afficher-ses-prix-sur-un-site-de-services',
    number: '07',
    category: 'Prix',
    title: 'Faut-il afficher ses prix sur un site de services ?',
    excerpt:
      'Afficher un prix peut rassurer ou créer une fausse comparaison. Tout dépend de ce qui est fixe, de ce qui varie et de la manière dont le montant est expliqué.',
    seoTitle: 'Faut-il afficher ses prix sur un site de services ? — Qualifyr',
    seoDescription:
      'Les questions à se poser avant d’afficher un tarif, un prix de départ ou une estimation sur le site d’une entreprise de services.',
    publishedAt: '2026-08-04T08:00:00+02:00',
    introduction:
      'Un prix visible peut faire gagner du temps et aider le client à se situer. Il peut aussi donner une impression inexacte si la prestation dépend fortement de l’état, de la durée, de la zone ou de plusieurs options.',
    sections: [
      {
        title: 'Afficher un prix lorsque le périmètre est stable',
        paragraphs: [
          'Si la prestation comprend toujours les mêmes éléments et que les variations sont limitées, un prix clair réduit les échanges inutiles. Il doit préciser ce qui est inclus et les conditions qui peuvent le modifier.',
          'Une formule simple à comprendre peut être affichée directement. Les options ne doivent pas transformer le montant final en surprise.',
        ],
      },
      {
        title: 'Utiliser un point de départ avec précision',
        paragraphs: [
          'Un “à partir de” n’est utile que si une situation réelle correspond effectivement au montant annoncé. Indiquez ce qui caractérise ce cas et les facteurs qui font évoluer le prix.',
          'Si presque aucune demande ne correspond au prix de départ, mieux vaut présenter une méthode d’estimation ou demander les informations nécessaires.',
        ],
      },
      {
        title: 'Expliquer la valeur avant le montant',
        paragraphs: [
          'Le prix seul invite à comparer des chiffres. Le contexte aide à comparer des prestations : niveau de préparation, périmètre, suivi, conditions et résultat attendu.',
          'Placez le tarif après une explication suffisamment claire pour que le visiteur sache ce qu’il évalue.',
        ],
      },
    ],
    conclusion:
      'La bonne question n’est pas seulement “dois-je afficher mes prix ?”, mais “puis-je expliquer honnêtement ce que le client obtient à ce prix et ce qui peut le faire varier ?”.',
  },
  {
    slug: 'trouver-des-proprietaires-pour-sa-conciergerie',
    number: '08',
    category: 'Conciergerie',
    title: 'Comment trouver des propriétaires pour sa conciergerie',
    excerpt:
      'Le mandat ne se gagne pas au moment du rendez-vous. Il se gagne avant, quand le propriétaire cherche à savoir ce que son bien pourrait rapporter.',
    seoTitle: 'Comment trouver des propriétaires pour sa conciergerie — Qualifyr',
    seoDescription:
      'Les canaux qui apportent réellement des mandats à une conciergerie de location courte durée, et la raison pour laquelle la plupart des demandes se perdent avant l’appel.',
    publishedAt: '2026-08-10T09:00:00+02:00',
    introduction:
      'Une conciergerie ne manque presque jamais de logements à gérer par manque de compétence. Elle en manque parce que les propriétaires ne savent pas qu’elle existe, ou parce qu’ils n’ont pas assez d’éléments pour franchir le pas. La question n’est donc pas seulement “où les trouver”, mais “que doivent-ils comprendre avant d’accepter un rendez-vous”.',
    sections: [
      {
        title: 'Le propriétaire n’achète pas un service, il accepte un risque',
        paragraphs: [
          'Confier un bien à une conciergerie, c’est remettre un appartement de plusieurs centaines de milliers d’euros à quelqu’un que l’on connaît peu, pour y loger des inconnus. La décision n’est pas commerciale, elle est prudentielle.',
          'Cela change complètement l’ordre des arguments. Détailler ses prestations avant d’avoir traité la question du risque revient à répondre à une question que le propriétaire ne s’est pas encore posée.',
        ],
      },
      {
        title: 'Commencer par le chiffre, pas par l’offre',
        paragraphs: [
          'La première chose qu’un propriétaire cherche est un montant : combien mon logement pourrait-il rapporter ? Tant qu’il n’a pas cet ordre de grandeur, il n’a aucune raison d’aller plus loin.',
          'C’est pourquoi une estimation de revenus, présentée sous forme de fourchette honnête et calibrée sur la zone, ouvre plus de conversations que n’importe quelle page de présentation. Elle donne une réponse utile avant de demander quoi que ce soit en retour.',
        ],
      },
      {
        title: 'Les canaux qui produisent vraiment des mandats',
        paragraphs: [
          'Les conciergeries qui se développent ne multiplient pas les canaux : elles en travaillent deux ou trois sérieusement.',
        ],
        points: [
          'La recommandation par les propriétaires déjà gérés — le meilleur taux de transformation, de loin, mais lent à démarrer.',
          'Les partenariats avec agences immobilières, notaires et comptables — un flux régulier et déjà qualifié.',
          'La présence en ligne : site, fiche Google et référencement local — le seul canal qui travaille pendant que vous gérez vos logements.',
          'Le démarchage direct — utile au lancement, difficile à tenir dans la durée.',
        ],
      },
      {
        title: 'Le point où la plupart des demandes se perdent',
        paragraphs: [
          'Beaucoup de conciergeries obtiennent des contacts, puis les perdent entre le premier message et le rendez-vous. Le propriétaire écrit, reçoit une réponse tardive ou générique, et poursuit ailleurs.',
          'Deux corrections suffisent souvent. Recueillir dès la demande la ville, le type de logement, le nombre de biens et la disponibilité, afin de traiter en priorité ce qui est traitable. Et relancer automatiquement ceux qui ne répondent pas : c’est la tâche que personne n’a le temps de faire, et c’est là que se trouve la moitié des mandats perdus.',
        ],
      },
    ],
    conclusion:
      'Trouver des propriétaires est moins une question de volume que d’ordre. Donner un chiffre, traiter le risque, qualifier la demande, relancer sans y penser. Un mandat rapporte plusieurs milliers d’euros par an : il justifie largement de soigner les quelques minutes qui précèdent le premier appel.',
  },
  {
    slug: 'combien-facturer-conciergerie-airbnb',
    number: '09',
    category: 'Conciergerie',
    title: 'Combien facturer quand on lance sa conciergerie ?',
    excerpt:
      'La commission n’est qu’une partie de la réponse. Ce qui décide de votre rentabilité, c’est ce qu’elle inclut et le temps que chaque logement vous coûte réellement.',
    seoTitle: 'Combien facturer sa conciergerie Airbnb ? — Qualifyr',
    seoDescription:
      'Commission, frais de ménage, forfait de mise en service : comment construire une grille tarifaire de conciergerie qui tient sur la durée.',
    publishedAt: '2026-08-10T11:00:00+02:00',
    introduction:
      'La question arrive toujours dans cet ordre : quel pourcentage prendre ? C’est pourtant la dernière à traiter. Une commission ne veut rien dire tant qu’on n’a pas défini ce qu’elle couvre, ni combien d’heures un logement consomme chaque mois.',
    sections: [
      {
        title: 'Partir du temps réel, pas du marché',
        paragraphs: [
          'Un logement demande du temps de manière très inégale : la mise en ligne, les premières semaines et la haute saison concentrent l’essentiel de la charge. Comptez les heures sur un cycle complet plutôt que sur un mois calme.',
          'Ce calcul donne un plancher. En dessous, chaque logement supplémentaire vous appauvrit — et c’est ce qui arrive aux conciergeries qui alignent leur commission sur celle du voisin sans avoir mesuré leur propre organisation.',
        ],
      },
      {
        title: 'Séparer ce qui est récurrent de ce qui est ponctuel',
        paragraphs: [
          'Trois lignes suffisent le plus souvent : une commission sur les revenus, un forfait de mise en service au démarrage, et le ménage refacturé au voyageur.',
          'Le forfait de démarrage est celui qu’on oublie le plus souvent. Il couvre les photographies, la rédaction de l’annonce, l’installation des équipements manquants et la déclaration en mairie. Sans lui, vous financez l’installation d’un bien qui peut vous quitter au bout de six mois.',
        ],
        points: [
          'Commission : votre rémunération récurrente.',
          'Mise en service : le travail non répétable du démarrage.',
          'Ménage : refacturé, jamais absorbé.',
          'Interventions exceptionnelles : facturées à l’heure, annoncées d’avance.',
        ],
      },
      {
        title: 'Assumer une commission plus haute et la justifier',
        paragraphs: [
          'Baisser sa commission pour signer est le réflexe le plus coûteux du métier : vous attirez les propriétaires les plus exigeants sur le prix, qui sont aussi les plus difficiles à satisfaire.',
          'Un point de commission se défend par ce qu’il produit. Une annonce mieux rédigée, une tarification ajustée au jour le jour et une meilleure réactivité augmentent le revenu du propriétaire bien au-delà de l’écart de commission. Montrez ce calcul plutôt que de négocier le pourcentage.',
        ],
      },
    ],
    conclusion:
      'Une grille tarifaire tient quand vous pouvez expliquer chaque ligne en une phrase et qu’aucune ne vous fait perdre d’argent. Si vous hésitez à annoncer votre commission, c’est rarement qu’elle est trop élevée — c’est qu’elle n’est pas encore adossée à ce qu’elle finance.',
  },
  {
    slug: 'convaincre-un-proprietaire-de-confier-son-bien',
    number: '10',
    category: 'Conciergerie',
    title: 'Convaincre un propriétaire de vous confier son bien',
    excerpt:
      'Il ne compare pas des prestations, il évalue un risque. Tant que ce risque n’est pas traité, aucun argument de service ne porte.',
    seoTitle: 'Convaincre un propriétaire — conciergerie | Qualifyr',
    seoDescription:
      'Pourquoi les propriétaires hésitent, dans quel ordre traiter leurs objections, et ce qui fait vraiment basculer une décision de mandat.',
    publishedAt: '2026-08-10T12:00:00+02:00',
    introduction:
      'Un propriétaire qui hésite ne se demande pas si votre service est bon. Il se demande ce qu’il risque à confier un bien de plusieurs centaines de milliers d’euros à quelqu’un qu’il connaît peu, pour y loger des inconnus. Répondre à côté de cette question fait perdre la majorité des dossiers.',
    sections: [
      {
        title: 'Donner le chiffre avant tout le reste',
        paragraphs: [
          'La première question est toujours la même : combien mon logement rapporterait-il ? Tant qu’il n’a pas d’ordre de grandeur, le propriétaire n’a aucune raison d’engager une conversation.',
          'Une fourchette honnête vaut mieux qu’un montant précis. Elle montre que vous connaissez votre marché sans promettre ce que vous ne maîtrisez pas — et elle vous protège le jour où la saison est mauvaise.',
        ],
      },
      {
        title: 'Traiter les quatre objections dans l’ordre',
        paragraphs: [
          'Elles reviennent presque toujours, et presque toujours dans cet ordre. Les anticiper évite de les subir au milieu d’un rendez-vous.',
        ],
        points: [
          'Puis-je encore utiliser mon logement ? Le calendrier reste sous son contrôle.',
          'Qui gère les voyageurs ? Vous, entièrement, sans le solliciter.',
          'Et les dégradations ? Garanties des plateformes et filtrage des réservations.',
          'Suis-je engagé ? Précisez la durée et les conditions de sortie, sans détour.',
        ],
      },
      {
        title: 'Montrer l’écart, pas le montant',
        paragraphs: [
          'Un propriétaire qui loue déjà à l’année ne se lève pas pour gagner plus : il se lève pour arrêter de perdre. Comparez ce qu’il touche aujourd’hui et ce qu’il pourrait toucher, nettement, une fois votre commission déduite.',
          'C’est cet écart qu’il répétera à son conjoint le soir même. Le revenu brut, lui, s’oublie en dix minutes.',
        ],
      },
      {
        title: 'Rappeler vite',
        paragraphs: [
          'Une demande traitée dans la journée n’a pas le même destin qu’une demande rappelée la semaine suivante. Entre-temps, le propriétaire a parlé à deux concurrents, ou a simplement laissé retomber son projet.',
          'Si vous ne deviez suivre qu’une seule règle dans tout cet article, ce serait celle-là.',
        ],
      },
    ],
    conclusion:
      'Convaincre un propriétaire tient moins à l’argumentaire qu’à l’ordre : un chiffre, puis le risque, puis l’écart, puis un rappel rapide. Les conciergeries qui signent le plus ne sont pas celles qui parlent le mieux de leur service — ce sont celles qui répondent aux questions qu’on ne leur pose pas à voix haute.',
  },
  {
    slug: 'trouver-des-clients-en-detailing',
    number: '11',
    category: 'Nettoyage automobile',
    title: 'Trouver des clients en detailing sans dépendre d’Instagram',
    excerpt:
      'Instagram vous fait découvrir, mais il ne remplit pas un agenda. Ce qui manque à la plupart des detailers se situe juste après la découverte.',
    seoTitle: 'Trouver des clients en detailing automobile — Qualifyr',
    seoDescription:
      'Pourquoi les réseaux sociaux ne suffisent pas à remplir un agenda de detailing, et quels canaux apportent réellement des réservations.',
    publishedAt: '2026-08-10T13:00:00+02:00',
    introduction:
      'La plupart des professionnels du detailing ont une vitrine correcte : un compte Instagram, de belles photos, des avant-après convaincants. Et pourtant leur agenda reste irrégulier. Le problème n’est presque jamais la visibilité — c’est ce qui se passe entre l’instant où quelqu’un admire votre travail et celui où il réserve.',
    sections: [
      {
        title: 'Ce qu’Instagram ne fait pas',
        paragraphs: [
          'Il ne prend pas de rendez-vous. Il ne classe pas vos tarifs par type de véhicule. Il n’encaisse pas d’acompte, donc il ne protège pas vos créneaux. Et surtout, il n’existe pas sur Google : celui qui cherche un detailer dans sa ville ne tombera jamais sur un compte social.',
          'Ces clients-là, vous ne les voyez même pas passer. C’est la partie invisible de votre manque à gagner.',
        ],
      },
      {
        title: 'Les trois canaux qui apportent vraiment des réservations',
        paragraphs: [
          'Aucun n’est spectaculaire, tous se cumulent.',
        ],
        points: [
          'La fiche Google : la première chose que consulte quelqu’un qui cherche près de chez lui.',
          'Une page qui permet de réserver, pas seulement d’admirer.',
          'La recommandation, entretenue par une demande d’avis au bon moment.',
        ],
      },
      {
        title: 'Supprimer les frictions plutôt qu’ajouter du contenu',
        paragraphs: [
          'Publier davantage ne compense pas un parcours qui perd les gens. Trois obstacles reviennent systématiquement : des tarifs impossibles à comparer, une zone d’intervention floue, et une réservation qui passe par une conversation privée le soir.',
          'Corriger ces trois points fait plus pour votre agenda que trois mois de publications supplémentaires.',
        ],
      },
      {
        title: 'Sécuriser les créneaux',
        paragraphs: [
          'Un rendez-vous non honoré coûte une demi-journée. Un acompte à la réservation supprime l’essentiel des désistements, et n’a jamais fait fuir un client sérieux.',
          'C’est aussi un signal de professionnalisme : personne ne s’étonne de verser un acompte chez un garagiste.',
        ],
      },
    ],
    conclusion:
      'Gardez Instagram pour ce qu’il fait très bien : montrer votre niveau de finition. Mais ajoutez derrière un chemin qui permet de comparer, de choisir et de réserver. La plupart des detailers n’ont pas un problème d’audience — ils ont un problème de conversion.',
  },
  {
    slug: 'grille-tarifaire-detailing-par-vehicule',
    number: '12',
    category: 'Nettoyage automobile',
    title: 'Construire une grille tarifaire de detailing lisible',
    excerpt:
      'Un client qui ne comprend pas votre grille ne négocie pas : il n’écrit pas. Voici comment structurer des tarifs qui décident à votre place.',
    seoTitle: 'Grille tarifaire detailing par type de véhicule — Qualifyr',
    seoDescription:
      'Formules, suppléments et tarifs par gabarit : comment présenter ses prix de detailing pour supprimer les questions et accélérer la réservation.',
    publishedAt: '2026-08-10T14:00:00+02:00',
    introduction:
      'La question « c’est combien pour un SUV ? » revient des dizaines de fois par mois. Chaque occurrence est le symptôme d’une grille qui ne répond pas d’elle-même — et chaque réponse manuelle est du temps qui ne vous est pas payé.',
    sections: [
      {
        title: 'Trois formules, pas sept',
        paragraphs: [
          'Au-delà de trois niveaux, le client ne compare plus : il reporte. Distinguez l’entretien courant, la remise en état et la préparation avant vente ou avant remise du véhicule.',
          'Chaque formule doit répondre à une situation, pas à une liste d’opérations. Le client se reconnaît dans une situation ; il se perd dans un inventaire technique.',
        ],
      },
      {
        title: 'Le gabarit plutôt que le modèle',
        paragraphs: [
          'Trois catégories suffisent : citadine, berline ou break, SUV et utilitaire. Elles couvrent l’essentiel du parc et évitent d’avoir à trancher au cas par cas.',
          'Affichez un prix par formule et par gabarit. Le tableau paraît plus long, mais il supprime la totalité des messages de demande de devis.',
        ],
      },
      {
        title: 'Les suppléments annoncés d’avance',
        paragraphs: [
          'Poils d’animaux, taches organiques, véhicule très encrassé, déplacement au-delà d’une certaine distance : ces situations existent, elles ont un coût, et les découvrir sur place crée un malaise.',
          'Annoncées à l’avance, elles rassurent : le client comprend que votre prix de base correspond à un travail précis, pas à une estimation optimiste.',
        ],
        points: [
          'Un supplément nommé, avec son montant.',
          'La condition qui le déclenche, en une phrase.',
          'La possibilité de le confirmer avant l’intervention.',
        ],
      },
    ],
    conclusion:
      'Une grille lisible ne sert pas à justifier vos prix, elle sert à ce que le client décide sans vous écrire. Chaque question qu’elle supprime est une réservation qui arrive plus vite, et une soirée que vous ne passez pas à répondre à des messages.',
  },
] as const satisfies readonly BlogArticle[];

export function isArticlePublished(article: BlogArticle, now = new Date()): boolean {
  return new Date(article.publishedAt).getTime() <= now.getTime();
}

export function getPublishedArticles(now = new Date()): readonly BlogArticle[] {
  return [...blogArticles]
    .filter((article) => isArticlePublished(article, now))
    .sort(
      (left, right) =>
        new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
    );
}

export function getPublishedArticleBySlug(
  slug: string,
  now = new Date(),
): BlogArticle | undefined {
  return blogArticles.find(
    (article) => article.slug === slug && isArticlePublished(article, now),
  );
}

export function formatArticleDate(article: BlogArticle): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(new Date(article.publishedAt));
}

export function readingTime(article: BlogArticle): number {
  const text = [
    article.title,
    article.excerpt,
    article.introduction,
    ...article.sections.flatMap((section) => [
      section.title,
      ...section.paragraphs,
      ...(section.points ?? []),
    ]),
    article.conclusion,
  ].join(' ');

  return Math.max(1, Math.ceil(text.trim().split(/\s+/u).length / 210));
}
