# 09 — Changelog V1

## 1er août 2026 — refonte de `/diagnostic`

- Remplacement du formulaire vertical par une introduction, cinq étapes courtes et un écran
  de vérification modifiable.
- Ajout d'une progression exacte, d'une sauvegarde de session et d'états clavier/reduced
  motion cohérents avec la direction artistique.
- Conservation de la validation client et serveur, de l'endpoint e-mail, du champ piège et
  de la limitation de débit.
- Séparation des actions : les CTA diagnostic ouvrent `/diagnostic`, les CTA WhatsApp directs
  n'ouvrent qu'une conversation courte ; l'ancienne modale de diagnostic est supprimée.
- Envoi systématique vers `POST /api/diagnostic` avant toute confirmation. WhatsApp et le
  calendrier deviennent des suites facultatives après réussite, ou un repli honnête après
  échec pour WhatsApp.
- Ajout des branches métier nettoyage automobile, conciergerie et autre service, ainsi que
  d'une reprise de session explicitement acceptée ou refusée.
- Aucun score, conseil automatique, délai de réponse, résultat ou disponibilité inventé.

Reconstruction complète du site de Qualifyr Agence, depuis un dépôt vide.
Branche `feature/qualifyr-rebrand-v1`. **Rien n'est déployé, le domaine n'est pas connecté.**

**Évolution de positionnement — 27 juillet 2026 :** Qualifyr conserve une offre unique,
`Le parcours Qualifyr`, désormais adaptée à deux verticales officielles : nettoyage
automobile mobile / detailing à domicile et conciergeries. Aucun faux projet de
conciergerie n'a été ajouté ; SW Carcleaning reste la réalisation réelle publiée.

**Accueil resserré — 27 juillet 2026 :** la page d'accueil passe à six grandes sections.
La comparaison avant/après, les piliers redondants, la liste détaillée de l'offre et la FAQ
complète sont retirés de l'accueil au profit des pages internes.

**Diagnostic guidé — 1er août 2026 :** le formulaire continu devient un parcours en cinq
étapes — activité, situation, priorité, projet et coordonnées — avec progression accessible,
validation avant chaque passage, vérification modifiable et conservation temporaire des
réponses. La personne choisit explicitement de reprendre ou de recommencer une saisie.

---

## 1. Les neuf phases de fabrication

La V1 a été reçue sous forme d'archive puis importée dans ce dépôt en un commit racine.
Les hashes de travail mentionnés dans les documents sources n'appartiennent pas à l'historique
de ce dépôt et ne sont donc pas reproduits ici comme s'ils étaient consultables.

| Phase | Contenu | État importé |
|---|---|---|
| 0 | Audit du dépôt (vide), cadrage, quatre documents de référence | terminé dans l'archive source |
| 1 | Initialisation Next.js, jetons de design, layout, huit routes | terminé dans l'archive source |
| 2 | Design system : 23 composants, menu mobile accessible | terminé dans l'archive source |
| 3 | Page d'accueil complète, 10 sections | terminé dans l'archive source |
| 4 | Pages secondaires : Méthode, À propos, Diagnostic, Contact, Réalisations | terminé dans l'archive source |
| 5 | Étude de cas SW Carcleaning | terminé dans l'archive source |
| 6 | Mise en service des formulaires, transport e-mail, tests | terminé dans l'archive source |
| 7 | SEO, image de partage, données structurées, structure légale | terminé dans l'archive source |
| 8 | Passe qualité : responsive, accessibilité, performance | terminé dans l'archive source |
| 9 | Audit final, en-têtes de sécurité, documents de lancement | vérifié après import |

---

## 2. Pages

**Publiques — pages commerciales, journal et articles publiés**

| Route | Rôle |
|---|---|
| `/` | Accueil, présentation des deux verticales et parcours commun |
| `/methode` | Les quatre temps, détaillés |
| `/realisations` | Liste des projets |
| `/realisations/sw-car-cleaning` | Étude de cas, 5 sections |
| `/a-propos` | Philosophie, façon de travailler, ce que nous refusons |
| `/diagnostic` | Formulaire de qualification avec choix obligatoire de l'activité |
| `/contact` | Formulaire court, 5 champs |
| `/blog` | Journal éditorial, articles réellement rédigés et programmables |
| `/blog/[slug]` | Article publié, métadonnées et données structurées propres |
| `/mentions-legales` | Éditeur, hébergement, propriété intellectuelle |
| `/politique-de-confidentialite` | Neuf sections, sommaire ancré |

**Système** — `/404`, `/api/diagnostic`, `/api/contact`, `/robots.txt`, `/sitemap.xml`.
`/design-system` existe uniquement en développement (`page.dev.tsx`).

---

## 3. Composants — 31

- **`ui/` (7)** — `Logo`, `Button`, `ButtonLink`, `TextLink`, `Eyebrow`, `Divider`, `Icon`
- **`layout/` (7)** — `Container`, `Section`, `Header`, `MobileNavigation`, `Footer`,
  `SkipLink`, `Breadcrumbs`
- **`editorial/` (16)** — `SectionHeading`, `EditorialCard`, `OutcomeCard`, `JourneyStep`,
  `MethodStep`, `CaseStudyCard`, `QuoteBlock`, `EditorialMedia`, `FAQAccordion`,
  `ContactPanel`, `CallToAction`, `HeroComposition`, `JourneyTrack`, `ComparisonPanel`,
  `CasePlate`, `CaseGallery`
- **`form/` (10 exports)** — `Fieldset`, `FieldRow`, `Field`, `TextInput`, `TextArea`,
  `Select`, `CheckboxGroup`, `Consent`, `HoneypotField`, `ErrorSummary`, `SuccessPanel`,
  `useFormSubmission`, `DiagnosticForm`, `ContactForm`
- **`motion/` (1)** — `RevealObserver`
- **`seo/` (1)** — `JsonLd`
- **Journal (1)** — `ArticleCard`, avec variantes de une et de liste

---

## 4. Fichiers structurants

| Fichier | Rôle |
|---|---|
| `AGENTS.md` | Règles non négociables. Fait autorité sur tout le reste. |
| `src/styles/tokens.css` | Source unique du design system — aucune couleur ailleurs |
| `src/content/brand.ts` | Promesse, explication, parcours, appel à l'action |
| `src/content/site.ts` | URL, `indexable`, métadonnées des 9 pages |
| `src/content/company.ts` | Informations légales — **aucune valeur inventée** |
| `src/content/contact.ts` | Coordonnées et textes de la page Contact |
| `src/lib/validation.ts` | Schémas Zod partagés client/serveur |
| `src/lib/email/transport.ts` | Abstraction de transport, Resend + repli console |
| `src/lib/structured-data.ts` | `Organization`, `WebSite`, `BreadcrumbList` |
| `next.config.ts` | En-têtes de sécurité, `pageExtensions`, images |
| `scripts/audit-seo.py` · `audit-a11y.py` | Audits du site rendu, sans dépendance |

---

## 5. Fonctionnalités

- **Deux formulaires en service** — validation partagée Zod, saisies conservées en cas
  d'erreur, focus sur le premier champ fautif, état d'envoi, double envoi bloqué,
  confirmation sur place sans redirection.
- **Anti-spam** — champ piège, temps minimal de 2,5 s, limitation à 5 envois / 10 min par IP,
  bornes de taille, nettoyage des entrées. Sans CAPTCHA.
- **Transport e-mail abstrait** — Resend en HTTP direct, repli console en développement,
  échec honnête en production si la configuration manque.
- **SEO** — `metadataBase`, 9 titres et 9 descriptions uniques, `canonical`, Open Graph,
  Twitter Card, image de partage originale, `sitemap.xml` et `robots.txt` pilotés par un seul
  interrupteur.
- **Accessibilité** — landmarks, ordre des titres sans saut, lien d'évitement, menu mobile
  avec piège de focus, accordéon `<details>` natif, 100 % des contrôles étiquetés.
- **Révélation au défilement** — 4 cibles, dégradation totale sans JavaScript.
- **En-têtes de sécurité** — `nosniff`, `DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **Build reproductible** — la racine Turbopack est fixée au dépôt, indépendamment des
  autres lockfiles éventuellement présents sur la machine de développement.
- **Audit navigateur après import** — routes publiques et 404, viewport 390 px sans
  débordement, menu mobile, validation client et absence d'overlay vérifiés avec Playwright.
- **Hydratation propre** — la mutation précoce et intentionnelle de `<html>` pour le mouvement
  réduit est déclarée à React, sans avertissement de console.

---

## 6. Décisions arrêtées

| Sujet | Décision | Pourquoi |
|---|---|---|
| Framework | Next.js 16, App Router | Demandé. Astro recommandé initialement, écarté. |
| Styles | CSS natif + CSS Modules | Tailwind exposerait des dizaines de couleurs interdites |
| Polices | Cormorant Garamond 600 + Manrope 400/500/600/700 | Intégrées via `next/font/google` et servies localement par Next.js |
| Composants | Aucune bibliothèque préfabriquée | shadcn, MUI, Radix imposent une esthétique générique |
| Animations | CSS + un `IntersectionObserver` | Aucune dépendance d'animation |
| SDK Resend | Non installé, appel HTTP direct | L'API tient en un `POST`. Une dépendance en moins. |
| Stockage | Aucun | Les demandes transitent par e-mail, rien en base |
| Mesure d'audience | Aucune | Donc aucune bannière de consentement |
| CTA | « Parler de mon activité », unique | Remplace « Demander un diagnostic », trop administratif |
| Pages de remerciement | Non créées | La confirmation remplace le formulaire sur place |
| `/design-system` | `page.dev.tsx`, absente de la production | Son CSS voyageait dans le bundle partagé |

---

## 7. Limites connues

1. **Socle JavaScript de 186 Ko gzip.** Entièrement React 19 + le runtime App Router de
   Next 16, vérifié chunk par chunk. Non réductible sans changer de socle. Tous les scripts
   sont `async` : le premier affichage n'en dépend pas, mais le Total Blocking Time en
   souffrira sur mobile.
2. **Anti-spam non absolu.** Un robot patient qui ignore le champ piège passera. La limitation
   de débit est en mémoire : non partagée entre instances, vidée à chaque démarrage à froid.
3. **Pas de Content-Security-Policy.** Une CSP stricte imposerait un `nonce` sur le script
   d'amorçage et les blocs JSON-LD. À traiter après le premier aperçu, pas à l'aveugle.
4. **Aucun test de bout en bout automatisé.** 61 tests unitaires couvrent la validation et les routes,
   notamment les messages français lorsque des champs requis sont totalement absents.
   Playwright + axe restent à ajouter si le besoin se confirme.
5. **Validation sur appareils réels encore requise.** Chrome automatisé couvre les routes,
   le responsive 390 px et le menu ; iPhone/Android, lecteur d'écran et ressenti visuel aux
   neuf paliers restent à contrôler. Voir `docs/08`, §9.
6. **Avis npm sur `postcss` et `sharp`**, dépendances internes de Next 16.2.12 — déjà la
   dernière version. Les correctifs proposés par npm sont des rétrogradations absurdes
   (Next 9.3.3) : **ne pas les appliquer**. `sharp` n'est de toute façon pas sollicité,
   le site ne sert aucune image.
7. **`EditorialMedia` n'est utilisé nulle part.** Conservé volontairement : il est prêt à
   recevoir les photographies et documenté comme tel dans `docs/05` et `docs/06`. Le
   supprimer obligerait à le réécrire.

---

## 8. Assets et informations manquants

**Visuels** — inventaire complet dans `docs/06` :
logo SW Carcleaning, quatre captures d'écran, deux photographies, portrait pour À propos,
photographies génériques du métier, logo Qualifyr définitif.

**Juridique** — inventaire complet dans `docs/07` :
raison sociale, forme juridique, SIREN/SIRET, adresse du siège, directeur de la publication,
adresse e-mail, hébergeur, TVA ou mention de franchise, durée de conservation des demandes.

**Technique** — inventaire complet dans `docs/11` :
`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, domaine vérifié chez Resend.

**Autorisations** — accord écrit de SW Carcleaning pour l'usage du nom et des visuels.

---

## 9. Ce qui n'a jamais été fait, et ne le sera pas sans matière réelle

Aucun témoignage, aucun chiffre, aucun résultat, aucun logo client, aucun tarif, aucune
disponibilité limitée, aucune fausse fonctionnalité, aucun faux écran, aucune adresse, aucun
téléphone, aucun réseau social, aucune date de projet.

Vérifié à chaque phase par recherche automatisée sur le contenu réellement rendu.
Dernier passage : **aucune occurrence**.

---

## 10. Simplification commerciale de l'accueil

- Accueil recomposé en six sections courtes : ouverture, offre, SW Car Cleaning, deux
  activités, fonctionnement en trois étapes et clôture.
- Navigation réduite à quatre entrées et un bouton de réservation.
- Historique : un questionnaire WhatsApp séparé avait été ajouté à cette phase. Il a depuis
  été retiré au profit de l'unique parcours `/diagnostic` ; seul le résumé structuré subsiste
  après la soumission serveur ou comme repli manuel explicite.
- Ajout de `NEXT_PUBLIC_QUALIFYR_BOOKING_URL` et
  `NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER`. Sans configuration, les replis restent explicites
  et aucun lien incomplet n'est rendu.
- SW Car Cleaning reste la seule réalisation affichée. Faute de captures et de logo
  exploitables, la preuve conserve sa planche typographique et des objectifs réels.
- Aucun déploiement, commit, push, changement de domaine ou DNS effectué dans cette phase.

### Preuve SW Car Cleaning

- Ajout d’une capture réelle du site public SW Carcleaning dans l’accueil et l’étude de cas.
- Remplacement de la grande section charbon « Travail réalisé » par une section claire et
  compacte ; les livrables restent visibles sans dépendre d’une animation au défilement.
- Le bouton « Parler de mon projet » de l’accueil ouvre directement WhatsApp.

### Canaux commerciaux intégrés

- Les boutons « Réserver un échange » ouvrent le planning Google Calendar dans une fenêtre
  native au site, avec fermeture clavier et lien externe de secours.
- Ajout d’un bouton WhatsApp carré, fixe en bas à droite sur toutes les pages, en respectant
  les zones sûres mobiles et la palette Qualifyr.

---

## 11. Footer global et identité SEO

- Remplacement du pied de page simple par une clôture globale : grand CTA charbon, quatre
  colonnes éditoriales, zones d'accompagnement et liens légaux.
- Suppression des CTA terminaux dupliqués dans les pages : le footer devient l'unique
  clôture commune sans modifier les tunnels, formulaires ou endpoints.
- Les réseaux, coordonnées et disponibilités ne sont rendus que s'ils sont réellement
  configurés. Aucun lien social, e-mail ou horaire n'a été inventé.
- Ajout des comptes Instagram et TikTok confirmés dans le footer, avec pictogrammes SVG
  monochromes et libellés explicites. Le bouton flottant WhatsApp utilise désormais le logo
  complet à la place du sigle « WA ».
- Recomposition complète du laboratoire sur une grille éditoriale de douze colonnes : concept
  Conciergerie principal, études Identité et Mouvement non comprimées, cartes entièrement
  activables et responsive sans troncature.
- Nouveau title et nouvelle description d'accueil centralisés, propagés à Open Graph,
  Twitter Card, `Organization`, `ProfessionalService`, `WebSite` et `WebPage`.
- Ajout d'un manifest, d'une Apple Touch Icon et d'icônes 192/512 générées depuis le nouveau
  monogramme Qualifyr. L'ancienne image Open Graph publique a été supprimée.
- Les pages restent canoniques vers `https://qualifyragence.com`, y compris en preview.
- L'image réelle du laboratoire est désormais optimisée par `next/image`; les iframes de
  démonstration et du calendrier restent chargées paresseusement.

---

## 12. Tarification régionale du configurateur

- Mise en place portée à 590 € pour la grille France et zone euro ; accompagnement maintenu
  à 149 €/mois et options maintenues à 290 € / 390 €.
- Ajout d'une grille Suisse en CHF : majoration commerciale de 16 % et arrondi à la dizaine
  supérieure, soit 690 CHF pour la mise en place.
- Le code pays fourni par l'infrastructure Netlify présélectionne la grille Suisse sans
  exposer ni conserver l'adresse IP. Une route locale sûre conserve l'euro en développement
  ou lorsque la géolocalisation n'est pas disponible.
- La devise est affichée automatiquement selon la zone fournie par l'hébergeur, sans sélecteur
  de pays dans le parcours. L'euro reste le repli sûr lorsque la zone n'est pas disponible.
- L'estimation présente désormais le paiement réparti sur 12 mois avant le total, avec une
  alternative « mise en place + suivi » qui ne modifie pas le coût complet.
- Le message WhatsApp reprend la zone, la devise et les montants réellement affichés.

---

## 13. Ajustements éditoriaux de l'accueil

- Retrait complet de la fenêtre du Journal sur la page d'accueil ; la rubrique et ses
  articles restent disponibles à leur route dédiée et depuis la navigation.
- Rééquilibrage du laboratoire : le concept Conciergerie passe de 8 à 7 colonnes sur grand
  écran, avec une hauteur, un visuel et un titre plus mesurés.
- Élargissement de la colonne des concepts secondaires et passage à une composition
  horizontale pour mieux équilibrer les trois études.

---

## 14. Resserrement final du parcours d'accueil — 1 août 2026

- Réduction de l'accueil à cinq temps : ouverture, expertise, preuve réelle, entreprises
  et méthode fusionnées, puis estimation. Le Journal et le Laboratoire ne sont plus
  développés sur cette page.
- Suppression de la seconde présentation de SW Car Cleaning : une seule démonstration
  interactive reste chargée sur l'accueil, accompagnée de livrables vérifiables et d'un
  lien vers l'étude de cas.
- Hiérarchie de conversion simplifiée : l'estimation devient l'action principale, la
  réalisation l'action secondaire et WhatsApp demeure un canal d'assistance permanent.
  Le calendrier reste proposé plus loin dans le parcours commun.
- Création de la route `/laboratoire`, avec métadonnées et navigation dédiées, pour isoler
  les trois études créatives sans les confondre avec une réalisation client.
- Mise à jour des audits SEO et accessibilité afin d'inclure la nouvelle route publique.
- Aucun témoignage, chiffre de performance ou résultat commercial non vérifié n'a été
  ajouté. Ces preuves resteront absentes tant qu'elles ne pourront pas être documentées.

---

## 15. Méthode raccourcie et orientation du Laboratoire — 1 août 2026

- Page `/methode` ramenée à trois sections : ouverture, grille compacte des quatre temps,
  puis adaptation aux métiers et principe d'outillage réunis.
- Contenu de chaque temps limité à une phrase et trois points concrets ; suppression des
  quatre grandes bandes successives et de la clôture commerciale dupliquée.
- Ajout dans `/laboratoire` d'une orientation en trois choix qui recommande l'une des études
  existantes et permet de l'ouvrir directement, sans créer un second calcul tarifaire.
- Lien secondaire de la recommandation vers l'estimation déjà présente sur l'accueil.
- Délai de la fenêtre « Discutons » porté de 20 à 60 secondes d'inactivité et toujours remis
  à zéro lors d'une interaction.
- Vérification en navigateur à 1280 px et 390 px : aucun débordement horizontal, choix
  tactiles supérieurs à 44 px, recommandation et fenêtre de concept fonctionnelles, aucune
  erreur console.
- `npm run lint`, `npm run typecheck`, `npm run test` (60 tests) et `npm run build` réussis.

---

## 16. Finition du panneau d’orientation — 1 août 2026

- Remplacement de la liste visuellement flottante par un panneau charbon autonome à deux
  colonnes sur desktop et une colonne sur mobile.
- Choix numérotés rendus plus lisibles avec une flèche, un état sélectionné explicite et une
  surface tactile supérieure à 44 px.
- Ajout d’un état d’attente éditorial dans la zone de recommandation, afin que le bloc reste
  intentionnel avant la première sélection.
- Déplacement de la mention sur les concepts après le panneau pour ne plus interrompre la
  progression entre l’introduction et le choix.
- Vérification à 1280 px et 390 px : aucune largeur débordante, recommandation fonctionnelle
  et aucune erreur console.

---

## 17. Rééquilibrage des études du Laboratoire — 1 août 2026

- Correction de la grille desktop : le concept Conciergerie commence désormais au premier
  rang et occupe les deux rangées, supprimant le grand vide involontaire à gauche.
- Passage des études Identité visuelle et Motion UI à une composition verticale, avec le
  visuel au-dessus du contenu, afin de préserver leurs compositions et d'éviter les textes
  comprimés ou coupés.
- Conservation de l'asymétrie éditoriale en sept et cinq colonnes, avec des hauteurs,
  espacements et points d'alignement cohérents entre les trois études.
- Les règles tablette et mobile restent inchangées : deux colonnes équilibrées puis une seule
  colonne, sans défilement horizontal.
- Vérification en navigateur à 1280 px et 390 px : les trois cartes sont lisibles, alignées
  et aucune largeur ne déborde du viewport.
- `npm run lint`, `npm run typecheck`, `npm run test` (60 tests) et `npm run build` réussis.

---

## 18. Parcours final de l'accueil et estimation autonome — 1 août 2026

- Décision de retirer le configurateur tarifaire de l'accueil et de le réutiliser sur la
  nouvelle route `/estimation`, sans dupliquer sa logique, ses prix ni ses cinq étapes.
- Retour d'un laboratoire compact de trois études sur l'accueil ; retrait de l'atelier de
  palette, des scénarios et des états qui ne servent pas la compréhension initiale.
- Séparation des sections Entreprises accompagnées et Méthode, puis ajout d'une clôture unique.
- SW Car Cleaning reste la seule réalisation et la seule fenêtre distante de la page.
- Les preuves inventées, témoignages, résultats chiffrés et écrans fictifs restent absents.
- Limites conservées : estimation indicative avant cadrage, Motion UI explicitement en
  préparation, aucune promesse de résultat commercial.
- Vérification navigateur de l'accueil aux largeurs 320, 375, 390, 430, 768, 1024,
  1280, 1440 et 1600 px : un seul H1, une seule fenêtre SW Car Cleaning et aucun
  défilement horizontal.
- Parcours `/estimation` testé jusqu'au récapitulatif final : cinq étapes, tarifs euro et
  suisse, options, total sur douze mois, liens WhatsApp et prise de rendez-vous.
- Vérification desktop et mobile des routes `/realisations/sw-car-cleaning`, `/diagnostic`,
  `/contact` et `/laboratoire` : un seul H1 par page, aucun débordement et aucune erreur
  ou alerte dans la console navigateur.
- `npm run lint`, `npm run typecheck`, `npm run test` (60 tests) et `npm run build`
  réussis avant la validation visuelle finale.

---

## 19. Diagnostic commercial unifié — 1 août 2026

- Reconstruction de `/diagnostic` en une introduction, cinq étapes courtes, une synthèse
  modifiable et une confirmation honnête après succès réel de `POST /api/diagnostic`.
- Séparation explicite entre diagnostic, estimation tarifaire et conversation WhatsApp
  directe ; tous les CTA de diagnostic conduisent désormais à la même route.
- Suppression de l'ancienne modale `WhatsAppDiagnostic`, de son événement global et de ses
  styles ; ajout de `DiagnosticLink` et `WhatsAppDirectButton` aux responsabilités stables.
- Ajout des branches facultatives Nettoyage automobile et Conciergerie, de la précision
  obligatoire pour une autre activité, des limites à trois canaux et deux priorités, ainsi
  que de la normalisation des domaines sans protocole.
- Sauvegarde temporaire dans `sessionStorage`, restauration uniquement après choix explicite,
  effacement après succès et solution WhatsApp de secours si l'envoi serveur échoue.
- Message WhatsApp structuré sans champs vides, `null`, clés techniques ni consentement ;
  calendrier affiché uniquement lorsqu'une URL commerciale réelle est configurée.
- Vérification du parcours jusqu'à la synthèse, sans envoi : branches, navigation arrière,
  modification, limites, budget conditionnel et reprise de session fonctionnels.
- Contrôle navigateur à 320, 375, 390, 430, 768, 1024, 1280 et 1440 px : aucun débordement
  horizontal, aucune cible interactive sous 44 px et aucune erreur ou alerte console.
- `npm run lint`, `npm run typecheck`, `npm run test` (61 tests) et `npm run build` réussis.

---

## 20. Acquisition et attribution commerciale — 2 août 2026

- Ajout de sept liens de campagne centralisés et de la redirection fermée `/go/[campaign]`,
  sans possibilité de redirection ouverte ni publication dans le sitemap.
- Ajout d'une attribution first touch / last touch limitée aux paramètres UTM autorisés,
  conservée uniquement dans `sessionStorage` et transmise sans donnée personnelle aux
  formulaires de contact et de diagnostic.
- Ajout d'une couche de mesure interne sans fournisseur tiers : événements typés,
  `CustomEvent` navigateur et `dataLayer` seulement lorsqu'il existe déjà.
- Harmonisation des CTA commerciaux, des liens internes, des pages verticales et de l'étude
  de cas SW Car Cleaning autour du diagnostic, de l'estimation, du calendrier et de WhatsApp.
- Création du dossier `docs/marketing/` : prospection raisonnée, plan de contenu sur 30 jours,
  partenariats, KPI, suivi des prospects, backlog et checklist Search Console.
- Ajout de `npm run marketing:links` pour imprimer les liens courts et leurs paramètres sans
  dupliquer la configuration de campagne.
