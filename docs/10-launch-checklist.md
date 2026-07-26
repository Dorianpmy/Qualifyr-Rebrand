# 10 — Checklist de lancement

À dérouler dans l'ordre. **Tant qu'un point bloquant n'est pas coché, le domaine ne se
connecte pas.**

Légende : **BLOQUANT** = le site ne peut pas être public sans · **IMPORTANT** = à faire avant
d'annoncer le site · **ENSUITE** = après la mise en ligne.

---

## A. Informations légales — **BLOQUANT**

L'article 6 de la LCEN impose l'identification de l'éditeur. Détail : `docs/07`.
Tout se renseigne dans `src/content/company.ts`.

- [ ] **Raison sociale** exacte → `legalName`
- [ ] **Forme juridique** → `legalForm`
- [ ] **SIREN ou SIRET** → `registrationNumber`
- [ ] **Adresse du siège** → `address`
- [ ] **Directeur de la publication** → `publicationDirector`
- [ ] **Hébergeur** : raison sociale, adresse postale, contact → `hosting`
- [ ] **TVA intracommunautaire** *ou* mention « TVA non applicable, art. 293 B du CGI »
      → `vatNumber`. L'une des deux est obligatoire.
- [ ] Capital social et RCS, si société → `shareCapital`, `registry`
- [ ] `legalNoticeIsComplete()` renvoie `true`
- [ ] **Durée de conservation** des demandes arrêtée → `retention.formSubmissions`
- [ ] Relire `src/content/legal.ts` **en entier** : chaque phrase doit rester vraie

---

## B. Adresse e-mail — **BLOQUANT**

- [ ] Adresse professionnelle créée (par exemple sur le domaine)
- [ ] Renseignée dans `company.email`
- [ ] Renseignée dans `contact.email` avec son `href: mailto:`
- [ ] Vérifier qu'elle apparaît bien dans le pied de page et sur `/contact`
      (les blocs sont masqués tant qu'aucun canal n'existe)

---

## C. Fournisseur d'e-mail — **BLOQUANT**

Sans ces trois variables, les formulaires répondent honnêtement qu'ils ne peuvent pas
envoyer — ils ne prétendent jamais avoir transmis. Détail : `docs/11`.

- [ ] Compte Resend créé
- [ ] **Domaine `qualifyragence.com` vérifié chez Resend** (enregistrements DNS).
      Sans domaine vérifié, l'envoi est refusé.
- [ ] `RESEND_API_KEY` générée et posée dans Vercel
- [ ] `CONTACT_TO_EMAIL` posée
- [ ] `CONTACT_FROM_EMAIL` posée, sur le domaine vérifié
- [ ] Aucune de ces valeurs n'est dans le dépôt — vérifier `git log -p | grep -i "re_"`

---

## D. Test réel des formulaires — **BLOQUANT**

Sur l'aperçu Vercel, avec les vraies clés.

- [ ] **Diagnostic** — envoi complet, e-mail bien reçu, `reply_to` correct
- [ ] Diagnostic testé pour nettoyage automobile, detailing, conciergerie et « autre »
- [ ] **Contact** — envoi complet, e-mail bien reçu
- [ ] **Accusé de réception** reçu par l'expéditeur, texte relu
- [ ] Envoi avec champs vides → erreurs par champ, focus sur le premier
- [ ] Envoi avec e-mail invalide → message précis
- [ ] Envoi sans consentement → refusé
- [ ] Saisies **conservées** après une erreur
- [ ] Double clic sur Envoyer → un seul e-mail
- [ ] Confirmation affichée à la place du formulaire, sans redirection
- [ ] Six envois d'affilée → le sixième est refusé (limitation de débit)
- [ ] Vérifier les journaux Vercel : **aucune donnée personnelle**

---

## E. Validation des textes — **IMPORTANT**

- [ ] Relire les 9 pages à voix haute
- [ ] Vérifier que la promesse est identique partout, au mot près
- [ ] Vérifier que les deux verticales officielles sont nommées clairement, sans troisième métier
- [ ] Vérifier que « conciergerie » n'est pas réduit à la seule gestion Airbnb
- [ ] Vérifier qu'aucun projet ou résultat de conciergerie n'est présenté sans preuve réelle
- [ ] Vérifier les réponses de la FAQ — chacune doit rester tenable
- [ ] Vérifier l'étude de cas SW Carcleaning : **aucun résultat n'y figure**
- [ ] Confirmer le nom de l'offre : « Le parcours Qualifyr »
- [ ] Confirmer le libellé du CTA : « Parler de mon activité »
- [ ] Trancher l'URL : `/politique-de-confidentialite` (actuelle) ou
      `/politique-confidentialite`. **Renommable seulement avant la mise en ligne.**

---

## F. Validation des images — **IMPORTANT**

Détail et noms de fichiers attendus : `docs/06`.

- [ ] **Autorisation écrite** de SW Carcleaning pour le nom et les visuels
- [ ] Logo SW Carcleaning → `plate.logo` dans `sw-car-cleaning.ts`
- [ ] Captures d'écran → tableau `gallery` (la section apparaît toute seule)
- [ ] Photographies du métier
- [ ] **Un texte alternatif écrit à la main pour chaque image** — le typage l'impose,
      une image sans `alt` fait échouer le build
- [ ] Logo Qualifyr définitif → `Logo.tsx` et `icon.svg`
- [ ] Image de partage à refaire si le logo change → `public/images/og/`

---

## G. Validation mobile — **IMPORTANT**

Sur appareils réels, pas seulement en simulateur.

- [ ] iPhone avec encoche : zones sûres en haut et en bas
- [ ] Menu mobile : ouverture, fermeture, `Échap`, retour du focus
- [ ] Défilement bloqué quand le menu est ouvert
- [ ] Les deux formulaires remplis au pouce
- [ ] Aucun zoom automatique à la mise au point d'un champ
- [ ] Aucun défilement horizontal, à aucune largeur
- [ ] Android, navigateur par défaut
- [ ] « Réduire les animations » activé → tout est immédiatement visible
- [ ] Contrôle aux 9 largeurs : 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920

---

## H. Sauvegarde de l'ancien site — **BLOQUANT avant bascule**

À faire **avant** de toucher au domaine. C'est la seule étape irréversible.

- [ ] Sauvegarde complète des fichiers de l'ancien site
- [ ] Export de la base de données, s'il y en a une
- [ ] **Inventaire des URL indexées** — Search Console, ou `site:qualifyragence.com`
- [ ] **Plan de redirections 301** ancienne URL → nouvelle
- [ ] Capture des positions actuelles dans les résultats de recherche
- [ ] Sauvegarde de la configuration DNS actuelle
- [ ] **Ne pas supprimer l'ancien déploiement** : il reste le plan de repli

---

## I. Domaine et mise en ligne — **BLOQUANT**

Dans cet ordre, sans en sauter.

- [ ] Aperçu Vercel validé de bout en bout
- [ ] Redirections 301 en place
- [ ] `site.indexable` passé à **`true`** dans `src/content/site.ts`
- [ ] Vérifier : `robots.txt` autorise, `sitemap.xml` contient les 9 URL,
      les pages sont en `index, follow`
- [ ] `NEXT_PUBLIC_SITE_URL` posée sur le domaine final
- [ ] Domaine connecté dans Vercel
- [ ] HTTPS actif, certificat valide
- [ ] Redirection `www` → apex, ou l'inverse — **une seule** version servie
- [ ] `http` → `https`
- [ ] Vérifier l'en-tête HSTS
- [ ] Sitemap soumis à la Search Console
- [ ] Les 9 pages répondent 200, une URL inconnue répond 404

---

## J. Après la mise en ligne — **ENSUITE**

- [ ] Lighthouse mobile — noter les Core Web Vitals réels
- [ ] Valider les données structurées (test des résultats enrichis)
- [ ] Aperçu du partage sur WhatsApp, LinkedIn, iMessage
- [ ] Vérifier l'absence de 404 en Search Console à J+7
- [ ] Un envoi de formulaire par semaine, pour s'assurer que la clé est vivante
- [ ] Envisager une Content-Security-Policy avec `nonce` (voir `docs/09`, §7.3)
- [ ] Envisager une mesure d'audience sans cookie. **Si elle est ajoutée**, mettre à jour
      `src/content/legal.ts`, `company.ts` (`tracking`) et `docs/07` **dans le même commit**

---

## K. Contrôles à relancer avant chaque mise en ligne

```bash
npm run test        # 48 tests
npm run lint
npm run typecheck
npm run build

npx next start &
python3 scripts/audit-seo.py  http://localhost:3000
python3 scripts/audit-a11y.py http://localhost:3000
```

Les six doivent passer. Aucune mise en ligne avec l'une d'elles en échec.

---

## L. Plan de repli

Si un problème apparaît après la bascule :

1. Repointer le domaine vers l'ancien déploiement — **c'est pourquoi il ne doit pas être
   supprimé**.
2. Repasser `site.indexable` à `false` et redéployer, pour éviter l'indexation d'un site
   cassé.
3. Diagnostiquer sur l'aperçu, jamais en production.
