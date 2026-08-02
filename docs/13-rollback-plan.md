# 13 — Plan de retour arrière

> **État actuel (août 2026).** Netlify est resté la plateforme de production. Les sections
> Vercel ci-dessous documentent une migration envisagée puis abandonnée ; elles sont conservées
> comme historique. Le retour arrière actuel consiste à republier l'ancien déploiement Netlify
> immuable documenté ci-dessous, sans changer les DNS et sans supprimer aucun déploiement.

## Principe

La migration vers Vercel doit rester réversible. L’ancien projet Netlify, son déploiement
publié et ses fonctions ne doivent être ni supprimés ni modifiés pendant la période de
validation en production.

Ce document capture l’état observé le **26 juillet 2026**, avant toute modification du
domaine ou des DNS.

## Ancien hébergement

| Élément | Valeur observée |
| --- | --- |
| Hébergeur | Netlify |
| Projet | `qualifyragence` |
| Identifiant du site | `29c8fd56-f7e6-409b-9cae-34e4c4134f43` |
| Console | <https://app.netlify.com/projects/qualifyragence> |
| URL Netlify stable | <https://qualifyragence.netlify.app> |
| Déploiement publié | `6a5df4ac65e28d556e8c951f` |
| URL immuable de l’ancien déploiement | <https://6a5df4ac65e28d556e8c951f--qualifyragence.netlify.app> |
| État | `ready`, contexte `production` |
| Date du déploiement publié | 20 juillet 2026 à 10:13 UTC environ |
| Source du déploiement | Netlify CLI |
| Base de données Netlify | Aucune déclarée (`has_database: false`) |

L’URL immuable répond indépendamment du domaine personnalisé et constitue le premier moyen
de vérifier que l’ancien site reste disponible pendant et après la bascule.

## Ancien projet Git

Netlify ne fournit aucun dépôt Git pour le projet `qualifyragence` : `build_settings` est
vide, `commit_ref` et `commit_url` sont absents, et le déploiement publié indique une source
CLI. Aucune copie locale du contenu public actuel n’a été retrouvée dans
`/Users/dorian/Documents/Codex` par recherche textuelle.

**Conséquence** : le dépôt Git d’origine de l’ancien site n’est pas identifié. Il ne doit
pas être inventé. Une sauvegarde complète des sources et des fonctions doit être fournie ou
exportée séparément avant toute suppression future du projet Netlify.

## Fonctions de l’ancien site à préserver

Le déploiement publié contient au moins les fonctions Netlify suivantes :

- `process-email-sequence`, planifiée chaque jour à `08:15` selon l’expression `15 8 * * *` ;
- `send-guide` ;
- `send-inbound-lead` ;
- `unsubscribe`.

Le projet Netlify indique `use_functions: true`. Le domaine ne doit donc pas être considéré
comme un simple site statique lors de la sauvegarde. Les valeurs d’environnement et les
secrets des fonctions ne sont volontairement pas copiés dans ce dépôt.

## Configuration DNS avant migration

### Délégation

| Type | Nom | Valeur | TTL observé |
| --- | --- | --- | --- |
| NS | `qualifyragence.com` | `dns1.p07.nsone.net` | 3600 |
| NS | `qualifyragence.com` | `dns2.p07.nsone.net` | 3600 |
| NS | `qualifyragence.com` | `dns3.p07.nsone.net` | 3600 |
| NS | `qualifyragence.com` | `dns4.p07.nsone.net` | 3600 |

Le SOA public pointe vers Netlify (`domains+netlify.netlify.com`). La zone active est donc
gérée par **Netlify DNS**, même si le domaine peut être enregistré chez OVH. Une modification
effectuée seulement dans la zone OVH non autoritaire n’aurait aucun effet tant que ces
serveurs de noms restent actifs.

### Enregistrements web gérés par Netlify

| Type Netlify | Hôte | Cible | TTL | Identifiant Netlify |
| --- | --- | --- | --- | --- |
| `NETLIFY` | `qualifyragence.com` | `qualifyragence.netlify.app` | 3600 | `6a038857d99f970008059624` |
| `NETLIFY` | `www.qualifyragence.com` | `qualifyragence.netlify.app` | 3600 | `6a038857d99f970008059625` |

Résolution publique observée pour l’apex et `www` :

- `63.176.8.218` ;
- `35.157.26.135`.

Ces adresses sont la résolution actuelle du service Netlify ; elles ne doivent pas être
recopiées comme valeurs Vercel.

### Messagerie

Aucun enregistrement `MX`, SPF, DKIM, DMARC ou autre `TXT` n’a été retourné par la zone
publique ni par l’API Netlify au moment de la capture. Cela ne constitue pas une autorisation
d’en supprimer ultérieurement : tout enregistrement de messagerie qui apparaîtrait avant la
bascule devra être conservé à l’identique.

## Comportement du domaine avant migration

- `https://qualifyragence.com/` répond `200` depuis Netlify.
- `https://www.qualifyragence.com/` répond `301` vers l’apex.
- HTTPS est actif.
- HSTS observé : `max-age=31536000`.
- Le site actuel est indexable et son canonical pointe vers `https://qualifyragence.com/`.

## Anciennes URL connues

Les URL suivantes figurent dans le sitemap public et répondent `200` avant migration :

| Ancienne URL | Destination envisagée | État |
| --- | --- | --- |
| `/` | `/` | Correspondance directe |
| `/diagnostic.html` | `/diagnostic` | Redirection 301 pertinente |
| `/ressources/` | À déterminer | Aucune page équivalente confirmée |
| `/blog/` | À déterminer | Aucune page équivalente confirmée |
| `/ressources/creation-site-internet/` | À déterminer | Aucune page équivalente confirmée |
| `/services/site-internet-artisan/` | À déterminer | Ancienne cible généraliste, aucune équivalence exacte |
| `/services/automatisation-pme/` | À déterminer | Hors du nouveau positionnement |
| `/services/application-metier-pme/` | À déterminer | Hors du nouveau positionnement |
| `/services/contenu-seo-local/` | À déterminer | Hors du nouveau positionnement |
| `/services/qualifyr-ai/` | À déterminer | Hors du nouveau positionnement |

Seule la redirection `/diagnostic.html` vers `/diagnostic` est suffisamment certaine. Les
autres destinations ne doivent pas être inventées ni redirigées arbitrairement vers
l’accueil.

## Procédure de retour arrière

### Conditions préalables

1. Ne pas supprimer le projet Netlify `qualifyragence`.
2. Ne pas supprimer le déploiement `6a5df4ac65e28d556e8c951f`.
3. Vérifier que son URL immuable répond toujours `200`.
4. Conserver une capture de la zone DNS ci-dessus et relever à nouveau la zone juste avant
   la bascule, car elle peut évoluer.

### Retour du trafic vers Netlify

1. Dans Netlify, vérifier que `qualifyragence.com` et `www.qualifyragence.com` sont toujours
   rattachés au projet `qualifyragence`.
2. Dans la zone DNS **autoritaire** Netlify, restaurer les deux enregistrements web gérés
   `NETLIFY` vers `qualifyragence.netlify.app` avec un TTL de 3600, ou utiliser l’action
   Netlify de rattachement du domaine qui recrée ces enregistrements gérés.
3. Ne modifier aucun enregistrement `MX` ou `TXT` de messagerie.
4. Attendre la propagation puis vérifier :
   - l’apex répond `200` depuis Netlify ;
   - `www` redirige en `301` vers l’apex ;
   - le certificat HTTPS est valide ;
   - les fonctions `send-guide`, `send-inbound-lead`, `unsubscribe` et la tâche planifiée
     restent opérationnelles.
5. Dans le nouveau dépôt, repasser `site.indexable` à `false` avant tout redéploiement de
   diagnostic si la version Vercel reste accessible par une autre URL.

### Vérification de la restauration

Les en-têtes doivent à nouveau contenir `server: Netlify` ou `cache-status: "Netlify Edge"`.
Comparer le contenu avec l’URL immuable :

<https://6a5df4ac65e28d556e8c951f--qualifyragence.netlify.app>

## Éléments encore nécessaires avant bascule

- Sauvegarde téléchargeable complète des fichiers et du code des fonctions de l’ancien site.
- Inventaire ou emplacement du dépôt Git/source utilisé par le déploiement CLI.
- Export des variables d’environnement Netlify vers un coffre sécurisé, sans les commiter.
- Confirmation du gestionnaire réel du domaine chez OVH et des droits disponibles.
- Inventaire Search Console complet des URL indexées et des performances actuelles.
- Décision métier pour chacune des anciennes URL sans équivalent direct.

Tant que ces éléments et les autres points bloquants de `docs/10-launch-checklist.md` ne sont
pas levés, aucune modification DNS ni connexion du domaine à Vercel ne doit être effectuée.
