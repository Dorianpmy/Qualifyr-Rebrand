# 02 — Arborescence du site

Structure courte et volontairement fermée. Le journal validé le 31 juillet 2026 ajoute une
rubrique éditoriale et ses articles, sans modifier les pages commerciales existantes.

---

## 1. Vue d'ensemble

```
/                          Accueil
/creation-site-web         Création de site web
/nettoyage-automobile      Expertise nettoyage automobile mobile et detailing
/conciergerie              Expertise conciergeries
/methode                   Méthode
/realisations              Réalisations
/a-propos                  À propos
/diagnostic                Diagnostic
/estimation                Première estimation guidée
/contact                   Contact
/blog                      Journal Qualifyr
/blog/[slug]               Article du journal
/mentions-legales          Mentions légales
/politique-de-confidentialite   Politique de confidentialité
```

Sous-page ajoutée à la phase 3, développée à la phase 5 :

```
/realisations/sw-car-cleaning   Étude de cas SW Carcleaning
```

Étude de cas complète en cinq sections : contexte, objectifs, travail réalisé, détails
visuels, enseignement. Elle n'apparaît dans aucune navigation — on y accède depuis l'accueil
et depuis `/realisations`.

**Aucun résultat n'y est affiché** : ni chiffre, ni pourcentage, ni date, ni témoignage.
La section « Détails visuels » est masquée tant qu'aucune photographie réelle n'est fournie.
Inventaire des manques : `docs/06-assets-sw-car-cleaning.md`.

Pages système (non listées dans la navigation) :

```
/404                       Page non trouvée
/api/diagnostic            Réception du formulaire de diagnostic (POST)
/api/contact               Réception du formulaire de contact (POST)
/robots.txt                Généré, piloté par site.indexable
/sitemap.xml               Généré, piloté par site.indexable
/design-system             Planche de référence — 404 en production
```

Le site comprend également une relance de contact globale, affichée une seule fois par
chargement après environ soixante secondes sans interaction. Elle ne crée aucune URL, ne promet
aucune disponibilité et propose uniquement un échange WhatsApp ou la poursuite de la lecture.
Elle doit rester fermable au clavier et ne jamais réapparaître après fermeture pendant la
navigation courante.

**Note d'URL** : la page de confidentialité vit à `/politique-de-confidentialite`, et non
`/politique-confidentialite`. La forme longue est grammaticalement correcte et déjà câblée
partout — navigation, pied de page, lien de consentement, sitemap, type `Route`. Le renommage
reste possible tant que le site n'est pas en ligne ; il n'a pas été fait de notre propre
initiative.

Les confirmations d'envoi s'affichent **à la place du formulaire**, sans changement d'URL :
les pages `/diagnostic/merci` et `/contact/merci` envisagées à la phase 0 ne sont pas créées.

**Interdit en V1** : page « Solutions », page « Services » listant des métiers,
page « Tarifs », page « Ressources », page « FAQ » autonome, landing pages sectorielles
non validées. Les routes `/nettoyage-automobile` et `/conciergerie` sont les deux seules
exceptions métier autorisées : elles correspondent exactement aux deux verticales
officielles et ne créent pas une nouvelle offre.
La page `/creation-site-web` est une exception éditoriale validée : elle explique un service
réel et renvoie vers une preuve réelle, sans ajouter de métier ni de promesse commerciale.
Le journal est la seconde exception validée : il apporte des conseils éditoriaux utiles et
ne crée aucune nouvelle offre.

---

## 2. Navigation

**Navigation principale**

`Expertise` · `Réalisation` · `Journal` · `À propos` · `Contact` ·
**`Discuter sur WhatsApp`** *(bouton)*

- Le logo renvoie à l'accueil ; « Accueil » n'apparaît pas dans le menu.
- « Expertise » et « Réalisation » rejoignent les sections correspondantes de l'accueil.
- Les deux expertises métier sont accessibles depuis la section « Entreprises accompagnées »
  de l'accueil et depuis le pied de page. Le header reste volontairement court et ne reçoit
  pas de sous-menu.
- Sur mobile : menu plein écran et accès direct à WhatsApp.

**Pied de page**

- Bloc d'appel à l'action global : estimation puis diagnostic.
- Colonne 1 : logo, description courte et réseaux sociaux réellement configurés.
- Colonne 2 : services renvoyant uniquement vers des routes ou ancres existantes.
- Colonne 3 : Réalisations, Méthode, À propos et Contact.
- Colonne 4 : coordonnées réellement renseignées, calendrier réellement configuré et zone
  d'accompagnement (France, Belgique, Suisse, Luxembourg).
- Ligne basse : copyright, Mentions légales, Politique de confidentialité et accès direct à
  la section Cookies de cette politique.

Les entrées « Développement SaaS » et « Automatisation » demandées dans le brief du footer ne
sont pas publiées : ces termes sont interdits par `AGENTS.md` et `docs/01`. Aucun lien vers
une FAQ n'est affiché tant qu'aucune route ou section publique correspondante n'existe.

---

## 3. Détail des pages

### `/` — Accueil

Objectif : comprendre en dix secondes pour qui, pourquoi et quoi faire ensuite.

Sections, dans l'ordre :

1. **En-tête compact et ligne éditoriale** — marque, navigation et trois repères courts.
2. **Ouverture vidéo** — promesse, calendrier, diagnostic et lien vers la preuve.
3. **Transformation** — être compris, être choisi, être contacté.
4. **Réalisation sélectionnée** — SW Car Cleaning, présentée une seule fois, sans résultat
   chiffré ni faux visuel.
5. **Entreprises accompagnées** — les deux verticales officielles, chacune reliée à sa page.
6. **Méthode** — Comprendre, Clarifier, Concevoir, Améliorer dans une frise compacte.
7. **Clôture** — calendrier, diagnostic et lien vers l'estimation.

Le Journal reste accessible depuis sa route dédiée. Le configurateur tarifaire est retiré de
l'accueil et vit uniquement à `/estimation`, afin que le prix soit consulté volontairement et
ne rallonge pas le parcours éditorial principal.

À ne pas mettre : FAQ complète, comparaison avant/après, longue liste de fonctionnalités,
bandeau de logos, compteur de clients, témoignage, comparatif de formules ou faux écran.
Le configurateur tarifaire n'est jamais rendu dans la page d'accueil.

### `/nettoyage-automobile` — Nettoyage automobile mobile et detailing

Objectif : montrer aux professionnels du secteur comment Qualifyr clarifie les prestations,
la zone d'intervention et la prise de rendez-vous.

Structure courte : hero métier, trois freins, trois éléments construits, parcours adapté,
réalisation réelle SW Carcleaning, méthode en quatre temps, FAQ métier et appel à l'action.
La page ne présente aucun résultat chiffré ni élément client non fourni.

### `/conciergerie` — Conciergeries

Objectif : montrer comment Qualifyr rend un accompagnement plus lisible et une première
demande plus précise et rassurante.

Structure courte : hero métier, trois freins, trois éléments construits, parcours adapté,
simulateur de revenus locatifs présenté en démonstration, méthode en quatre temps,
FAQ métier et appel à l'action. Aucune démonstration n'est présentée comme une réalisation livrée.

### `/estimation` — Première estimation

Objectif : donner une orientation et un coût indicatif sans transformer l'accueil en page
tarifaire. La route réutilise le composant `OfferConfigurator`, sa logique régionale, ses cinq
étapes, son récapitulatif, son accès WhatsApp et son calendrier. Elle ne duplique ni les données
ni le calcul. La devise est déterminée automatiquement par le pays fourni par l'hébergeur, sans
choix de pays dans l'interface. Le résultat présente d'abord l'équivalent mensuel sur 12 mois,
puis le total et l'alternative « mise en place + suivi ». Il reste indicatif jusqu'au cadrage et
au devis.

---

### `/blog` — Le journal

Objectif : répondre aux questions concrètes que se posent les entreprises de services avant
de clarifier leur offre, leur identité, leur site ou leur parcours de contact.

Structure :

1. Ouverture courte — « Des repères pour mieux présenter et développer votre activité. »
2. Dernier article publié, traité comme une une éditoriale.
3. Articles précédents, dans l'ordre antéchronologique.
4. Appel à l'action discret vers le diagnostic.

Les articles programmés ne sont ni listés, ni accessibles, ni ajoutés au sitemap avant leur
date de publication. Le calendrier est relu au moins toutes les heures par le rendu serveur.
Une programmation ne remplace jamais la rédaction : chaque article existe en entier avant
d'être planifié.

### `/blog/[slug]` — Article du journal

Un seul sujet par page, un seul H1, un chapô, des sections courtes et une conclusion utile.
Chaque article dispose de son title, de sa description, de son canonical et d'un schéma
`BlogPosting`. Aucun témoignage, résultat, chiffre commercial ou exemple client n'est
inventé. Une publication future renvoie une 404 jusqu'à sa date prévue.

---

### `/methode` — Méthode

Objectif : rendre le parcours crédible en montrant la manière de travailler.

Sections :

1. Ouverture courte et index des quatre temps.
2. Les quatre temps regroupés dans une même composition : intention, trois points concrets et
   aucune sous-section pleine hauteur.
3. Adaptation aux deux métiers et principe d'outillage réunis dans une seule clôture compacte.

La page détaille la méthode sans répéter l'accueil ni transformer chaque étape en écran
autonome. L'appel à l'action global du pied de page assure la suite du parcours.

---

### `/creation-site-web` — Création de site web

Objectif : répondre clairement aux entreprises qui cherchent un partenaire pour créer ou
refaire leur site, et donner aux moteurs une page précise à comprendre et à citer.

Structure :

1. Ouverture — résultat attendu, sans promesse chiffrée.
2. Ce que le site doit permettre de comprendre et de faire.
3. Ce que Qualifyr conçoit réellement.
4. Déroulé du projet, sans délai inventé.
5. Preuve réelle — SW Carcleaning.
6. Appel à l'action de clôture.

---

### `/realisations` — Réalisations

Objectif : montrer du travail réel.

Structure :

1. Ouverture courte.
2. **SW Carcleaning** — présentation du contexte, du besoin, de ce qui a été mis en place,
   visuels réels. **Aucun résultat chiffré.**
3. Appel à l'action de clôture.

Règles :

- Une seule réalisation tant qu'il n'y en a qu'une. Pas de grille remplie de cases vides.
- Pas de « projet fictif », pas de « concept », pas de maquette présentée comme un client.
- Chaque visuel doit être une image réelle et autorisée.

Si aucun visuel n'est autorisé au moment de l'intégration : la page se réduit à un récit
textuel honnête, et le manque est signalé dans `docs/06-assets-sw-car-cleaning.md` — jamais
sur la page elle-même.

---

### `/a-propos` — À propos

Objectif : donner un visage et une raison de faire confiance.

Sections :

1. Qui est derrière Qualifyr.
2. Pourquoi ce métier en particulier — l'origine du choix de la verticale.
3. La façon de travailler : exigence, simplicité, suivi.
4. Appel à l'action de clôture.

Pas de « notre équipe » si l'équipe n'existe pas. Pas de photos de banque d'images pour
simuler des collaborateurs.

---

### `/diagnostic` — Diagnostic

Objectif : aider une entreprise de services à formuler sa situation avant tout échange,
sans score automatique ni recommandation inventée.

Contenu :

1. Introduction autonome : durée indicative sobre, contenu du parcours et bouton
   « Commencer ».
2. Cinq étapes courtes :
   - **Votre activité** : métier, précision obligatoire pour « autre », entreprise, site
     et précision facultative adaptée au nettoyage automobile ou à la conciergerie ;
   - **Votre situation actuelle** : situation principale, trois origines de demandes au
     maximum et frustration facultative ;
   - **Votre priorité** : deux objectifs au maximum et résultat souhaité facultatif ;
   - **Votre projet** : horizon, état du budget, montant facultatif et contraintes ;
   - **Vos coordonnées** : prénom, nom facultatif, e-mail professionnel, téléphone
     facultatif, préférence de contact et consentement.
3. Vérification complète, avec retour éditable vers chaque étape.
4. Confirmation uniquement après une réponse réussie de `POST /api/diagnostic`, puis accès
   secondaire à WhatsApp et au calendrier lorsqu'ils sont configurés.
5. Aucune mention de gratuité, d'urgence, de résultat automatique ou de place limitée.

État à la phase 6 : **formulaire en service.** Validation partagée client/serveur (Zod),
saisies conservées en cas d'erreur, focus porté sur le premier champ fautif, état d'envoi,
double envoi impossible, champ piège et temps minimal, limitation de débit par adresse IP.

La route `/diagnostic` est l'unique source de vérité. Il n'existe plus de questionnaire
parallèle dans une modale WhatsApp. Un CTA de diagnostic mène toujours à cette route ; un CTA
WhatsApp direct ouvre seulement une conversation courte.

La confirmation remplace le formulaire **sur place** : aucune redirection, aucune page
`/diagnostic/merci`. Les réponses en cours peuvent être conservées temporairement dans
`sessionStorage`, mais leur reprise ou leur abandon exige un choix explicite.

Si l'envoi échoue ou si le service d'e-mail n'est pas configuré, la réponse le dit franchement
et **ne prétend jamais que le message est parti**. WhatsApp peut alors servir de repli manuel,
avec un libellé qui indique clairement que l'envoi serveur a échoué.

---

### `/contact` — Contact

Objectif : permettre un contact direct, sans qualification.

Contenu :

1. Une phrase d'orientation : « Pour une demande d'accompagnement, passez plutôt par le
   diagnostic. Pour toute autre question, écrivez-nous. »
2. Coordonnées réelles (e-mail, et téléphone si Dorian le souhaite).
3. Formulaire court : prénom et nom, e-mail, entreprise (facultative), message,
   consentement lié à la politique de confidentialité.

---

### `/mentions-legales` et `/politique-de-confidentialite`

Pages sobres, une colonne, typographie éditoriale, largeur de lecture réduite.

Contenu à fournir à partir des informations réelles de la structure : éditeur, hébergeur,
directeur de publication, responsable de traitement, finalités et bases légales, durées de
conservation, destinataires, droits des personnes, cookies éventuels.

Tant que les informations juridiques réelles ne sont pas fournies, ces pages restent marquées
`TODO_CONTENU_REEL` et ne sont pas publiées avec du contenu générique.

---

### `/404`

Message court, ton calme, lien vers l'accueil et vers le diagnostic. Même identité que le reste
du site.

---

## 4. Maillage interne

- Chaque page se termine par le même bloc d'appel à l'action vers `/diagnostic`.
- L'accueil renvoie vers `/methode` et `/realisations`.
- `/methode` renvoie vers `/realisations`.
- `/realisations` renvoie vers `/methode`.
- `/contact` renvoie vers `/diagnostic`.
- Aucune page orpheline : toute page est atteignable depuis l'en-tête ou le pied de page.

---

## 5. Extensions envisagées après la V1

Hors périmètre actuel, listées uniquement pour éviter que la structure V1 ne les empêche :

- une seconde réalisation, quand elle existera ;
- une section de témoignages, quand des témoignages réels auront été recueillis et autorisés ;
- des pages de zone géographique, si la stratégie locale le justifie ;
- un espace éditorial, si un rythme de publication est réellement tenable.

Aucun de ces éléments ne doit être préparé, esquissé ou stylé pendant la V1.
