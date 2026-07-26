# 07 — Informations légales requises avant la mise en production

Document de travail. Il liste **précisément** ce qui doit être fourni avant de connecter le
domaine `qualifyragence.com`.

Tant qu'un élément figure ici comme manquant, **il n'apparaît nulle part sur le site** : ni
placeholder, ni mention « à compléter », ni valeur approchée. Les pages légales affichent ce
qui est connu et signalent honnêtement que le reste sera publié avant la mise en ligne.

Source unique : `src/content/company.ts`. Une valeur renseignée y apparaît automatiquement sur
les pages concernées.

---

## 1. Bloquant — sans cela, le site ne peut pas être mis en ligne

En France, l'article 6 de la LCEN impose l'identification de l'éditeur d'un site professionnel.
Un site en ligne sans ces mentions expose son éditeur à des sanctions.

| # | Information | Champ dans `company.ts` | Où la trouver |
|---|---|---|---|
| 1 | **Raison sociale** exacte, telle qu'immatriculée | `legalName` | Avis de situation SIRENE / extrait Kbis |
| 2 | **Forme juridique** — micro-entreprise, SASU, SARL… | `legalForm` | idem |
| 3 | **SIREN ou SIRET** | `registrationNumber` | idem |
| 4 | **Adresse du siège** | `address` | idem |
| 5 | **Directeur de la publication** — prénom et nom | `publicationDirector` | Le représentant légal, en pratique |
| 6 | **Adresse e-mail de contact** publiée | `email` | À arbitrer : `bonjour@qualifyragence.com` ou autre |
| 7 | **Hébergeur** — raison sociale, adresse postale complète, téléphone ou formulaire | `hosting` | Vercel Inc. si Vercel est retenu ; à confirmer avec l'adresse exacte |

---

## 2. Selon la situation

| # | Information | Champ | Remarque |
|---|---|---|---|
| 8 | **Numéro de TVA intracommunautaire** | `vatNumber` | Si non assujetti, il faut publier la mention « TVA non applicable, article 293 B du CGI ». L'une **ou** l'autre est obligatoire. |
| 9 | **Capital social** | `shareCapital` | Uniquement pour les sociétés (SASU, SARL…). Sans objet en micro-entreprise. |
| 10 | **Greffe et numéro RCS** | `registry` | Uniquement pour les sociétés commerciales. |
| 11 | **Téléphone publié** | `phone` | Facultatif. À ne renseigner que si Dorian souhaite l'afficher. |

---

## 3. Protection des données

| # | Information | Champ | État |
|---|---|---|---|
| 12 | **Durée de conservation des demandes** | `retention.formSubmissions` | **À arrêter.** La page le reconnaît explicitement plutôt que d'annoncer une durée non tenue. Un ordre de grandeur courant : 3 ans après le dernier contact pour une demande commerciale. |
| 13 | **Sous-traitant e-mail** | `processors` | **À ajouter dès que Resend sera configuré** : nom, finalité, lieu de traitement, et le cas échéant les garanties de transfert hors UE. |
| 14 | **Hébergeur comme sous-traitant** | `processors` | Idem, dès que l'hébergement sera arrêté. |

**Point d'attention** : Resend et Vercel sont des sociétés américaines. Si elles sont
retenues, la politique de confidentialité devra mentionner le transfert de données hors Union
européenne et le mécanisme qui l'encadre (clauses contractuelles types, Data Privacy
Framework). Ce paragraphe n'est pas écrit aujourd'hui, puisque aucun des deux n'est en service.

---

## 4. Ce qui est déjà vrai et n'a pas besoin d'être fourni

Ces affirmations figurent dans la politique de confidentialité et correspondent au code réel :

- **Aucun cookie n'est déposé** — vérifié : le site n'écrit rien dans le navigateur.
- **Aucun outil de mesure d'audience** n'est installé — aucune bannière de consentement n'est
  donc nécessaire.
- **Aucune donnée n'est stockée en base** — les demandes transitent uniquement par e-mail.
- **Le consentement n'est jamais pré-coché** et conditionne l'envoi.
- **Les journaux serveur ne contiennent aucune donnée personnelle** — ni nom, ni e-mail, ni
  message, ni adresse IP.

**Si l'une de ces conditions change, ce document et `src/content/legal.ts` doivent être mis à
jour dans le même commit que le code.** Une politique de confidentialité qui décrit un site
qui n'existe plus est pire qu'une absence de politique.

---

## 5. Marche à suivre

1. Réunir les informations des sections 1 et 2.
2. Les renseigner dans `src/content/company.ts` — un champ à la fois, sans en inventer aucun.
3. Arrêter la durée de conservation (§3, ligne 12) et la renseigner dans `retention`.
4. Une fois Resend et l'hébergeur configurés, ajouter les entrées dans `processors` et écrire
   le paragraphe sur le transfert hors UE si nécessaire.
5. Relire `src/content/legal.ts` en entier : chaque phrase doit rester vraie.
6. Vérifier que `legalNoticeIsComplete()` renvoie `true`.
7. Lancer `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
8. Alors seulement, connecter le domaine et passer `site.indexable` à `true`.

---

## 6. État à ce jour

**Aucune des informations bloquantes n'est renseignée.** `legalNoticeIsComplete()` renvoie
`false`, et la page Mentions légales affiche une note expliquant que ces informations seront
publiées avant la mise en ligne — sans en simuler aucune.
