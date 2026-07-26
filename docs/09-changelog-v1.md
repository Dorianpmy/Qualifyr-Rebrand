# 09 — Changelog V1

Reconstruction complète du site de Qualifyr Agence, depuis un dépôt vide.
Branche `feature/qualifyr-rebrand-v1`. **Rien n'est déployé, le domaine n'est pas connecté.**

**Évolution de positionnement — 27 juillet 2026 :** Qualifyr conserve une offre unique,
`Le parcours Qualifyr`, désormais adaptée à deux verticales officielles : nettoyage
automobile mobile / detailing à domicile et conciergeries. Aucun faux projet de
conciergerie n'a été ajouté ; SW Carcleaning reste la réalisation réelle publiée.

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

**Publiques — neuf, pas une de plus**

| Route | Rôle |
|---|---|
| `/` | Accueil, présentation des deux verticales et parcours commun |
| `/methode` | Les quatre temps, détaillés |
| `/realisations` | Liste des projets |
| `/realisations/sw-car-cleaning` | Étude de cas, 5 sections |
| `/a-propos` | Philosophie, façon de travailler, ce que nous refusons |
| `/diagnostic` | Formulaire de qualification avec choix obligatoire de l'activité |
| `/contact` | Formulaire court, 5 champs |
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
| Polices | Newsreader + Manrope, auto-hébergées | 82 Ko, aucune requête tierce, aucun décalage |
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
4. **Aucun test de bout en bout.** 48 tests unitaires couvrent la validation et les routes,
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
