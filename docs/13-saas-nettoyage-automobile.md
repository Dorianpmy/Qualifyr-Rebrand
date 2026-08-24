# SaaS Nettoyage automobile & detailing — cahier des charges

> **Note du 24/08/2026 :** ce cahier des charges est satisfait — le produit qu'il décrit
> est construit et en service. Il a été rédigé en prenant « l'outil conciergerie » comme
> précédent et modèle de conventions ; cette verticale est depuis abandonnée
> définitivement. Les mentions ci-dessous ne sont pas corrigées : elles expliquent
> pourquoi certains choix techniques ont été faits ainsi, pas l'état actuel du produit.

Spécification produit et technique. Rédigée le 12/08/2026.

Second produit de la gamme, après l'outil conciergerie. Même promesse : une
page publique qui chiffre, qualifie et transmet une demande exploitable.

---

## 0. Trois arbitrages avant tout le reste

### 0.1 Réservation immédiate : les garde-fous qui la rendent tenable

**Décision retenue : réservation directe avec acompte.** L'acompte filtre les
faux rendez-vous, qui sont le vrai fléau du métier — un créneau perdu ne se
rattrape pas.

Le risque reste entier et il est simple à nommer : l'estimation repose sur un
**état déclaré par le client**, et cette déclaration est fausse une fois sur
deux, sans mauvaise foi. Un propriétaire de golden retriever trouve
sincèrement que son coffre est « normal ». Quatre mécanismes le neutralisent,
et aucun n'est optionnel.

**1. Les photos conditionnent le paiement.** Elles sont exigées **avant** le
passage au paiement, pas après (§0.2). Le professionnel reçoit un rendez-vous
déjà documenté ; s'il voit un problème, il rappelle avant l'intervention.

**2. Le devis est annoncé comme révisable, en toutes lettres.** Sur le
récapitulatif et dans l'e-mail de confirmation :

> Ce montant repose sur l'état que vous avez décrit. À son arrivée,
> {nom} vérifie le véhicule avant de commencer. Si l'état diffère de ce qui a
> été annoncé, il vous propose un montant ajusté — et vous restez libre de
> refuser. Votre acompte vous est alors rendu.

Cette dernière phrase est la contrepartie indispensable d'un encaissement
avant prestation. Sans elle, un litige devient une réclamation bancaire, et
les réclamations coûtent au professionnel bien plus que le créneau perdu.

**3. L'acompte est plafonné.** Un pourcentage réglable, borné à 30 %, jamais le
total. Un acompte modeste suffit à engager, un acompte élevé transforme chaque
désaccord en conflit.

**4. L'annulation est possible et cadrée.** Gratuite jusqu'à un délai réglé par
le professionnel — 48 h par défaut. En deçà, l'acompte reste acquis. La règle
est affichée avant le paiement, pas enfouie dans des conditions générales.

> **Point juridique à faire valider — je ne suis pas juriste.** En vente à
> distance à un consommateur, un acompte non remboursable sur une prestation
> réservée en ligne n'est pas toujours opposable en droit français. Le
> mécanisme d'annulation gratuite ci-dessus limite l'exposition, mais fais
> vérifier la politique et les conditions générales avant d'encaisser le
> premier euro pour le compte d'un client.

### 0.2 Les photos sont la fonction, pas un accessoire

Le point de rupture du métier est l'écart entre l'état déclaré et l'état réel.
Tout le reste en découle : marge écrasée, planning explosé, tension au premier
contact.

La réponse est aussi la réponse à ton « expérience ultra-visuelle » :
**trois photos obligatoires** au moment de la demande — intérieur avant,
intérieur arrière, extérieur trois quarts. Le professionnel voit le véhicule
avant de confirmer, ajuste si nécessaire, et confirme un devis qu'il tiendra.

C'est ce qui distingue le produit d'un simple configurateur de prix, et c'est
défendable commercialement : « vous ne découvrez plus la voiture en arrivant ».

### 0.3 La durée prime sur le prix

Un detailer indépendant n'est pas limité par la demande, il est limité par ses
créneaux. Une estimation de prix juste avec une durée fausse détruit sa
journée ; l'inverse est supportable.

Conséquence technique : **le moteur calcule la durée d'abord**, le prix ensuite.
Les deux dérivent des mêmes coefficients, et le back-office règle les deux.

---

## 1. Modèle de données

Même socle que l'outil conciergerie : Supabase, Next.js App Router, Stripe,
connexion par lien magique. La structure ci-dessous en reprend les conventions.

### `detailers`

Le professionnel et sa page publique.

| Colonne | Type | Rôle |
|---|---|---|
| `id`, `owner_id`, `slug` | uuid / text | Identique au modèle conciergerie |
| `name`, `city`, `phone`, `contact_email` | text | Identité et notifications |
| `published` | boolean | Page en ligne |
| `mobile_service` | boolean | Intervient à domicile |
| `workshop_service` | boolean | Reçoit à l'atelier |
| `workshop_address` | text | Affichée si `workshop_service` |
| `travel_free_radius_km` | int | Déplacement offert en deçà |
| `travel_fee_per_km` | numeric | Au-delà du rayon offert |
| `travel_max_km` | int | Refus au-delà — évite les demandes ingérables |
| `deposit_enabled` | boolean | v2 seulement (§0.1) |
| `subscription_*`, `trial_ends_at` | — | Identique |

### `detailer_prices`

**Une ligne par couple (formule × gabarit).** C'est la table que le
professionnel règle, et la seule source du calcul.

| Colonne | Type | Rôle |
|---|---|---|
| `detailer_id` | uuid | |
| `scope` | enum | `interieur`, `exterieur`, `complet` |
| `vehicle_size` | enum | `citadine`, `berline`, `suv`, `utilitaire`, `prestige` |
| `base_price` | numeric | Prix de base, en euros |
| `base_minutes` | int | Durée de base, en minutes |

Quinze lignes par professionnel, créées à l'inscription avec des valeurs de
départ modifiables.

**Pourquoi une table et non des coefficients par gabarit.** Un SUV ne coûte pas
« 1,3 × une citadine » de façon uniforme : l'écart est fort en intérieur, faible
en extérieur. Une grille laisse le professionnel poser ses vrais prix, et c'est
lui qui connaît son métier — même principe que les barèmes de la conciergerie.

### `detailer_options`

| Colonne | Type | Rôle |
|---|---|---|
| `detailer_id`, `option_key` | | `shampouinage`, `ceramique`, `polissage`, `phares`, `ozone` |
| `enabled` | boolean | Le professionnel ne propose pas forcément tout |
| `price`, `minutes` | numeric / int | Surcoût et durée ajoutée |
| `scale_with_size` | boolean | Le polissage suit le gabarit, la rénovation de phares non |

### `detailer_soiling`

| Colonne | Type | Rôle |
|---|---|---|
| `level` | enum | `normal`, `tres_sale`, `poils_taches` |
| `labour_multiplier` | numeric | 1,0 / 1,25 / 1,45 par défaut |

### `detailer_bookings`

La réservation. Remplace la logique de simple demande : ici, une ligne
confirmée **occupe un créneau** et engage les deux parties.

| Colonne | Type | Rôle |
|---|---|---|
| `detailer_id`, `email`, `phone` | | |
| `vehicle_size`, `vehicle_model`, `plate` | | Modèle et immatriculation saisis |
| `scope`, `soiling`, `options` | enum / jsonb | Ce qui a été demandé |
| `location_mode` | enum | `domicile` / `atelier` |
| `postal_code`, `travel_zone`, `travel_fee` | | Nul si atelier |
| `quoted_price`, `quoted_minutes` | | **Recalculés côté serveur** |
| `deposit_amount`, `stripe_payment_intent` | | Acompte encaissé |
| `photos` | jsonb | Chemins Supabase Storage, exigés avant paiement |
| `slot` | **tstzrange** | Créneau occupé, borne haute exclue |
| `status` | enum | `en_attente_paiement`, `confirme`, `ajuste`, `realise`, `annule`, `expire` |
| `adjusted_price`, `adjustment_reason` | | Renseignés si révision sur place |
| `hold_expires_at` | timestamptz | Voir §2.5 |

**`slot` est un intervalle, pas un horodatage.** Une réservation de 4 h 15
occupe une plage, et c'est cette plage qui doit être indisponible pour les
suivants. Stocker un simple `scheduled_at` obligerait à recalculer la durée à
chaque vérification de disponibilité — donc à la recalculer faux le jour où le
tarif change.

### `detailer_availability`

Les heures d'ouverture, par jour de semaine, plus les exceptions.

| Colonne | Type | Rôle |
|---|---|---|
| `weekday` | int | 0 à 6 |
| `opens_at`, `closes_at` | time | Amplitude travaillée |
| `buffer_minutes` | int | Battement entre deux interventions |

| `detailer_closures` | | Fermetures ponctuelles : congés, jours fériés |
|---|---|---|
| `starts_at`, `ends_at` | timestamptz | Plage indisponible |

---

## 2. Moteur de calcul

Module pur, sans dépendance React — même contrainte que le moteur
d'estimation locative : le devis envoyé par e-mail doit être produit côté
serveur à partir du même code que la page.

```ts
export function quote(input: QuoteInput, config: DetailerConfig): Quote;
```

### 2.1 L'ordre des opérations

```
1. base            = prix(formule, gabarit)          ← table detailer_prices
2. options         = Σ prix(option) × (gabarit si scale_with_size)
3. main d'œuvre    = (base + options) × multiplicateur(salissure)
4. déplacement     = max(0, km − rayon_offert) × tarif_km
5. total           = main d'œuvre + déplacement
```

### 2.2 La subtilité qui compte

**Le multiplicateur de salissure ne s'applique pas à tout.**

Un traitement céramique ne coûte pas plus cher parce que la voiture est sale —
le produit et le temps de pose sont identiques une fois la carrosserie
préparée. Un shampouinage de sièges, si : c'est exactement là que les poils
d'animaux se paient.

Chaque option porte donc un drapeau `affected_by_soiling` :

| Option | Sensible à la salissure |
|---|---|
| Shampouinage sièges | Oui |
| Traitement anti-odeur ozone | Oui |
| Polissage carrosserie | Non |
| Traitement céramique | Non |
| Rénovation phares | Non |

Appliquer le multiplicateur à l'ensemble gonflerait le devis d'un client qui
prend une céramique sur une voiture sale — et il le sentirait.

### 2.3 La durée suit la même structure

Mêmes étapes avec `base_minutes` et les minutes de chaque option. La durée
affichée est **arrondie au quart d'heure supérieur** : annoncer « 3 h 27 »
donne une fausse impression de précision et ne sert personne.

Au-delà d'un seuil réglable — six heures par défaut — la page affiche
« intervention sur deux demi-journées » plutôt qu'une durée qui effraie.

### 2.4 Réservation : le verrouillage du créneau

C'est le point où une réservation immédiate se casse, et où aucune astuce
applicative ne suffit.

**Le double-clic n'est pas le problème. La concurrence l'est.** Deux clients
qui valident le même créneau à trois secondes d'intervalle passent tous les
deux la vérification « ce créneau est-il libre ? » avant que l'un des deux
n'ait écrit. Une vérification en JavaScript, ou même une requête `select`
suivie d'un `insert`, laisse systématiquement passer ce cas.

**La garantie doit venir de la base**, par une contrainte d'exclusion :

```sql
create extension if not exists btree_gist;

alter table detailer_bookings
  add constraint detailer_bookings_no_overlap
  exclude using gist (
    detailer_id with =,
    slot with &&
  )
  where (status in ('en_attente_paiement', 'confirme', 'ajuste'));
```

Postgres refuse alors physiquement deux réservations qui se chevauchent chez
le même professionnel. Le second `insert` échoue, l'application affiche
« ce créneau vient d'être pris » et propose les suivants. C'est la seule
implémentation qui tienne sous charge, et elle tient aussi le jour où une
seconde interface écrira dans la table.

La clause `where` est essentielle : une réservation annulée ou expirée doit
libérer sa plage.

### 2.5 Paiement et créneau : l'ordre des opérations

Il y a deux mauvaises façons de faire et une bonne.

Verrouiller le créneau **puis** encaisser laisse les paniers abandonnés bloquer
l'agenda : un client qui ferme son onglet condamne un samedi matin. Encaisser
**puis** verrouiller expose à prendre l'argent de deux clients pour le même
créneau, ce qui est bien pire.

**La réservation naît donc en attente, avec une expiration.**

```
1. Le client valide       → insert en `en_attente_paiement`,
                            hold_expires_at = maintenant + 15 min
                            (la contrainte d'exclusion s'applique déjà)
2. Redirection Stripe     → paiement de l'acompte
3. Webhook `succeeded`    → status = `confirme`, hold_expires_at = null
4. Abandon ou échec       → une tâche planifiée repasse en `expire`
                            les lignes dont le hold est dépassé
```

Le créneau est donc réservé pendant le paiement, mais jamais indéfiniment.
Quinze minutes couvrent un paiement avec authentification bancaire sans
immobiliser l'agenda.

**Le webhook fait foi, pas la page de retour.** Un client qui ferme son
navigateur après avoir payé ne doit pas perdre sa réservation — c'est
exactement la situation qui produit une réclamation bancaire.

La tâche d'expiration réutilise le mécanisme de relances déjà en place dans
`qualifyr-saas` : même route protégée par secret, même planificateur.

### 2.6 Les créneaux proposés

Un module pur, comme le moteur de calcul :

```ts
export function availableSlots(
  day: Date,
  durationMinutes: number,
  config: AvailabilityConfig,
  booked: readonly TimeRange[],
): readonly TimeRange[];
```

Il découpe l'amplitude d'ouverture, retire les réservations existantes, les
fermetures, et applique le battement entre interventions. **La durée vient du
moteur de calcul** : un client qui a choisi quatre heures d'options ne voit que
les créneaux où quatre heures tiennent, ce qui supprime le motif d'annulation
le plus courant.

Deux règles qui évitent des journées invivables. Aucun créneau ne se termine
après l'heure de fermeture — un devis de six heures à 15 h n'est pas proposé,
il bascule au lendemain. Et un délai minimal de réservation, réglable, empêche
qu'on réserve pour dans une heure.

### 2.7 Le déplacement, sans API payante

Pas de calcul de distance routière : elle exige une API de cartographie
facturée, pour un gain nul.

**Zones par code postal**, saisies par le professionnel : une liste de codes
postaux par palier tarifaire — offert, +15 €, +30 €. Le client saisit son code
postal, la zone est trouvée, le tarif est connu. C'est gratuit, exact, et le
professionnel maîtrise son périmètre.

Un code postal hors zone affiche « nous ne nous déplaçons pas encore chez
vous » plutôt qu'un devis impossible à honorer.

---

## 3. Page publique — parcours

Cinq étapes, une décision par écran. Le prix et la durée sont **visibles en
permanence** à partir de l'étape 2 et se mettent à jour à chaque choix : c'est
le mécanisme qui fait monter le panier, bien plus qu'un argumentaire.

1. **Le véhicule** — gabarit en cinq vignettes illustrées, puis modèle et
   immatriculation.
2. **La formule** — intérieur, extérieur, complet. Le prix apparaît ici.
3. **L'état** — trois niveaux, avec une phrase concrète chacun plutôt qu'un
   adjectif : « quelques miettes et poussière » / « taches visibles sur les
   sièges » / « poils d'animaux, taches anciennes ».
4. **Les options** — chacune avec son surcoût, sa durée ajoutée et son
   explication.
5. **Le lieu** — domicile ou atelier, code postal. Un code hors zone arrête
   ici le parcours, avant que le client n'ait investi ses photos.
6. **Le créneau** — seuls les créneaux où la durée calculée tient sont
   proposés (§2.6).
7. **Les photos et le paiement** — trois photos exigées **avant** le bouton de
   paiement, puis coordonnées, récapitulatif, mention de révision (§0.1) et
   redirection Stripe.

### 3.1 Les explications qui font monter le panier

Chaque option porte deux lignes, écrites une fois pour toutes — pas de champ
libre, même raison que sur la page conciergerie : la qualité rédactionnelle
est ce qui distingue le produit.

Le registre est **la conséquence, pas la technique** :

> **Traitement céramique** — La peinture reste propre plus longtemps et se lave
> en deux fois moins de temps. Compter deux à trois ans de protection, contre
> deux mois pour une cire classique.

> **Shampouinage des sièges** — Ce qui part avec l'aspirateur, ce sont les
> miettes. Les taches et les odeurs sont dans la mousse, et seul un
> shampouinage-extraction les en sort.

> **Rénovation des phares** — Des phares jaunis éclairent jusqu'à 40 % moins
> loin. C'est la seule prestation esthétique qui soit aussi une question de
> sécurité.

**Interdit** : tout pourcentage ou chiffre non sourçable. La règle du site
d'agence s'applique ici (`AGENTS.md` §6). Le « 40 % » ci-dessus doit être
vérifié avant mise en ligne, ou reformulé qualitativement.

---

## 4. Back-office professionnel

Trois écrans, pas davantage.

**Demandes** — même table que le tableau de bord conciergerie : reçue, contact,
véhicule, devis, statut. Plus les photos en vignette, et deux actions directes :
*confirmer le devis* ou *proposer un autre montant* avec un mot au client.

**Planning** — les demandes confirmées, par jour, avec leur durée estimée.
C'est l'écran qui rend l'outil indispensable au quotidien : il voit tout de
suite si sa journée tient.

**Tarifs** — la grille quinze lignes, les options, les multiplicateurs de
salissure, les zones de déplacement. Un aperçu en direct affiche « une berline
complète très sale à 12 km = 285 €, 4 h 15 », pour qu'il règle en voyant le
résultat.

---

## 5. Ce qui est réutilisable tel quel

Depuis `qualifyr-saas`, sans réécriture :

- l'authentification par lien magique et la structure des espaces ;
- le squelette de page publique et son socle de style ;
- la table des demandes, les statuts, les relances automatiques ;
- l'abonnement Stripe, l'essai gratuit, le portail de facturation ;
- la notification de nouvelle demande et sa journalisation.

**Environ 60 % du produit existe déjà.** Le travail neuf est le moteur de
calcul, la grille tarifaire, les photos et le planning.

### Une question à trancher tôt

Deux produits séparés, ou **un seul produit à deux verticales** ? La seconde
option correspond exactement au positionnement de l'agence — deux métiers, pas
trente — divise la maintenance par deux, et permet un tarif unique à 79 €. Le
coût est une abstraction supplémentaire dans le code.

Recommandation : deux dépôts tant que le second produit n'a pas ses premiers
clients, puis fusion une fois le modèle validé. Fusionner du code éprouvé est
simple ; maintenir une abstraction prématurée ne l'est pas.

---

## 6. Ordre de construction

1. **Moteur de calcul et grille tarifaire** — pur, testable, sans interface.
   Tout le reste en dépend, y compris les créneaux proposés.
2. **Moteur de disponibilité** (§2.6) — pur également, et testable sans base :
   c'est lui qui décide ce que le client peut réserver.
3. **Contrainte d'exclusion et cycle de réservation** (§2.4, §2.5) — à poser
   avant toute interface. Rétrofiter un verrouillage sur des réservations
   existantes est une migration désagréable.
4. **Parcours public en sept étapes**, avec photos avant paiement.
5. **Paiement Stripe et webhook**, plus la tâche d'expiration des créneaux.
6. **Back-office : planning et tarifs.**
7. **Révision sur place** — statut `ajuste`, montant corrigé, motif.
