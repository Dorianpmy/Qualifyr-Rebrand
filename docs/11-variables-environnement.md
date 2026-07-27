# 11 — Variables d'environnement

**Aucun secret n'est versionné.** `.env.example` est le seul fichier d'environnement dans le
dépôt, et il ne contient **aucune valeur**. `.env`, `.env.local` et `.env.*.local` sont
ignorés par Git.

---

## 1. Tableau récapitulatif

| Variable | Obligatoire | Secret | Où la poser | Sans elle |
|---|---|---|---|---|
| `RESEND_API_KEY` | oui, pour l'envoi | **oui** | Vercel + `.env.local` | Envoi impossible |
| `CONTACT_TO_EMAIL` | oui, pour l'envoi | non | Vercel + `.env.local` | Envoi impossible |
| `CONTACT_FROM_EMAIL` | oui, pour l'envoi | non | Vercel + `.env.local` | Envoi impossible |
| `NEXT_PUBLIC_SITE_URL` | non | **non — publique** | Vercel | Repli `https://qualifyragence.com` |
| `NEXT_PUBLIC_SITE_INDEXABLE` | oui en production finale | **non — publique** | Vercel Production uniquement | Site et sitemap maintenus hors index |
| `NEXT_PUBLIC_QUALIFYR_BOOKING_URL` | non | **non — publique** | Vercel + `.env.local` | Boutons vers Contact |
| `NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER` | non | **non — publique** | Vercel + `.env.local` | Résumé affiché sans lien WhatsApp |

**Aucune variable secrète ne porte le préfixe `NEXT_PUBLIC_`.** Ce préfixe expose la valeur
au navigateur : il est réservé à l'URL du site, qui est publique par nature.

---

## 2. Détail

### `RESEND_API_KEY` — **secret**

Clé API du service d'envoi. À générer sur https://resend.com/api-keys.
Forme : commence par `re_`.

Une clé restreinte à l'envoi suffit — inutile de donner les droits de lecture ou
d'administration du domaine.

> **Si cette clé fuite**, la révoquer immédiatement chez Resend et en générer une nouvelle.
> Une clé exposée permet d'envoyer des e-mails **depuis votre domaine**.

### `CONTACT_TO_EMAIL`

Adresse qui reçoit les demandes. Une adresse simple, sans nom d'affichage.

```
bonjour@votre-domaine.tld
```

### `CONTACT_FROM_EMAIL`

Adresse d'expédition. Un nom d'affichage est accepté.

```
Qualifyr Agence <bonjour@qualifyragence.com>
```

**Le domaine doit être vérifié chez Resend**, sinon l'envoi est refusé. La vérification passe
par des enregistrements DNS (SPF, DKIM) à ajouter chez le registrar.

Ne pas utiliser une adresse Gmail ou Outlook comme expéditeur : ces domaines n'autorisent pas
l'envoi par un tiers, et les messages partiraient en indésirables.

### `NEXT_PUBLIC_SITE_URL` — publique

URL canonique, sans barre oblique finale.

```
https://qualifyragence.com
```

Sert aux liens absolus des e-mails, à `metadataBase`, aux `canonical`, au `sitemap.xml` et
aux données structurées. Sans elle, le repli est `https://qualifyragence.com` — donc rien à
poser tant que le domaine final ne change pas.

Sur un aperçu Vercel, la renseigner avec l'URL d'aperçu évite des `canonical` pointant vers
un site qui n'existe pas encore.

### `NEXT_PUBLIC_SITE_INDEXABLE` — publique

Interrupteur de sécurité SEO. La valeur exacte `true` autorise l'indexation et remplit le
sitemap. Toute autre valeur maintient `noindex`, bloque les robots et renvoie un sitemap vide.

Cette variable ne doit être ajoutée qu'à l'environnement **Production**, après validation du
domaine canonique, des informations légales et des formulaires. Elle ne doit jamais être
configurée sur une preview.

---

### Canaux commerciaux publics

`NEXT_PUBLIC_QUALIFYR_BOOKING_URL` accepte uniquement une URL HTTPS vers le calendrier
commercial de Qualifyr. Pour Google Calendar, utiliser l’URL d’intégration de la page de
rendez-vous terminée par `?gv=true`. `NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER` contient le numéro WhatsApp
au format international, chiffres uniquement. Ces valeurs sont publiques par nature.

Si elles manquent ou sont invalides, le site ne génère aucun lien cassé : la réservation
renvoie vers Contact et le diagnostic conserve son résumé avec des alternatives.

---

## 3. Les trois variables d'e-mail vont ensemble

`emailEnv()` ne renvoie une configuration que si **les trois** sont présentes et non vides.
Une seule manquante suffit à considérer l'envoi comme non configuré.

| Situation | Comportement |
|---|---|
| Les trois présentes | Resend. Notification à Qualifyr + accusé de réception. |
| Incomplet, **hors production** | Transport console : l'e-mail est écrit dans le terminal avec la liste des variables manquantes. Aucun accusé de réception. |
| Incomplet, **en production** | Réponse `503` : « Votre message n'a pas été transmis. » **Jamais de faux succès.** Aucun détail technique exposé au visiteur. |

C'est un choix de conception : mieux vaut dire franchement qu'on ne peut pas envoyer que
laisser croire qu'un message est parti.

---

## 4. En développement

```bash
cp .env.example .env.local
```

Puis renseigner, ou laisser vide. **Sans clé, tout fonctionne quand même** : les formulaires
se remplissent, se valident, et l'e-mail complet s'affiche dans le terminal du serveur avec
la liste des variables manquantes. Le parcours est déroulable de bout en bout sans compte
Resend.

---

## 5. En production, sur Vercel

Project Settings → Environment Variables. Une par une, pour l'environnement **Production**
(et **Preview** si l'on veut tester l'envoi réel sur un aperçu).

Après ajout ou modification : **redéployer**. Les variables sont lues au démarrage, pas à
chaud.

---

## 6. Vérifier qu'aucun secret n'a été commité

```bash
# Le dépôt ne doit contenir que .env.example
git ls-files | grep -E '^\.env'

# Aucune clé Resend dans l'historique
git log -p --all | grep -nE 're_[A-Za-z0-9]{20,}'

# Aucune valeur dans .env.example
grep -E '=.+' .env.example
```

Les trois doivent être vides, à l'exception de `.env.example` dans la première.

**Si une clé a été commitée** : la révoquer chez Resend d'abord, en générer une nouvelle, puis
seulement nettoyer l'historique. Retirer un secret de l'historique ne le rend pas inoffensif —
il a pu être lu.

---

## 7. Variables volontairement absentes

| Ce qui n'existe pas | Pourquoi |
|---|---|
| Base de données | Aucun stockage. Les demandes transitent par e-mail. |
| Mesure d'audience | Aucun outil installé. Donc aucune bannière de consentement. |
| CAPTCHA | Champ piège et temps minimal suffisent aujourd'hui. |
| CMS | Le contenu vit dans `src/content/`, versionné. |
| Authentification | Aucun espace client en V1. |

Si l'un de ces éléments est ajouté, il faudra mettre à jour `src/content/legal.ts`,
`src/content/company.ts` et `docs/07` **dans le même commit** que le code.
