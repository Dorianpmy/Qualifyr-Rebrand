# Page de résultats de l'estimation — structure

Spécification pour l'outil d'acquisition (SaaS). Rédigée le 12/08/2026.

**Contrainte fondatrice : aucune donnée inventée.** Le lecteur de cette page
décide de confier un bien de plusieurs centaines de milliers d'euros, et c'est
la crédibilité de la conciergerie abonnée qui est engagée. Un comparable
fabriqué se vérifie en ouvrant Airbnb dans l'onglet voisin ; il coûte le
prospect *et* le client qui paie l'abonnement.

Tout ce qui suit est calculable gratuitement, à partir du moteur existant
(`rental-estimate.ts`), des paramètres saisis par la conciergerie, et de
sources publiques citables.

---

## 1. L'écran, de haut en bas

### Bloc 0 — Le calcul, mis en scène (2 s)

Pas de spinner. Les hypothèses s'affichent une par une, en chasse fixe :

```
Tarif moyen de la zone……… 95 € / nuit
Saisonnalité…………………… appliquée sur 12 mois
Frais de plateforme………… 3 %
Ménage et linge……………… 65 € / séjour
Commission conciergerie…… 20 %
```

Coût : nul. Effet : le visiteur voit une méthode, pas une boîte noire. C'est
le seul moment « waouh » qui ne dépend d'aucune donnée.

### Bloc 1 — Trois scénarios, jamais un chiffre

| Scénario | Base de calcul | Rôle |
|---|---|---|
| Prudent | occupation −15 %, tarif −10 % | Désamorce l'accusation de survente |
| Réaliste | barème de la conciergerie | La référence |
| Optimisé | occupation +10 %, tarif +8 % | **Vend la conciergerie** : c'est le résultat avec un professionnel aux commandes |

Le scénario réaliste est mis en avant ; les deux autres restent visibles. Un
propriétaire croit une fourchette, jamais un nombre rond isolé.

### Bloc 2 — Le net réel *(le différenciateur)*

Une cascade descendante, une ligne par retenue, montants en chasse fixe :

```
Revenus bruts……………………………  18 400 €
− Frais de plateforme (3 %)………     552 €
− Ménage et linge (72 séjours)……   4 680 €
− Taxe de séjour……………………       410 €
− Commission conciergerie (20 %)…   3 680 €
─────────────────────────────────────────
Net propriétaire estimé……………     9 078 €
```

Tous les taux sont publics ou connus de la conciergerie. Aucun simulateur
concurrent n'affiche cette cascade : ils annoncent un brut flatteur, et le
propriétaire se sent floué au premier relevé. Celui qui montre le net **avant**
la signature achète une confiance que personne d'autre ne construit.

### Bloc 3 — Courte durée contre location classique *(la diapositive qui décide)*

Deux barres à la même échelle, net contre net.

La question réelle du propriétaire n'est pas « combien ça rapporte » mais
« est-ce que ça vaut mieux que mon locataire actuel ». Les loyers d'annonce par
commune sont publiés en open data (carte des loyers, data.gouv.fr) : gratuit,
citable, et suffisant pour un ordre de grandeur au m².

À afficher juste en dessous, **le seuil de bascule** : « À partir de 41 %
d'occupation, la courte durée dépasse votre loyer actuel. » Un critère de
décision, pas une promesse.

### Bloc 4 — Saisonnalité, douze barres

Le tarif de base × une courbe mensuelle par zone. Les profils de fréquentation
touristique départementaux sont publics, et la conciergerie connaît sa saison
mieux qu'une API.

L'argument commercial est dans les mois creux, pas dans les pics : c'est là
qu'un professionnel fait la différence, et le graphique le montre sans qu'on
ait à l'écrire.

### Bloc 5 — Le temps, converti en argent

`réservations/an × durée réelle d'une rotation` — messages, remise des clés,
ménage, linge, incidents — exprimé en heures puis au taux horaire choisi par
le propriétaire.

Arithmétique pure, et souvent l'argument qui emporte celui qui a déjà essayé
de gérer seul.

### Bloc 6 — Les hypothèses, modifiables *(le bloc le plus important)*

Taux d'occupation, prix par nuit, frais de ménage, commission : rendus
ajustables, avec recalcul immédiat.

Deux effets, tous deux décisifs. Le propriétaire qui corrige une hypothèse
s'approprie le résultat — ce n'est plus votre chiffre, c'est le sien. Et
l'objection « vos estimations sont optimistes » disparaît, puisqu'il a validé
les siennes.

### Bloc 7 — Le mur

Le brut est libre. Le net, la saisonnalité et la comparaison longue durée
s'obtiennent contre les coordonnées.

Il donne son e-mail pour un contenu qu'il a **déjà vu commencer**, pas pour une
promesse. Le taux de conversion d'un mur placé après une démonstration partielle
est sans commune mesure avec celui d'un formulaire placé avant.

### Bloc 8 — Le document

PDF nominatif, aux couleurs de la conciergerie, reprenant les blocs 1 à 5.

C'est ce document qui déclenche le rendez-vous — la page ne fait que le
mériter. Et c'est enfin quelque chose que la conciergerie peut envoyer.

---

## 2. Note de méthode — visible, pas en gris clair

À afficher en bas de page, en toutes lettres :

> Estimation indicative construite à partir de moyennes de marché et des
> barèmes définis par votre conciergerie. Elle ne tient compte ni des charges
> de copropriété, ni de la fiscalité, ni des règles locales de location courte
> durée, et ne constitue pas un engagement.

Contre-intuitivement, cette note **augmente** la conversion : elle signale
quelqu'un qui n'essaie pas de vous avoir. C'est le même mécanisme que l'aveu de
phase de lancement sur le site d'agence.

---

## 3. Interdits

- **Aucun comparable inventé.** Pas de « 14 biens similaires à 500 m » tant
  qu'aucune donnée réelle ne les produit. C'est le chantier AirDNA, et il
  attend d'être payé (`docs/10`).
- **Aucun pourcentage de levier non mesuré.** « Photos professionnelles : +8 % »
  ne s'affiche que le jour où le parc de la conciergerie le démontre. En
  attendant, formuler les leviers qualitativement, par ordre d'impact.
- **Aucun montant unique.** Toujours une fourchette ou un scénario.
- **Aucune précision décorative.** `9 078 €` est plus crédible que `9 000 €`
  seulement si le calcul le produit vraiment ; sinon c'est de la fausse
  précision, et elle se retourne.

---

## 4. Structure des composants (Next.js App Router · React · TypeScript)

### Règle d'architecture

**Tout le calcul vit dans un module pur, aucun composant ne calcule.** Les blocs
sont présentationnels : ils reçoivent un résultat déjà construit et l'affichent.
C'est ce qui rend le moteur testable sans DOM, et ce qui permet de générer le
PDF côté serveur à partir du même code que la page.

Un seul composant client détient l'état — celui des hypothèses modifiables.
Tout ce qui est en dessous reste pur.

```
src/lib/estimate/
  engine.ts        // calcul des 3 scénarios, cascade nette, seuil de bascule
  seasonality.ts   // courbe mensuelle par zone
  benchmarks.ts    // barèmes de la conciergerie (Supabase) + valeurs de repli
  types.ts         // EstimateInput, EstimateResult, Assumptions, Scenario

src/components/estimate/
  EstimateResult.tsx        // 'use client' — détient les hypothèses, orchestre
  CalculationReveal.tsx     // bloc 0 — séquence d'hypothèses, 2 s
  ScenarioTriptych.tsx      // bloc 1 — prudent / réaliste / optimisé
  NetBreakdown.tsx          // bloc 2 — cascade des retenues
  RentalComparison.tsx      // bloc 3 — courte durée vs longue durée + seuil
  SeasonalityChart.tsx      // bloc 4 — douze barres, SVG inline
  TimeSaved.tsx             // bloc 5 — heures converties en euros
  AssumptionControls.tsx    // bloc 6 — sliders, remonte au parent
  LeadGate.tsx              // bloc 7 — mur, formulaire, POST /api/leads
  MethodNote.tsx            // note de méthode
```

### Signatures

```ts
// engine.ts — pur, aucune dépendance React
export function buildEstimate(
  input: EstimateInput,
  assumptions: Assumptions,
): EstimateResult;
// EstimateResult contient : scenarios[3], net{lines[], total},
// comparison{shortTerm, longTerm, breakEvenOccupancy},
// seasonality[12], timeSaved{hours, value}

// EstimateResult.tsx — le seul composant avec état
const [assumptions, setAssumptions] = useState(defaultAssumptions);
const result = useMemo(() => buildEstimate(input, assumptions), [input, assumptions]);
const [unlocked, setUnlocked] = useState(false);
```

Les blocs 2, 3 et 4 sont rendus floutés et non sélectionnables tant que
`unlocked` est faux — visibles mais illisibles. Montrer qu'il y a quelque chose
derrière le mur convertit mieux que masquer entièrement.

### Ce qu'il ne faut pas faire

- Pas de librairie de graphiques pour douze barres : un SVG inline suffit et
  évite ~50 ko de JavaScript sur mobile.
- Pas de recalcul serveur à chaque mouvement de curseur : le moteur est
  synchrone et pur, le recalcul est instantané côté client.
- Le PDF (bloc 8) se génère côté serveur en important le **même** `engine.ts`.
  Deux implémentations du calcul finiraient par diverger, et c'est le document
  signé qui ferait foi.

---

## 5. Ordre de construction

1. **Bloc 2 (net réel)** — plus gros écart concurrentiel, arithmétique pure.
2. **Bloc 6 (hypothèses modifiables)** — supprime l'objection principale.
3. **Bloc 3 (comparaison longue durée)** — la diapositive qui décide.
4. **Bloc 7 (mur)** — monétise ce qui précède.
5. **Bloc 8 (document)** — arme la conciergerie pour la relance.
6. **Blocs 0, 4, 5** — densité perçue, une fois le fond en place.
