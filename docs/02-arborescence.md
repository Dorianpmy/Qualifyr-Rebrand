# 02 — Arborescence du site

Structure courte et volontairement fermée. Huit pages, pas une de plus en V1.

---

## 1. Vue d'ensemble

```
/                          Accueil
/methode                   Méthode
/realisations              Réalisations
/a-propos                  À propos
/diagnostic                Diagnostic
/contact                   Contact
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
chargement après environ vingt secondes sans interaction. Elle ne crée aucune URL, ne promet
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

**Interdit en V1** : page « Solutions », page « Services » listant des métiers, page « Blog »,
page « Tarifs », page « Ressources », page « FAQ » autonome, landing pages sectorielles.

---

## 2. Navigation

**Navigation principale**

`Notre offre` · `Réalisation` · `Laboratoire` · `À propos` · `Contact` ·
**`Discuter sur WhatsApp`** *(bouton)*

- Le logo renvoie à l'accueil ; « Accueil » n'apparaît pas dans le menu.
- Les trois premières entrées rejoignent les sections correspondantes de l'accueil.
- Sur mobile : menu plein écran et accès direct à WhatsApp.

**Pied de page**

- Colonne 1 : logo, promesse en une ligne, canal de contact.
- Colonne 2 : Méthode, Réalisations, À propos, Diagnostic, Contact.
- Colonne 3 : Mentions légales, Politique de confidentialité.
- Ligne basse : « Qualifyr Agence — Nettoyage automobile mobile et conciergeries » + année.

---

## 3. Détail des pages

### `/` — Accueil

Objectif : comprendre en dix secondes pour qui, pourquoi et quoi faire ensuite.

Sections, dans l'ordre :

1. **Ouverture** — proposition concrète, réservation, diagnostic WhatsApp et lien vers la preuve.
2. **Réalisation** — SW Car Cleaning, sans résultat chiffré ni faux visuel.
3. **Pour qui** — nettoyage automobile mobile, detailing et conciergeries.
4. **Fonctionnement** — Comprendre, Construire, Faire évoluer.
5. **Laboratoire créatif** — une réalisation réelle dominante et trois concepts clairement
   signalés, sans faux client ni fausse vidéo.
6. **Ce que Qualifyr construit** — parcours progressif placé après les preuves : métier,
   frein principal, besoins, puis recommandation de l'offre avec prix de mise en place,
   mensualité, engagement et coût total avant la prise de contact.
7. **Clôture** — réservation et diagnostic WhatsApp.

À ne pas mettre : FAQ complète, comparaison avant/après, longue liste de fonctionnalités,
bandeau de logos, compteur de clients, témoignage, comparatif de formules ou faux écran.
Le choix guidé n'est pas une grille d'abonnements : il compose l'offre unique selon le besoin.

---

### `/methode` — Méthode

Objectif : rendre le parcours crédible en montrant la manière de travailler.

Sections :

1. Ouverture — « La méthode Qualifyr » + une phrase de cadrage.
2. Les six étapes du parcours, une section par étape : ce qu'on regarde, ce qu'on met en place,
   ce que ça change pour l'activité.
3. Le déroulé d'une collaboration : cadrage → conception → mise en place → ajustement.
   Sans durée chiffrée tant qu'elle n'est pas un engagement réel.
4. Ce que Qualifyr ne fait pas — section courte et assumée, forte en différenciation.
5. Appel à l'action de clôture.

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

Objectif : recueillir une demande qualifiée, et expliquer honnêtement la suite.

Contenu :

1. Titre + explication de ce qu'est un diagnostic : un échange de cadrage sur l'activité,
   la zone, les prestations et les points de blocage.
2. **Ce qui se passe après l'envoi** — étapes explicites, sans promesse de délai non tenue.
3. Formulaire, en deux temps pour rester léger sur mobile :
   - **Votre activité** : nom de l'entreprise, ville et zone d'intervention, ancienneté,
     types de prestations proposées, travaillez-vous seul ou à plusieurs.
   - **Votre situation** : comment les clients vous trouvent aujourd'hui, ce qui vous freine
     le plus, site existant (URL facultative), ce que vous aimeriez changer.
   - **Vos coordonnées** : prénom et nom, e-mail, téléphone (facultatif), consentement RGPD.
4. Aucune mention de gratuité, d'urgence ou de place limitée.

État à la phase 6 : **formulaire en service.** Validation partagée client/serveur (Zod),
saisies conservées en cas d'erreur, focus porté sur le premier champ fautif, état d'envoi,
double envoi impossible, champ piège et temps minimal, limitation de débit par adresse IP.

La confirmation remplace le formulaire **sur place** : aucune redirection, aucune page
`/diagnostic/merci` — la personne reste où elle est. Les deux pages de remerciement
initialement prévues ne sont donc pas créées.

Si le service d'e-mail n'est pas configuré, la réponse le dit franchement et **ne prétend
jamais que le message est parti**.

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
