# Refonte copywriting & structure — Qualifyr

> **Archivé le 24/08/2026.** Rédigé quand la conciergerie était la deuxième verticale
> officielle ; elle est depuis abandonnée définitivement, et le repositionnement SaaS-first
> du 17/08/2026 a de toute façon changé la structure et les textes décrits ici. Conservé tel
> quel, sans correction, comme trace du plan proposé à l'époque — pas une référence à suivre.

Plan d'action et textes prêts à copier-coller.
Rédigé le 11/08/2026, à partir du contenu réel du dépôt.

**Deux contraintes qui gouvernent tout ce document :**

1. Qualifyr n'est pas une agence « pour les entreprises de services ». Elle sert
   **deux métiers nommés** : nettoyage automobile / detailing, et conciergeries de
   location courte durée. Cette étroitesse est l'actif commercial principal — c'est
   elle qui justifie le prix. Aucun texte ci-dessous ne l'élargit.
2. `AGENTS.md` §6 interdit tout témoignage, chiffre de résultat, logo client ou
   statistique inventés. Une seule réalisation réelle existe (SW Carcleaning), sans
   données chiffrées. La section 5 travaille avec ça, pas contre.

---

## 1. Cohérence globale et navigation

### 1.1 Diagnostic : où est la vraie confusion

La double proposition n'est pas confuse parce qu'il y a deux offres. Elle est confuse
parce que **les deux offres se chevauchent sur la même cible**.

| | Site sur mesure (agence) | Outil 79 €/mois (SaaS) |
|---|---|---|
| Nettoyage automobile | Oui | Non |
| Conciergerie | Oui | Oui |

Une conciergerie qui arrive sur le site peut acheter les deux. Rien, aujourd'hui,
ne lui dit lequel est fait pour elle. C'est le seul point de friction structurel —
et il se règle par un critère de choix explicite, pas par une réorganisation du menu.

Second problème, plus discret : dans le menu actuel, `Expertise` et `Réalisation`
sont des ancres vers des sections de l'accueil, pas des pages. Un visiteur qui clique
et se retrouve à défiler sur la page où il était déjà perd confiance dans la
navigation. Et `Outil` ne dit ni pour qui, ni pourquoi.

### 1.2 Menu recommandé

La contrainte de `navigation.ts` — six entrées, jamais sept — est respectée. Le
principe : **on segmente par métier, pas par produit.** Le visiteur se reconnaît
avant de choisir quoi acheter.

```ts
export const primaryNav: readonly NavItem[] = [
  { label: 'Conciergeries', href: '/conciergerie' },
  { label: 'Nettoyage automobile', href: '/nettoyage-automobile' },
  { label: 'Réalisations', href: '/realisations' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Journal', href: '/blog' },
  { label: 'À propos', href: '/a-propos' },
];
```

Ce que ça change :

- Les deux premières entrées sont des **portes de métier**. Le visiteur se reconnaît
  en une seconde, avant même de comprendre ce que vend Qualifyr.
- `Réalisations` devient une vraie page, plus une ancre.
- L'outil disparaît du menu principal et devient **l'offre d'entrée de la page
  Conciergeries** — c'est là que sa cible se trouve déjà. Il garde son entrée dans
  le pied de page et son lien dans la page Tarifs.
- Le bouton WhatsApp de l'en-tête reste inchangé : c'est la voie rapide.

### 1.3 L'arbitrage à écrire noir sur blanc

À placer sur `/conciergerie` et sur `/tarifs`. Il n'y a rien de plus rassurant qu'une
agence qui dit quand il ne faut pas l'acheter.

> **Deux façons de travailler avec nous.**
>
> **L'outil, 79 € par mois.** Vous voulez des demandes de propriétaires, maintenant,
> sans projet ni budget d'agence. Une page en ligne en dix minutes, à vos couleurs.
>
> **Le site sur mesure, à partir de quelques milliers d'euros.** Vous voulez une
> identité, plusieurs pages, votre ton, vos photographies. C'est un projet, avec un
> accompagnement et des semaines de travail.
>
> Beaucoup de conciergeries commencent par l'outil et viennent au site une fois leur
> portefeuille constitué. L'inverse est rarement le bon ordre.

---

## 2. Page d'accueil

### 2.1 Trois propositions de Hero

Le H1 actuel — « Faites de votre savoir-faire une évidence » — est beau et ne dit
rien. Il pourrait coiffer un cabinet de conseil, un ébéniste ou une école de commerce.
Les trois options ci-dessous parient chacune sur un angle différent.

---

**Option A — le pari du résultat** *(recommandée)*

> **Eyebrow** : Nettoyage automobile · Conciergeries
>
> **H1** : Vos clients vous choisissent avant de vous parler.
>
> **Sous-titre** : Ils comparent trois sites en cinq minutes et retiennent celui qui
> répond à leurs questions. Qualifyr conçoit ce site-là — pour les entreprises de
> nettoyage automobile et les conciergeries de location courte durée.

Pourquoi elle gagne : elle nomme le moment exact où l'affaire se perd, et ce moment
est vécu par les deux métiers. Elle place les verticales dès la première respiration
sans en faire un titre étroit.

---

**Option B — le pari de la spécialité**

> **Eyebrow** : Agence digitale · Deux métiers, pas trente
>
> **H1** : Nous ne faisons des sites que pour deux métiers.
>
> **Sous-titre** : Le nettoyage automobile et les conciergeries de location courte
> durée. Assez peu pour connaître vos objections client par cœur. Assez longtemps
> pour savoir ce qui déclenche une demande.

Pourquoi elle est forte : la restriction est la promesse. Elle disqualifie
instantanément les généralistes et fait payer la prime de spécialiste. Le risque est
qu'elle ferme la porte à l'offre élargie mentionnée dans `AGENTS.md` §2.

---

**Option C — le pari du mécanisme**

> **Eyebrow** : Agence digitale pour le nettoyage automobile et les conciergeries
>
> **H1** : Être compris. Être choisi. Être contacté.
>
> **Sous-titre** : Trois obstacles, dans cet ordre, entre votre savoir-faire et votre
> prochain client. Qualifyr conçoit l'identité, le site et le parcours qui les lèvent
> un par un.

Pourquoi elle tient : elle reprend la structure `transformations` déjà présente dans
`home.ts` et transforme un slogan en méthode. Plus froide, mais très lisible.

### 2.2 Structure section par section

Le principe directeur : **le tri des deux audiences arrive en section 2, pas en
section 6.** Aujourd'hui le visiteur doit défiler longtemps avant de savoir si le
site lui parle.

| # | Section | Rôle | Contenu |
|---|---|---|---|
| 1 | Hero | Nommer le problème, situer les deux métiers | Option A ci-dessus, deux CTA |
| 2 | **Les deux portes** | Trier immédiatement | Deux blocs métier, cliquables |
| 3 | Le constat | Créer l'inconfort | Ce que le prospect fait pendant que vous attendez son appel |
| 4 | La réponse | Comment on lève l'obstacle | Les 3 `transformations` existantes, réécrites |
| 5 | La réalisation | Prouver | SW Carcleaning, en pleine largeur |
| 6 | La méthode | Rassurer sur le déroulé | Les 4 étapes de `method` |
| 7 | L'outil | Ouvrir la seconde offre | Encart dédié conciergeries, vers `/outil-conciergerie` |
| 8 | Clôture | Convertir | Diagnostic + tarifs |

**Section 2 — Les deux portes** (texte prêt) :

> **Eyebrow** : Vous êtes
>
> **H2** : Deux métiers, deux façons de perdre un client.
>
> **Bloc 1 — Nettoyage automobile & detailing**
> Votre travail se voit sur la carrosserie, pas sur votre site. Le client compare
> des prix qu'il ne comprend pas et choisit au hasard.
> → *Voir l'offre nettoyage automobile*
>
> **Bloc 2 — Conciergeries de location courte durée**
> Le propriétaire veut savoir combien son bien rapporterait. Tant qu'il n'a pas ce
> chiffre, il ne vous appelle pas — et vous ne saurez jamais qu'il a hésité.
> → *Voir l'offre conciergerie*

**Section 3 — Le constat** (texte prêt) :

> **Eyebrow** : Le vrai concurrent
>
> **H2** : Votre concurrent n'est pas l'autre entreprise. C'est l'onglet d'à côté.
>
> Personne ne compare vraiment deux prestataires. On ouvre trois sites, on ferme les
> deux qui demandent un effort, et on écrit au troisième. Ce tri prend moins d'une
> minute et se joue entièrement sur ce qu'on comprend sans lire.
>
> C'est un problème de conception, pas de qualité de travail. Et c'est pour ça qu'il
> se corrige.

---

## 3. Pages Agence — des services aux bénéfices

### 3.1 Principe de réécriture

Chaque livrable doit être formulé en **conséquence commerciale**, jamais en
prestation. La règle : si la phrase pourrait figurer sur une facture, elle est à
réécrire.

| Avant (prestation) | Après (bénéfice) |
|---|---|
| Identité visuelle et logotype | On vous prend au sérieux avant d'avoir lu une ligne |
| Rédaction des contenus | Vos prospects arrêtent de vous demander ce que vous faites |
| Site responsive | Le devis se demande depuis le téléphone, sur le trottoir, en trente secondes |
| Optimisation SEO locale | On vous trouve en tapant votre métier et votre ville, pas votre nom |
| Formulaire de contact | Les demandes arrivent avec le contexte déjà rempli |
| Page tarifs | Les curieux se filtrent seuls, vous ne parlez qu'aux gens décidés |

### 3.2 Bloc « Ce que ça change » (prêt à copier)

> **Eyebrow** : Ce que ça change
>
> **H2** : Trois choses cessent, le jour où le site est juste.
>
> **01 — Vous arrêtez de rattraper au téléphone**
> Zone d'intervention, formules, délais, prix d'entrée : tout ce que vous répétez
> dix fois par semaine est écrit, hiérarchisé, et lu avant qu'on vous appelle.
> L'échange commence là où il s'arrêtait avant.
>
> **02 — Vous cessez d'être comparé au moins cher**
> Un travail soigné présenté sans soin se négocie. Présenté avec la même exigence
> que vous mettez dans la prestation, il se choisit. Le prix devient une conséquence,
> pas un point d'entrée.
>
> **03 — Vous ne perdez plus les demandes tièdes**
> Le visiteur qui hésite ne revient pas. Chaque page mène à une action possible
> maintenant — une demande, un créneau, un message — pendant qu'il y pense encore.

### 3.3 Section « Pourquoi nous choisir »

À placer sur `/nettoyage-automobile`, `/conciergerie` et `/creation-site-web`. La
crédibilité vient ici de la **connaissance du métier**, seul terrain où une agence
sans historique chiffré peut être meilleure qu'une grosse agence.

> **Eyebrow** : Pourquoi nous
>
> **H2** : Nous connaissons vos objections mieux que votre prochaine agence.
>
> **Nous n'apprenons pas votre métier sur votre budget.**
> Une agence généraliste passe la première moitié du projet à comprendre pourquoi
> un detailing n'est pas un lavage, ou pourquoi un propriétaire ne signe pas comme
> un locataire. Nous démarrons après cette étape.
>
> **Nous savons ce que votre client demande avant de dire oui.**
> Combien de temps ça prend. Ce qui est vraiment inclus. Si vous vous déplacez.
> Ce qui se passe s'il n'est pas satisfait. Ces réponses ne sont pas des détails à
> caser en bas de page : ce sont elles qui déclenchent la demande.
>
> **Nous concevons pour un métier qui se juge sur le soin.**
> Vous vendez de la minutie. Un site approximatif contredit votre promesse avant
> même de la formuler. La direction artistique répond à la même exigence que votre
> prestation.
>
> **Vous restez propriétaire de tout.**
> Le nom de domaine, les contenus, les accès, les photographies. Aucun abonnement
> qui vous retient, aucune dépendance construite exprès.

---

## 4. Landing SaaS — framework PAS

Structure complète de `/outil-conciergerie`. Le titre actuel, « Une page qui vous
apporte des propriétaires », est bon — il est conservé comme sous-titre du problème.

### PROBLÈME

> **Eyebrow** : Produit · Conciergeries
>
> **H1** : Le propriétaire veut un chiffre. Vous n'en donnez pas.
>
> **Sous-titre** : Avant de confier un bien à quelqu'un, on veut savoir ce qu'il
> rapporterait. C'est la première question, et elle reste sans réponse sur presque
> tous les sites de conciergerie — y compris le vôtre.
>
> *79 € par mois · Essai gratuit · Sans engagement*

### AGITATION

> **Eyebrow** : Ce que ça coûte
>
> **H2** : Vous ne saurez jamais combien de mandats vous avez perdus comme ça.
>
> **Il est parti chercher son chiffre ailleurs**
> Il a tapé sa ville et « rentabilité location courte durée ». Il a trouvé un
> simulateur — celui d'un concurrent, ou d'une plateforme qui prend une commission
> sur chaque mandat, à vie.
>
> **Votre offre ressemble à toutes les autres**
> Ménage, linge, accueil, gestion des annonces. La liste est la même sur les huit
> sites qu'il a ouverts. Sans chiffre pour vous distinguer, il choisit au prix.
>
> **Les rares demandes arrivent vides**
> Un prénom, un e-mail, « je voudrais des renseignements ». Vous relancez, vous
> qualifiez, vous découvrez au troisième échange que le bien est hors de votre zone.
>
> **Et vous continuez à payer pour ça**
> Une page d'acquisition confiée à une agence : plusieurs milliers d'euros et des
> semaines. Un annuaire de mise en relation : une commission sur chaque mandat,
> chaque année, tant que le propriétaire reste.

### SOLUTION

> **Eyebrow** : La réponse
>
> **H2** : Donnez-lui son chiffre. Il vous laissera ses coordonnées.
>
> Vous partagez un lien. Le propriétaire décrit son bien en quatre choix et obtient
> une estimation annuelle à vos couleurs, avec vos barèmes. Pour la recevoir en
> détail, il laisse son contact. La demande arrive dans votre tableau de bord avec
> la ville, le logement et l'estimation déjà calculée.
>
> En ligne en dix minutes. Sans carte bancaire.

### Les 3 fonctionnalités, en bénéfices

À remplacer dans la section « Ce que l'outil fait, concrètement ». Trois blocs, pas
quatre : le quatrième dilue.

> **01 — Il repart avec un chiffre. Vous repartez avec son nom.**
> Le propriétaire renseigne son bien en quatre questions et voit sa fourchette
> annuelle, la saisonnalité et ce qui lui resterait après votre commission. Il
> obtient exactement ce qu'il était venu chercher — et vous obtenez le seul contact
> qui compte : celui de quelqu'un qui a déjà projeté son bien chez vous.
>
> **02 — Vos chiffres, votre marché, votre responsabilité.**
> Vous définissez vos secteurs et vos barèmes. Pas une moyenne nationale calculée
> par un algorithme qui n'a jamais vu votre ville. C'est vous qui connaissez le
> marché, c'est vous qui assumez l'estimation — et c'est précisément ce qui la rend
> crédible face au propriétaire.
>
> **03 — Le premier appel commence à la question 4.**
> Chaque demande arrive avec le logement décrit et l'estimation figée telle qu'elle
> lui a été montrée. Vous ne demandez plus où, combien de pièces, ni depuis quand.
> Vous appelez quelqu'un qui connaît déjà son chiffre, et vous parlez de ce qui
> reste : est-ce qu'il vous confie le bien.

### Le bloc arithmétique

Le calcul actuel (948 € contre 3 000–5 000 €) est la meilleure section de la page :
il transforme une dépense en évidence, et sa note de méthode le rend vérifiable.
**À conserver tel quel.** Une seule retouche au titre :

> **Avant** : Un mandat signé paie quatre ans d'abonnement.
>
> **Après** : Un seul mandat, et l'outil est payé jusqu'en 2030.

---

## 5. Réassurance et passage à l'action

### 5.1 Preuve sociale : ce que vous pouvez prouver aujourd'hui

Vous n'avez ni témoignages, ni chiffres clients, ni volume. Inventer l'un des trois
se démonte en une recherche et coûte plus cher que l'absence. Voici les cinq preuves
disponibles **sans rien fabriquer**, par ordre de puissance.

**1. La réalisation vérifiable.** SW Carcleaning est en ligne, le lien est public.
Un site qu'on peut ouvrir vaut plus que dix témoignages anonymes. Formulation :
« Vous pouvez le voir en ligne : swcarcleaning.ch ».
*Où* : accueil, `/realisations`, page nettoyage automobile.

**2. La démonstration jouable.** Le simulateur est utilisable par n'importe qui,
tout de suite. C'est la preuve la plus forte pour le SaaS — pas une capture d'écran,
le produit lui-même. *Où* : `/outil-conciergerie`, en second CTA permanent.

**3. L'aveu de phase.** La note de méthode actuelle — « Qualifyr Conciergerie est en
phase de lancement, et nous préférons le dire » — est un actif de crédibilité, pas
une faiblesse. Elle achète la confiance sur tout le reste de la page. *À conserver.*

**4. La preuve par la compétence.** Les articles du Journal démontrent que vous
connaissez le métier. Un article utile est une preuve sociale différée.
*Où* : deux articles liés en bas de chaque page métier.

**5. Le risque assumé.** Essai gratuit, sans carte bancaire, résiliable à tout
moment, tarif garanti à vie. Quand la preuve manque, on la remplace par du risque
qu'on prend soi-même. *Où* : sous chaque CTA du SaaS.

**À construire dès les premiers clients**, dans cet ordre : une phrase citée avec
prénom + métier + ville → le nombre de conciergeries équipées, dès qu'il dépasse 5
→ une donnée agrégée et honnête (« X estimations générées depuis le lancement »).

### 5.2 CTA — textes exacts

Principe : le bouton dit ce que le visiteur **obtient**, jamais ce qu'il fait. Aucun
« Contactez-nous », aucun « En savoir plus », aucun « Découvrir ».

| Emplacement | CTA principal | CTA secondaire | Micro-copy sous le bouton |
|---|---|---|---|
| Accueil — hero | Voir ce qui bloque mes demandes | Parler à Dorian en direct | Trois minutes, sans inscription |
| Accueil — clôture | Commencer par le diagnostic | Voir les tarifs | Vous saurez quoi corriger en premier |
| Nettoyage automobile | Estimer mon projet en 3 minutes | Voir un site que nous avons fait | Sans engagement, réponse sous 24 h |
| Conciergerie (site) | Estimer mon projet en 3 minutes | Essayer l'outil à 79 €/mois | Deux offres, on vous dit laquelle |
| Outil conciergerie | Créer ma page maintenant | Essayer le simulateur d'abord | Sans carte bancaire · En ligne en 10 min |
| Outil — après le prix | Prendre le tarif de lancement | — | Garanti à vie · Résiliable à tout moment |
| Tarifs | Situer mon projet en 3 minutes | Écrire sur WhatsApp | On vous dit si c'est trop cher pour vous |
| Article de blog | Voir ce que ça donnerait chez vous | — | Diagnostic gratuit, trois minutes |
| Simulateur (démo) | Mettre ce simulateur à mes couleurs | — | Vos barèmes, votre logo, votre page |
| Header (permanent) | Discuter sur WhatsApp | — | — |

### 5.3 Trois formulations à bannir du site

- « En savoir plus » → remplacer par ce qu'on va apprendre.
- « Contactez-nous » → remplacer par ce qu'on obtient en écrivant.
- « Découvrir nos services » → un visiteur ne veut pas découvrir, il veut résoudre.

---

## 6. Ordre d'exécution recommandé

1. **Menu + section 2 de l'accueil** — le tri des audiences. Effort faible, effet
   immédiat sur tout le reste du parcours.
2. **Landing `/outil-conciergerie` en PAS** — c'est la page qui a un prix, un essai
   gratuit et un produit jouable. Le meilleur rendement par mot réécrit.
3. **Hero de l'accueil** — option A, à mesurer contre l'actuel.
4. **Blocs bénéfices et « Pourquoi nous » sur les pages métier.**
5. **Passage complet des CTA** — mécanique, rapide, à faire en une fois.
