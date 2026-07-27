# 14 — Préparation du déploiement production

## Production effectuée le 27 juillet 2026

À la demande explicite du propriétaire, la nouvelle V1 a remplacé l'ancien déploiement
sur le projet Netlify existant `qualifyragence`. Aucune modification DNS n'a été
nécessaire et l'ancien déploiement immuable reste disponible pour le rollback.

- Domaine : <https://qualifyragence.com>
- Hébergeur : Netlify
- Déploiement final : `6a6766d918e9a4681b3bba6e`
- Branche source : `feature/qualifyr-rebrand-v1`
- Commit applicatif : `5b761e6`
- HTTPS : actif
- `www` : redirection permanente vers le domaine canonique
- Indexation : active
- `robots.txt`, sitemap et canonical : vérifiés en production
- Pages principales : réponses `200`
- Page inconnue : réponse `404`
- Ancienne sauvegarde : <https://6a5df4ac65e28d556e8c951f--qualifyragence.netlify.app>

Les formulaires restent volontairement indisponibles tant que les variables d'e-mail ne
sont pas configurées. Les informations légales doivent encore être complétées. Aucun faux
succès de formulaire n'est affiché.

## Mise à jour du 27 juillet 2026

Une nouvelle demande de bascule a été reçue. L'audit a confirmé que le domaine sert toujours
l'ancien projet Netlify, que son déploiement immuable reste disponible et que la délégation
DNS autoritaire est toujours Netlify/NS1. Aucun DNS ni domaine n'a été modifié.

Le projet Vercel reste authentifié et lié à `dorianpmys-projects/qualifyr-rebrand`. Les
variables de production nécessaires aux formulaires sont toujours absentes, et les
informations légales restent incomplètes. La bascule demeure donc bloquée conformément à la
checklist. La redirection certaine `/diagnostic.html` vers `/diagnostic` a été ajoutée au
nouveau site ; aucune destination n'a été inventée pour les autres anciennes URL.

## Statut

**Production non déployée — bascule bloquée.**

Ce rapport a été établi le **26 juillet 2026**. Aucun DNS n’a été modifié, aucun domaine
personnalisé n’a été ajouté au projet Vercel, et l’ancien site Netlify reste en ligne.

## Cible préparée

| Élément | Valeur |
| --- | --- |
| Domaine canonique prévu | <https://qualifyragence.com> |
| Variante prévue | `www.qualifyragence.com` redirigé définitivement vers l’apex |
| Nouvel hébergeur prévu | Vercel |
| Projet Vercel | `dorianpmys-projects/qualifyr-rebrand` |
| Framework | Next.js 16.2.12 |
| Branche examinée | `feature/qualifyr-rebrand-v1` |
| Commit applicatif validé en preview | `fcff6ef952a54ea71ead1498d8507445fe02bfa5` |
| Dernier commit au début de la préparation | `11349e2` |
| Déploiement production créé pendant cette phase | Non |
| Domaine ajouté à Vercel pendant cette phase | Non |

Le dépôt distant ne possède qu’une branche : `feature/qualifyr-rebrand-v1`, qui est aussi
sa branche par défaut. Il n’existe pas encore de branche `main` ou d’autre branche de
production distincte. L’intégration Git automatique Vercel reste déconnectée pour éviter
qu’un push soit promu involontairement.

## Ancien site conservé

- Hébergeur : Netlify.
- Projet : `qualifyragence`.
- URL stable : <https://qualifyragence.netlify.app>.
- Déploiement immuable :
  <https://6a5df4ac65e28d556e8c951f--qualifyragence.netlify.app>.
- Projet et déploiement laissés intacts.
- Plan de retour arrière : `docs/13-rollback-plan.md`.

Le site Netlify contient quatre fonctions et une tâche planifiée. Son dépôt source n’est
pas relié dans Netlify et aucune sauvegarde complète des sources, fonctions et variables
n’a encore été obtenue. La suppression de ce projet est interdite.

## Contrôles effectués

### Code et build

- `npm run test` : **47 tests réussis**.
- `npm run lint` : **réussi**.
- `npm run typecheck` : **réussi**.
- `npm run build` : **réussi**.
- Routes attendues générées : 9 pages publiques, 2 routes API, `robots.txt`, `sitemap.xml`
  et une page 404.
- Deux anciens fichiers TypeScript dupliqués dans `.next/types`, ignorés par Git, ont été
  supprimés avant la relance ; aucun fichier source n’était concerné.

### Authentification et permissions

- Authentification Vercel confirmée pour le compte `dorianpmy`.
- Accès confirmé au projet `dorianpmys-projects/qualifyr-rebrand`.
- Authentification Netlify confirmée en lecture pour le projet historique.
- Aucune connexion ou autorisation OVH n’a été utilisée.

### Métadonnées et domaine

- Domaine de production centralisé dans le code : `https://qualifyragence.com`.
- `metadataBase`, canonical et Open Graph utilisent la configuration centralisée.
- Image Open Graph déclarée.
- HTTPS est actif sur l’ancien site et sur la preview Vercel.
- `site.indexable` est encore `false` : les pages restent `noindex`, `robots.txt` bloque
  tout et le sitemap est vide. C’est volontaire tant que la bascule n’est pas autorisée.

### Formulaires

- La validation locale et les tests automatisés réussissent.
- Sans configuration e-mail, les formulaires répondent honnêtement `503` et n’affichent
  aucun faux succès.
- Aucun test réel de réception, `reply_to` ou accusé de réception n’a pu être réalisé.

## Variables Vercel de production

Aucune variable de production n’est actuellement configurée. Les valeurs ne doivent jamais
être écrites dans ce document.

| Variable | État production | Conséquence |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Absente | Le code utilise son repli, mais la checklist exige une valeur explicite |
| `RESEND_API_KEY` | Absente | Envoi impossible |
| `CONTACT_TO_EMAIL` | Absente | Envoi impossible |
| `CONTACT_FROM_EMAIL` | Absente | Envoi impossible |

## Informations légales

La mise en ligne publique est bloquée. Dans `src/content/company.ts`, les champs suivants
restent absents :

- raison sociale ;
- forme juridique ;
- SIREN ou SIRET ;
- adresse du siège ;
- directeur de la publication ;
- TVA ou mention de franchise ;
- adresse e-mail professionnelle ;
- coordonnées complètes de l’hébergeur ;
- durée de conservation des demandes.

`legalNoticeIsComplete()` renvoie donc `false`.

## DNS et configuration OVH

Aucune modification n’a été effectuée.

La délégation publique actuelle utilise les serveurs de noms Netlify/NS1. La zone
autoritaire est donc Netlify DNS, pas la zone DNS OVH :

- `dns1.p07.nsone.net` ;
- `dns2.p07.nsone.net` ;
- `dns3.p07.nsone.net` ;
- `dns4.p07.nsone.net`.

Les seules entrées retournées par l’API de la zone sont les deux enregistrements web gérés
`NETLIFY` vers `qualifyragence.netlify.app`. Aucun enregistrement e-mail n’a été observé,
mais tout `MX`, SPF, DKIM, DMARC ou `TXT` qui apparaîtrait avant la bascule devra être
conservé.

Les valeurs DNS exactes demandées par Vercel ne peuvent être fournies qu’après ajout des
domaines au projet. Cet ajout n’a pas été effectué, car la sauvegarde et les autres points
bloquants ne sont pas levés. Aucun tableau OVH spéculatif n’est donc produit.

## Redirections

Anciennes URL confirmées par le sitemap public : voir `docs/13-rollback-plan.md`.

Décision certaine :

| Source | Destination | Statut préparé |
| --- | --- | --- |
| `/diagnostic.html` | `/diagnostic` | 301 à implémenter avant bascule |

Les anciennes pages `/ressources/`, `/blog/`, `/ressources/creation-site-internet/` et les
cinq pages `/services/` n’ont pas d’équivalent confirmé dans la nouvelle arborescence.
Aucune redirection vers l’accueil n’a été inventée. Leur destination métier doit être
validée avant production.

## Blocages avant déploiement production

1. Obtenir une sauvegarde complète des sources, fonctions et variables du projet Netlify.
2. Identifier ou fournir le dépôt/source historique utilisé par le déploiement CLI.
3. Compléter et valider toutes les informations légales.
4. Créer l’adresse e-mail professionnelle et configurer Resend.
5. Configurer les quatre variables Vercel de production.
6. Tester réellement les deux formulaires et les e-mails sur la preview.
7. Valider les destinations des anciennes URL et implémenter les redirections.
8. Choisir et créer une branche de production distincte, ou confirmer explicitement que la
   branche de refonte doit jouer ce rôle.
9. Valider les images, les droits SW Carcleaning et les appareils mobiles réels.
10. Relever une dernière fois la zone DNS juste avant la bascule.

## Procédure prévue une fois les blocages levés

1. Commit final et quatre contrôles locaux au vert.
2. Configuration des variables Vercel de production, sans exposer leurs valeurs.
3. Passage documenté de `site.indexable` à `true`.
4. Vérification locale du sitemap à 9 URL et du `robots.txt` ouvert.
5. Déploiement Vercel avec cible explicite `production`.
6. Validation du déploiement sur son URL Vercel avant connexion du domaine.
7. Ajout de l’apex et de `www` au projet Vercel.
8. Lecture des valeurs DNS exactes demandées par Vercel.
9. Modification des seuls enregistrements web dans la zone autoritaire, sans toucher à la
   messagerie.
10. Tests complets sur l’apex et `www`, puis surveillance et maintien du rollback Netlify.

## Rollback

Le plan exécutable est documenté dans `docs/13-rollback-plan.md`. Aucun élément historique
n’a été supprimé. Pendant toute la validation, l’ancien déploiement Netlify doit rester
accessible par son URL immuable.

## Problèmes observés

- Le domaine est actuellement géré par Netlify DNS, alors que la demande mentionne OVH.
- Le site historique n’a pas de dépôt Git relié dans Netlify.
- Le projet Vercel possède déjà un ancien déploiement interne marqué production, créé lors
  de la phase preview, mais aucun domaine final n’y est connecté ; il ne constitue pas la
  mise en production demandée ici.
- Les contrôles techniques du nouveau code sont verts, mais les prérequis légaux,
  opérationnels et de réversibilité ne le sont pas.
