# 19 — Écran « Horaires » : le professionnel configure lui-même ses jours et heures d'ouverture (16 septembre 2026)

À la demande de Dorian, en creusant pourquoi aucun créneau ne s'affichait sur la page de
réservation de SW Carcleaning (« Aucun créneau disponible ce jour », quel que soit le jour
essayé) : le moteur de créneaux (`src/lib/detailing/availability.ts`) lit déjà une
configuration hebdomadaire par professionnel (`detailer_availability` : un jour de la
semaine, une heure d'ouverture, une heure de fermeture, un battement entre deux
prestations), mais **aucun écran de l'application ne permet de la renseigner**. La seule
façon d'ajouter une ligne aujourd'hui est une requête SQL manuelle dans Supabase — ce que
personne n'a fait pour SW Carcleaning, d'où l'absence totale de créneaux.

Dorian a choisi de construire un vrai écran plutôt qu'un correctif SQL ponctuel (l'autre
option proposée) : ce document sert de référence avant l'implémentation, conformément à la
règle du projet (« on met à jour le doc d'abord, puis on implémente »).

---

## 0. Ce que je propose, en l'absence d'autre précision de Dorian

Dorian a validé le principe (« construire un vrai écran ») sans détailler
l'emplacement ni le périmètre exact. Les choix ci-dessous sont ceux que je retiens par
défaut ; à corriger avant ou pendant l'implémentation si Dorian préfère autrement.

**0.1 — Emplacement : la page Planning, pas Prestations.**
Prestations regroupe déjà ce qui se règle une fois et qu'on oublie (pays, adresse de
départ, acompte, moyen d'encaissement, grille tarifaire) — la page est déjà longue.
Planning, elle, est entièrement consacrée au temps (aujourd'hui : la tournée du jour) et
porte déjà la capacité `planning` (`src/lib/billing/entitlements.ts`), qui gate déjà
`src/app/app/planning/page.tsx`. Un panneau « Vos horaires d'ouverture » y trouve sa place
naturelle, au-dessus de la tournée du jour — et réutilise la capacité existante sans en
créer une nouvelle.

**0.2 — Un battement unique pour toute la semaine, pas un par jour.**
`detailer_availability.buffer_minutes` est une colonne par ligne (donc techniquement
réglable jour par jour), mais rien ne justifie qu'un professionnel veuille un battement
différent le mardi et le jeudi. Un seul champ « Battement entre deux prestations »
s'applique à tous les jours ouverts au moment de l'enregistrement.

**0.3 — Pas de fermetures ponctuelles (vacances, jours fériés) dans ce chantier.**
`detailer_closures` existe déjà en base et est déjà lu par le moteur de créneaux, mais n'a
pas plus d'écran que les horaires hebdomadaires. Nommée ici pour mémoire, mais hors
périmètre : un professionnel qui part une semaine devra pour l'instant fermer manuellement
chaque jour concerné dans son planning hebdomadaire, ou attendre un futur écran dédié.

**0.4 — Aucun jour ouvert n'est toléré, pas bloqué.**
Un professionnel dont les sept jours sont fermés obtient exactement le bug que Dorian vient
de vivre (zéro créneau, aucun message clair côté client). L'écran affiche un avertissement
si aucun jour n'est ouvert au moment d'enregistrer, mais n'empêche pas la sauvegarde — un
professionnel peut légitimement vouloir tout fermer temporairement.

**0.5 — `minBookingNoticeHours` et `slotGranularityMinutes` restent hors écran.**
Ces deux réglages vivent sur `detailers` (pas sur `detailer_availability`), ont déjà des
valeurs par défaut sensées, et n'ont pas été demandés. Les exposer maintenant serait ajouter
du périmètre non demandé — voir §5.

---

## 1. Modèle de données

Aucune nouvelle colonne : `detailer_availability` existe déjà et porte exactement ce dont
l'écran a besoin (confirmé par sa lecture dans `src/lib/detailing/config.ts:69,113-119` et
son type `WeekdayAvailability`, `src/lib/detailing/types.ts:130-137`).

```sql
-- Nouvelle migration : 026_detailer_availability_unique.sql
--
-- Rien n'empêchait jusqu'ici deux lignes pour le même professionnel et le même
-- jour de la semaine (pas de contrainte visible dans le code applicatif, et
-- aucune migration traçant la création initiale de la table). Le nouvel écran
-- fait un upsert par jour (§2) : sans cette contrainte, un enregistrement
-- répété créerait des doublons plutôt que de remplacer la ligne existante.
create unique index if not exists detailer_availability_detailer_weekday_idx
  on detailer_availability (detailer_id, weekday);
```

---

## 2. Dashboard professionnel — nouveau composant `HoursSetup.tsx`

Même architecture que `PaymentSetup.tsx` (docs/18) : `'use client'`, chargement `GET` au
montage, état local d'édition (« draft ») distinct de ce qui est enregistré, `PUT` pour
sauvegarder, mêmes classes CSS (`styles.panel`, `styles.badge*`, boutons `app-primary` /
`app-ghost`) pour rester visuellement cohérent avec le reste du dashboard.

**Contenu du panneau**, sous le titre « Vos horaires d'ouverture » :

1. Sept lignes, lundi à dimanche (ordre français, converti vers `weekday` 0=dimanche…
   6=samedi au moment de l'enregistrement — l'inverse de la lecture dans `config.ts`) :
   - Un interrupteur Ouvert / Fermé.
   - Si ouvert : deux champs heure (`<input type="time">`), Début et Fin.
2. Un champ unique « Battement entre deux prestations » (minutes), appliqué à tous les
   jours ouverts.
3. Un bouton « Enregistrer », désactivé pendant l'envoi — mêmes états `saving` / `saved` /
   `saveError` que `PaymentSetup.tsx`.
4. Avertissement non bloquant si, au moment d'enregistrer, aucun jour n'est ouvert (§0.4) :
   « Aucun jour ouvert : vos clients ne pourront réserver aucun créneau. »

**Validation, client puis serveur (jamais fait confiance côté client seul)** :
- Un jour ouvert doit avoir une heure de fin strictement après l'heure de début.
- Le battement est un entier ≥ 0.
- Les heures respectent le format `HH:mm` (natif avec `<input type="time">`).

---

## 3. Route API — `src/app/api/app/availability/route.ts`

Même schéma d'autorisation que `payment-settings/route.ts` : `requireCapability('planning')`
(lecture avec `write: false` sur `GET`, écriture par défaut sur `PUT`), puis
`getDetailerForOwner(user.id)` pour retrouver la fiche du professionnel connecté — jamais un
`detailerId` pris depuis le corps de la requête, conformément à l'isolation déjà testée par
`tests/owner-isolation.test.ts` (à étendre à cette route).

```ts
const weekdaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  open: z.boolean(),
  opensAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

const bodySchema = z.object({
  bufferMinutes: z.number().int().min(0).max(240),
  days: z.array(weekdaySchema).length(7),
});
```

**`GET`** : renvoie les sept jours (ouvert/fermé déduit de la présence d'une ligne pour ce
`weekday`) et le battement actuel (celui de la première ligne trouvée — toutes les lignes
partagent la même valeur depuis cet écran, §0.2).

**`PUT`** : pour chaque jour du corps de la requête,
- `open: false` → `delete` la ligne existante pour ce `weekday` s'il y en a une (c'est
  l'absence de ligne qui signale « fermé » à `availableSlots`, §`availability.ts:47-48`).
- `open: true` → valide `opensAt < closesAt`, puis `upsert` sur
  `(detailer_id, weekday)` (contrainte du §1) avec `opens_at`, `closes_at`,
  `buffer_minutes`.

Aucun impact sur le moteur de créneaux lui-même (`availability.ts`, `slots.ts`) : ces
modules lisent déjà `detailer_availability` tel quel, ils n'ont pas besoin de changer.

---

## 4. Ce qui ne change pas

- Le moteur de créneaux (`availability.ts`), la route `GET /api/detailing/[slug]/slots`, et
  tout le tunnel de réservation client restent inchangés — ils lisent déjà la bonne table.
- `minBookingNoticeHours` et `slotGranularityMinutes` gardent leurs valeurs actuelles sur
  `detailers`, non exposées par ce nouvel écran (§0.5).
- Les fermetures ponctuelles (`detailer_closures`) restent sans écran (§0.3).

---

## 5. Plafond quotidien de créneaux — `max_daily_slots` (17 septembre 2026)

Demande de Dorian pour Auto Clean Pro : deux interventions fixes par jour, 16h30 et 17h45,
tous les jours sauf dimanche — pas une amplitude continue. Or `availableSlots` (§ci-dessus)
calcule les débuts possibles en avançant par pas de `slot_granularity_minutes` tant que la
durée demandée tient avant la fermeture : avec une seule amplitude réglée, un client qui
choisit une prestation plus courte (la formule moto, 30 min, par exemple) voit un troisième
créneau apparaître que Dorian ne veut pas proposer — le nombre de créneaux dépend alors de
la durée choisie, jamais d'un chiffre fixe.

**Nouvelle colonne `detailers.max_daily_slots`** (migration 027), lue dans
`AvailabilityConfig.maxDailySlots` (`config.ts`) et appliquée en toute fin de calcul dans
`availableSlots` (`slots.slice(0, maxDailySlots)`) : les créneaux gardés restent toujours
ceux qui tiennent réellement avant la fermeture (aucun horaire fantaisiste n'est inventé),
seul leur nombre est plafonné. `null` (valeur par défaut) : aucun changement pour les
professionnels existants.

**Pas d'écran pour l'instant.** Comme `slotGranularityMinutes` (§0.5, §4), ce réglage n'est
pas exposé dans l'écran Horaires — réglé par SQL pour Auto Clean Pro. Si d'autres
professionnels en ont besoin, ajouter un champ à `HoursSetup.tsx` et à la route
`/api/app/availability` suivrait le même schéma que `bufferMinutes`.
- Aucun impact sur la facturation, les capacités d'abonnement autres que `planning`, ou le
  paiement.

---

## 5. Ordre de construction proposé

1. Migration `026_detailer_availability_unique.sql` (§1) — inoffensive pour les comptes
   existants, `create unique index if not exists`.
2. Route `src/app/api/app/availability/route.ts` (`GET`/`PUT`, §3).
3. Composant `HoursSetup.tsx` (§2), intégré dans `src/app/app/planning/page.tsx` au-dessus
   de « Tournée du jour ».
4. Renseigner SW Carcleaning via l'écran une fois construit (remplace le besoin d'un SQL
   manuel évoqué initialement).
5. `npm run lint && npm run typecheck && npm run test && npm run build` avant toute mise en
   ligne.

Ce document sert de référence : tout écart pris pendant l'implémentation doit d'abord y être
répercuté, conformément à la règle du projet.
