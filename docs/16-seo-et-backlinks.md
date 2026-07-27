# 16 — SEO et développement des liens

## Objectif

Positionner Qualifyr sur des recherches B2B précises liées à la création d'un site et d'un
parcours client pour les entreprises de nettoyage automobile mobile, le detailing à domicile
et les conciergeries. Aucun mot-clé sans rapport avec ces deux verticales n'est ciblé.

## Socle technique livré

- titres et descriptions uniques par page ;
- URL canoniques absolues ;
- Open Graph et carte de partage ;
- données structurées `Organization`, `WebSite` et fils d'Ariane ;
- `robots.txt` et `sitemap.xml` pilotés par `NEXT_PUBLIC_SITE_INDEXABLE` ;
- maillage interne depuis l'accueil, le menu et le pied de page ;
- pages d'étude de cas accessibles et descriptives ;
- aperçus et environnements non finaux maintenus hors index.

## Plan de liens externes honnête

Un lien n'est publié que si le profil, le projet, le partenaire ou la relation existe réellement.
Qualifyr n'achète pas de lots de liens et ne crée pas de faux annuaires.

1. Faire ajouter un crédit discret « Parcours conçu par Qualifyr » sur SW Car Cleaning, avec
   accord écrit et lien vers l'étude de cas correspondante.
2. Créer ou revendiquer les profils d'entreprise réellement éligibles : Google Business
   Profile et Bing Places. Utiliser les mêmes coordonnées et la même description partout.
3. Demander aux futurs clients livrés de citer Qualifyr depuis leur page partenaires ou leurs
   mentions de réalisation, uniquement si cette attribution leur convient.
4. Publier des études de cas réelles assez utiles pour être reprises par des associations,
   médias ou communautés professionnelles du detailing et de la conciergerie.
5. Rechercher des partenariats éditoriaux ciblés avec des organismes réellement fréquentés
   par les deux verticales. Chaque contenu doit apporter une méthode ou un retour d'expérience,
   pas seulement un lien.

## Après la mise en production

1. Poser `NEXT_PUBLIC_SITE_INDEXABLE=true` en production seulement, puis redéployer.
2. Vérifier `/robots.txt` et `/sitemap.xml` sur le domaine final.
3. Ajouter le domaine à Google Search Console et Bing Webmaster Tools.
4. Envoyer `https://qualifyragence.com/sitemap.xml` dans les deux outils.
5. Contrôler l'indexation, les requêtes et les erreurs chaque semaine pendant le premier mois.
6. Ne créer des pages supplémentaires que lorsqu'une intention et un contenu réel les justifient.

## Indicateurs à suivre

- pages indexées et pages exclues ;
- impressions sur les recherches liées aux deux verticales ;
- clics vers WhatsApp, le diagnostic et la réservation ;
- domaines référents réellement pertinents ;
- demandes reçues et pages qui les ont préparées.
