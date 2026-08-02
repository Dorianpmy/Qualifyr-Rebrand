# AGENTS.md — Qualifyr Agence · Règles non négociables

Ce fichier fait autorité sur toute autre instruction implicite. Tout agent ou contributeur
travaillant sur ce dépôt doit le lire **avant** toute modification.

Domaine de production : `https://qualifyragence.com`
Dépôt : reconstruction complète du site, depuis une page blanche.

---

## 0. Lecture obligatoire avant toute modification

Avant d'écrire la moindre ligne de code, de contenu ou de style, lire dans l'ordre :

1. `docs/01-positionnement.md`
2. `docs/02-arborescence.md`
3. `docs/03-direction-artistique.md`
4. `docs/04-plan-implementation.md`
5. `docs/05-composants.md`
6. `docs/06-assets-sw-car-cleaning.md`
7. `docs/07-informations-legales-requises.md`
8. `docs/08-qa-responsive-accessibilite.md`

Documents de référence complémentaires, à consulter selon le besoin :
`docs/09-changelog-v1.md` (état des lieux), `docs/10-launch-checklist.md` (mise en ligne),
`docs/11-variables-environnement.md` (configuration),
`docs/12-logo-qualifyr.md` (marque).

Aucune décision de contenu, de structure ou de design ne peut être prise en contradiction
avec ces documents. Si un besoin nouveau apparaît, on met à jour le document concerné
**d'abord**, puis on implémente.

---

## 1. Périmètre : ce qu'on ne touche pas

- Ne pas supprimer, réinitialiser ou recréer le dossier `.git`.
- Ne pas modifier le domaine, les DNS, l'ancien déploiement ou l'ancien dépôt.
- L'ancien site Qualifyr Agence reste en ligne et intact jusqu'à décision explicite.
- Ne pas forcer d'opération Git (`push --force`, `reset --hard`, `clean -fdx`) sans demande explicite.
- Travail sur la branche `feature/qualifyr-rebrand-v1`.

---

## 2. Positionnement élargi validé

Qualifyr Agence est spécialisée dans le développement de deux types d'entreprises :

- le **nettoyage automobile mobile et le detailing à domicile** ;
- les **conciergeries**.

- Ces deux verticales restent des domaines d'expérience et des cas d'usage visibles.
- Depuis la validation du 27 juillet 2026, l'accueil présente aussi l'offre élargie de
  conception de sites web, d'applications et de SaaS sur mesure pour les entreprises.
- Pas de page « Solutions » listant d'autres métiers.
- Pas de mention « tous les artisans », « toutes les TPE », « tous secteurs ».
- Le terme « conciergerie » reste large : voyage, séjour, organisation de services,
  installation ou expatriation, gestion et coordination selon le contexte. Aucun service
  précis n'est attribué à un client sans preuve réelle.

---

## 3. Positionnement

Qualifyr **n'est pas** :

- une agence web généraliste ;
- une agence IA ;
- une agence no-code ;
- un CRM ;
- un ERP ;
- une agence publicitaire ;
- une entreprise servant tous les artisans.

Qualifyr rend son offre concrète par la conception d'un **site clair**, sans se réduire à une
agence web généraliste. Le site est la pièce centrale d'une **offre commune, adaptée aux
contraintes de chacun des deux métiers** : un parcours complet permettant à une
entreprise :

- d'être trouvée ;
- d'être comprise ;
- d'être choisie ;
- d'être réservée plus facilement ;
- d'obtenir des avis ;
- de favoriser les nouvelles réservations.

**Titre principal de l'accueil** : « Donnez envie de vous choisir. »

**Texte d'explication principal** : « Qualifyr clarifie votre offre, construit votre identité
et conçoit un parcours simple jusqu’à la prise de contact. »

**Offre principale** : « Le parcours Qualifyr » (nom provisoire).

Les briques opérationnelles (conception du site, parcours de réservation, acompte, rappels,
demande d'avis, fidélisation, optimisation) sont des **moyens**. La finalité affichée reste
le développement de l'activité.

---

## 4. Vocabulaire interdit dans le contenu du site

Ne jamais utiliser comme argument, titre, sous-titre ou description d'offre :

`IA` · `intelligence artificielle` · `CRM` · `ERP` · `automatisation` · `no-code` ·
`transformation digitale` · `présence en ligne` · `solution innovante` ·
`technologie révolutionnaire` · `écosystème` · `tunnel de vente` · `growth hacking` ·
`agence 360` · `acquisition omnicanale`

En particulier : **« présence en ligne » ne doit jamais servir à décrire l'offre.**

Ces mots sont interdits dans le contenu visible (copy, meta, alt, aria-label, microcopy,
JSON-LD, Open Graph). Ils restent tolérés dans les commentaires techniques du code et dans
la documentation interne du dossier `docs/` lorsqu'il s'agit justement d'énoncer l'interdiction.

---

## 5. Palette interdite

Aucune de ces couleurs ne doit apparaître dans le design system, les composants, les
illustrations, les images ou les états d'interface :

- vert ;
- mauve ;
- violet ;
- bleu électrique ;
- cyan ;
- dégradé bleu-violet ;
- néon ;
- halos lumineux.

Le luxe ne repose pas sur le cliché noir et or. La palette est chaude et éditoriale :
ivoire, blanc chaud, charbon, brun profond, sable, laiton mat, cuivre ou terre cuite en
accent rare. Valeurs exactes dans `docs/03-direction-artistique.md`.

**Exception fonctionnelle unique** : les états de validation et d'erreur de formulaire
doivent rester lisibles. On utilise des variantes chaudes définies dans la DA (terre cuite
pour l'erreur, brun profond pour le succès), **jamais** de vert ou de rouge vif standard.

---

## 6. Interdiction des faux contenus

Ne jamais inventer, générer ou placer en « lorem ipsum crédible » :

- de témoignages ;
- de statistiques ;
- de chiffres de conversion ;
- de nombre de clients ;
- de résultats ;
- de logos clients ;
- de récompenses ;
- de partenaires ;
- de tarifs ;
- de disponibilité limitée ;
- de fausses fonctionnalités ;
- de faux écrans d'application.

`SW Carcleaning` peut être présenté comme réalisation réelle, **sans aucun résultat chiffré
inventé**.

Quand un contenu réel manque : ne pas combler. Utiliser un placeholder explicitement marqué
`TODO_CONTENU_REEL` et le signaler dans le compte rendu de phase. Une section sans matière
réelle est retirée plutôt que remplie.

---

## 7. Direction artistique — cadre

L'identité doit être : luxueuse, premium, éditoriale, lumineuse, chaleureuse, précise,
minimaliste, mature, mémorable.

Références d'ambiance : maisons éditoriales haut de gamme, soin automobile premium, matières
naturelles, cuir, pierre chaude, papier ivoire, métal brossé, précision du detailing.

Elle ne doit ressembler ni à une startup IA, ni à un template SaaS, ni à une agence no-code,
ni à une application financière, ni à un site automobile agressif, ni à un site de tuning,
ni à une copie de Patissio.

---

## 8. Exigences de qualité

**Accessibilité — obligatoire, non négociable**

- Conformité visée : WCAG 2.2 niveau AA.
- Contraste texte ≥ 4.5:1, texte large et éléments d'interface ≥ 3:1.
- HTML sémantique. Un seul `<h1>` par page, hiérarchie de titres continue.
- Navigation clavier complète, ordre de tabulation logique, focus visible et contrasté
  (jamais `outline: none` sans remplacement).
- Toute image porteuse de sens a un `alt` utile ; les images décoratives ont `alt=""`.
- Formulaires : `<label>` associé à chaque champ, erreurs annoncées, pas d'erreur véhiculée
  par la seule couleur.
- Cibles tactiles ≥ 44×44 px.
- `prefers-reduced-motion` respecté sur toute animation.
- Zoom 200 % sans perte de contenu ni scroll horizontal.

**Mobile-first**

- Conception et intégration à partir de 360 px de large.
- Aucun scroll horizontal, à aucun breakpoint.
- Le parcours de contact et de diagnostic doit être complet et confortable au pouce.

**Performances**

- Objectifs Lighthouse mobile : Performance ≥ 95, Accessibilité 100, Bonnes pratiques 100, SEO 100.
- Core Web Vitals : LCP < 2.0 s, CLS < 0.05, INP < 200 ms.
- Zéro JavaScript sur une page qui n'en a pas besoin ; hydratation ciblée uniquement.
- Images : formats modernes, dimensions explicites, `loading="lazy"` hors du premier écran,
  `fetchpriority="high"` sur le LCP.
- Polices auto-hébergées, `font-display: swap`, préchargement des graisses critiques,
  sous-ensemble latin.
- Aucun script tiers non justifié. Aucun tracker publicitaire.

**Contenu et rédaction**

- Français, vouvoiement, phrases courtes, verbes concrets.
- Pas de superlatif non démontrable.
- Un message par section.

---

## 9. Contrôles obligatoires après chaque phase

À la fin de **chaque** phase d'implémentation, exécuter dans cet ordre et corriger jusqu'au vert :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Aucune phase n'est déclarée terminée si l'une de ces quatre commandes échoue ou produit des
avertissements non justifiés. Aucun commit sur `feature/qualifyr-rebrand-v1` avec un build
cassé.

Contrôles complémentaires avant toute mise en ligne :

- audit Lighthouse mobile ;
- vérification des contrastes ;
- passe clavier seul sur chaque page ;
- recherche des mots interdits dans le contenu produit ;
- recherche des couleurs interdites dans les tokens et les feuilles de style.

---

## 9bis. Secrets

- **Aucune clé API, aucun jeton, aucun mot de passe n'est écrit dans le dépôt.** Jamais, y
  compris « temporairement ».
- Les variables d'environnement sont déclarées dans `.env.example` **sans valeur**, et
  renseignées dans `.env.local` (ignoré par Git) ou dans l'hébergeur.
- Aucune variable secrète ne porte le préfixe `NEXT_PUBLIC_` : ce préfixe expose la valeur au
  navigateur.
- Une configuration absente ne doit jamais casser le build ni faire croire à un succès :
  elle se traite explicitement.

---

## 10. Règles de travail

- Une phase = une intention = une série de commits lisibles.
- Ne pas anticiper les phases suivantes ni « pré-construire » des composants non demandés.
- Ne pas ajouter de dépendance hors de celles listées dans `docs/04-plan-implementation.md`
  sans justification écrite.
- Ne pas introduire de bibliothèque de composants prête à l'emploi qui imposerait une
  esthétique générique.
- Ne pas créer de nouveau composant sans l'avoir documenté dans `docs/05-composants.md`,
  ni contourner une règle d'usage qui y est écrite.
- Signaler tout blocage plutôt que de le contourner par une invention.
