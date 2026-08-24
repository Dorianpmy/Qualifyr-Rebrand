# Roadmap produit — Outil conciergerie

> **Archivé le 24/08/2026.** La verticale conciergerie est abandonnée
> définitivement : le simulateur de revenus locatifs et tout le code associé
> ont été retirés du dépôt (`RentalEstimator.tsx`, `components/estimate/`,
> `lib/estimate/`, `lib/rental-estimate.ts`), et les anciennes routes
> publiques redirigent vers l'accueil (voir `next.config.ts`). Ce document
> n'est plus une feuille de route active — conservé tel quel, sans
> correction, comme trace de la décision et de ce qui avait été envisagé.

Note stratégique du 11/08/2026, à date où le SaaS (`app.qualifyragence.com`)
et les notifications sont opérationnels de bout en bout.

## Constat

Le simulateur donne une fourchette par ville. Le propriétaire la lit et
repart : rien à retenir, rien que la conciergerie puisse lui envoyer ensuite.

## Chantier A — Données réelles (payant, ~29-295 $/mois via API type
AirDNA / Airbtics)

1. **Des comparables réels.** Remplacer la moyenne par ville par : « 14 biens
   similaires dans un rayon de 500 m, prix médian 118 €/nuit, occupation 64 % ».
   Le propriétaire voit son voisinage, pas un chiffre sorti de nulle part.

2. **Un vrai rapport, pas un nombre.** Document nominatif : saisonnalité
   mois par mois, comparables, tarif conseillé, leviers d'amélioration.
   C'est ce document qui déclenche le rendez-vous — pas la page elle-même.

3. **Les leviers chiffrés.** « Photos professionnelles : +8 %. Arrivée
   autonome : +5 %. Calendrier ouvert à 6 mois : +11 %. » On passe d'une
   estimation à un plan d'action, qui justifie au passage le travail de
   la conciergerie.

4. **Le suivi dans le temps.** Réestimation trimestrielle envoyée
   automatiquement au propriétaire non signé — fait revenir les indécis,
   sans effort récurrent.

## Chantier B — Annuaire & acquisition de mandats (gratuit, coûte du travail)

Pages locales qui captent la recherche « combien rapporte mon appartement
à Lyon », redistribuées aux conciergeries abonnées du secteur.

**C'est le vrai basculement** : tant que Qualifyr convertit le trafic des
clients, il reste un complément remplaçable. Le jour où Qualifyr *amène*
des propriétaires, il devient la source de mandats — plus personne ne
résilie, et le prix n'est plus 79 €/mois mais ce que vaut un propriétaire.

## Décision en attente

Payer ~30 €/mois pour des données réelles (comparables + rapport, chantier
A en premier) — ou construire d'abord l'annuaire (chantier B, coûte du
temps, pas d'argent) ?
