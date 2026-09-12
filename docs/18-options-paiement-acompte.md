# 18 — Options de paiement de l'acompte : virement manuel et lien PayPal (12 septembre 2026)

À la demande de Dorian : aujourd'hui, un seul prestataire existe pour encaisser l'acompte
d'une réservation cliente — Stripe Connect Express (`src/lib/detailing/stripe.ts`). Ce
document spécifie l'ajout d'un second mode, **avant tout code** : l'**encaissement
manuel**, où le professionnel indique lui-même comment il souhaite être payé — un IBAN
(virement) ou son propre lien PayPal personnel — et confirme la réception à la main.

**Pas d'intégration PayPal API.** Une première version de ce document proposait une
intégration complète (PayPal Complete Payments Platform, Partner Referrals, webhooks) —
écartée à la demande de Dorian : elle exige une candidature partenaire soumise à
approbation PayPal, un délai hors de notre contrôle, pour un gain qu'un simple lien
personnel couvre déjà à l'usage. Un professionnel qui a un compte PayPal a aussi un lien
`paypal.me` ou une adresse e-mail associée — il suffit de le coller.

Ce mode ne remplace rien : Stripe reste l'option par défaut et la seule pleinement
automatisée de bout en bout (webhook → confirmation instantanée, sans action du
professionnel).

---

## 0. Arbitrages à valider avec Dorian avant d'implémenter

> Ces trois points sont des décisions produit, pas des détails techniques. Je propose une
> réponse par défaut, mais elles engagent le fonctionnement réel du service — à confirmer
> avant d'écrire une ligne de code.

**0.1 — Le mode manuel casse l'invariant « le webhook fait foi ».**
`docs/13-saas-nettoyage-automobile.md` §2.5 pose que la confirmation de réservation vient
toujours d'un webhook de paiement, jamais d'une déclaration du navigateur ni du
professionnel. Ni un virement bancaire ni un paiement par lien PayPal personnel n'ont
d'équivalent — personne n'appelle Qualifyr quand l'argent arrive chez le professionnel.
**Proposition** : c'est le **professionnel** qui confirme la réception dans son dashboard
(bouton « Acompte reçu »), avec un avertissement explicite au client au moment de la
réservation : « Cette réservation n'est confirmée qu'après réception du paiement par le
professionnel — pas de confirmation automatique. » Aucune promesse de délai n'est faite
(rejoint l'interdit CLAUDE.md sur les fausses promesses).

**0.2 — Le mode manuel prive le professionnel de la garantie anti-désistement.**
L'intérêt même de l'acompte encaissé en ligne, documenté dans `docs/13` §0.1, est de
limiter les annulations de dernière minute et les no-show. Ni le virement ni un paiement
par lien PayPal saisi librement n'offrent cette garantie : le client peut annoncer un
paiement qu'il n'envoie jamais, et Qualifyr n'a aucun moyen de vérifier que le lien collé
par le professionnel correspond à un compte PayPal réel et actif. **Proposition** :
l'écran d'activation (`PaymentSetup.tsx`) doit le dire clairement au moment où le
professionnel choisit ce mode — pas seulement le documenter ici. Formulation à valider
avec Dorian, sans superlatif ni dramatisation (charte éditoriale), par exemple : « Vous
choisissez vous-même quand l'acompte est marqué reçu. Qualifyr ne peut pas vérifier qu'il
a réellement été envoyé. »

**0.3 — Le lien PayPal saisi doit être validé a minima avant d'être montré au client.**
Le professionnel colle un lien dans son dashboard ; ce lien est ensuite affiché comme
cliquable à un client final qui n'a aucune raison de le remettre en question. Sans
contrôle, un champ libre qui devient un lien cliquable montré à un tiers est une ouverture
au hameçonnage (lien copié-collé par erreur, compte compromis, faute de frappe redirigeant
ailleurs). **Proposition** : n'accepter que des URL dont l'hôte est exactement
`paypal.com`, `www.paypal.com` ou `paypal.me` — rejet avec message clair sinon. Ce n'est
pas une vérification d'identité (impossible sans l'API partenaire écartée en 0), seulement
un filtre contre un lien qui ne serait manifestement pas PayPal.

---

## 1. Modèle de données

Aucun typage central n'existe aujourd'hui (pas de `database.types.ts` généré) : les
requêtes Supabase utilisent des `.select('col1, col2')` en chaîne libre. Les nouvelles
colonnes s'ajoutent en migration SQL, dans le même style que les migrations existantes
(`supabase/migrations/009_payments_and_completion.sql`, `012_detailer_iban.sql`).

### 1.1 Table `detailers`

```sql
-- Nouvelle migration : 0XX_payment_mode_manual.sql

-- Mode d'encaissement choisi par le professionnel. 'stripe' reste la valeur
-- par défaut pour ne rien changer aux comptes déjà configurés.
alter table public.detailers
  add column if not exists payment_mode text
    not null default 'stripe'
    check (payment_mode in ('stripe', 'manuel'));

-- Manuel : deux moyens possibles, choisis par le professionnel. L'IBAN existe
-- déjà (`012_detailer_iban.sql`, réutilisé pour la QR-facture) ; seul le lien
-- PayPal et le choix entre les deux sont nouveaux.
alter table public.detailers
  add column if not exists manual_method text
    check (manual_method in ('virement', 'paypal_lien')),
  add column if not exists paypal_link text;
```

`payment_mode` est la source de vérité unique consultée par `checkout/route.ts` — elle
remplace la déduction implicite actuelle (`stripe_account_id` renseigné ou non). Un
professionnel en mode `stripe` mais dont `stripe_charges_enabled = false` reste dans
l'état « dossier à terminer » déjà géré ; un professionnel en mode `manuel` n'a besoin
d'aucune configuration Stripe et choisit simplement `manual_method`.

### 1.2 Table `detailer_bookings`

```sql
alter table public.detailer_bookings
  add column if not exists deposit_confirmed_by text
    check (deposit_confirmed_by in ('webhook_stripe', 'manuel')),
  add column if not exists deposit_confirmed_by_user_id uuid references auth.users(id);
```

`deposit_confirmed_by` distingue une confirmation automatique (webhook Stripe) d'une
confirmation manuelle (professionnel) — utile pour un futur litige client et pour l'audit
interne, sans rien promettre au client sur la fiabilité de l'une ou l'autre.

---

## 2. Dashboard professionnel — refonte de `PaymentSetup.tsx`

Le composant actuel (`src/components/app/PaymentSetup.tsx`) porte un choix binaire caché :
« Stripe est configuré ou non », avec un seul bouton « Activer les paiements ». Le
commentaire en tête du fichier précise un choix de conception à respecter : *« le detailer
n'achète pas une intégration Stripe, il achète le fait d'être payé »* — ce principe reste
valable.

**Proposition d'écran** :

1. Un sélecteur à deux options en tête du module, présentées par leur usage plutôt que par
   leur nom technique :
   - « Paiement en ligne automatique — carte bancaire » (Stripe)
   - « Je gère la réception moi-même » (manuel)
2. Selon le choix, le module affiche le flux correspondant :
   - **Stripe** : bouton d'activation → redirection vers le formulaire hébergé Stripe
     (inchangé) → badge Actif / Dossier à terminer / Non activé.
   - **Manuel** : un second choix apparaît — « Virement bancaire » ou « Lien PayPal ».
     - Virement : affiche l'IBAN déjà enregistré (`detailers.iban`, réutilisé depuis la
       QR-facture suisse) ou invite à le renseigner s'il est absent.
     - Lien PayPal : un champ pour coller son lien `paypal.me` (ou adresse
       `paypal.com`/`www.paypal.com`), validé côté serveur selon 0.3 avant enregistrement.
     - Dans les deux cas, affiche l'avertissement du point 0.2, non masquable par un
       simple clic (case à cocher de confirmation, comme le consentement Hermès dans
       `HermesSettings.tsx`).
3. Changer de mode après coup est autorisé à tout moment, mais n'affecte que les nouvelles
   réservations — jamais celles déjà engagées dans un mode donné.

---

## 3. Décision du prestataire côté client final

`src/lib/detailing/booking-public.ts` (`getPublicBookingSummary`) calcule aujourd'hui
`paymentAvailable: Boolean(detailer.stripe_charges_enabled)`. Il doit désormais renvoyer le
mode effectif :

```ts
type PaymentAvailability =
  | { readonly mode: 'stripe'; readonly available: boolean }
  | { readonly mode: 'manuel'; readonly method: 'virement'; readonly iban: string | null }
  | { readonly mode: 'manuel'; readonly method: 'paypal_lien'; readonly link: string | null };
```

`src/app/reservation/[slug]/confirmation/page.tsx` branche sur ce type plutôt que sur un
booléen unique :

- `stripe` avec `available: true` → bouton de paiement existant (`PayDepositButton`).
- `stripe` avec `available: false` → message actuel inchangé (« n'a pas encore activé le
  paiement en ligne… »).
- `manuel` / `virement` → affiche l'IBAN et le montant exact à virer.
- `manuel` / `paypal_lien` → affiche le lien PayPal du professionnel (rendu cliquable
  uniquement si l'hôte a été validé en base selon 0.3, jamais depuis une valeur non
  vérifiée) et le montant exact.
- Dans les deux cas manuels : mention « réservation confirmée seulement à réception »
  (point 0.1). Pas de bouton de paiement Qualifyr.

---

## 4. Encaissement manuel

Pas de nouveau prestataire externe, aucun webhook, aucune clé API. Le flux :

1. Le client voit l'IBAN ou le lien PayPal et le montant exact sur l'écran de
   confirmation, effectue son paiement en dehors de Qualifyr.
2. Le professionnel reçoit une notification (déjà existante — nouvelle réservation) et,
   une fois le paiement constaté sur son propre compte, clique « Acompte reçu » dans son
   dashboard (nouvelle route `PATCH /api/app/bookings/[id]/deposit-confirm`, protégée par
   la même vérification de propriété que les autres routes du dashboard —
   `owner-isolation`, déjà testé par `tests/owner-isolation.test.ts`, à étendre).
3. Cette action fait passer la réservation au même statut que la confirmation webhook
   Stripe, avec `deposit_confirmed_by = 'manuel'` et l'identifiant du professionnel qui a
   cliqué.

Aucune relance automatique de paiement n'est prévue pour ce mode (elle suppose un lien de
paiement propre à Qualifyr, qui n'existe pas ici) — les relances de devis existantes ne
sont pas concernées.

---

## 5. Ce qui ne change pas

- Le plafond de l'acompte à 30 % du montant de la prestation (`docs/13` §0.1) s'applique
  identiquement aux deux modes — c'est une règle métier, pas une contrainte technique de
  Stripe.
- L'avertissement juridique sur l'acompte non remboursable en vente à distance reste
  affiché quel que soit le mode choisi.
- Le hold de créneau de 15 minutes pendant le paiement (`docs/13` §2.5) s'applique à
  Stripe ; il n'a pas de sens en mode manuel (pas de tunnel de paiement à attendre) — le
  créneau est simplement réservé dès la création de la demande, comme le fait déjà le
  repli actuel.
- Aucune commission Qualifyr sur l'acompte, quel que soit le mode.

---

## 6. Ordre de construction proposé

1. Migration SQL (`payment_mode`, `manual_method`, `paypal_link`, colonnes de traçabilité
   sur `detailer_bookings`) — sans rien changer au comportement (`payment_mode` par défaut
   à `'stripe'`, tous les comptes existants continuent exactement comme aujourd'hui).
2. Refonte de `PaymentSetup.tsx` avec le sélecteur à deux niveaux (Stripe / manuel, puis
   virement / lien PayPal).
3. Validation serveur du lien PayPal (0.3), route de confirmation manuelle, écran de
   confirmation client mis à jour.
4. `npm run lint && npm run typecheck && npm run test && npm run build` avant toute mise en
   ligne, comme pour chaque phase.

Ce document sert de référence : toute décision de structure prise pendant l'implémentation
qui s'écarterait de ce qui précède doit d'abord être répercutée ici, conformément à la
règle du projet (« on met à jour le doc d'abord, puis on implémente »).
