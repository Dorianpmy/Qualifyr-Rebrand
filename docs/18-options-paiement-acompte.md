# 18 — Options de paiement de l'acompte : PayPal et virement manuel (12 septembre 2026)

À la demande de Dorian : aujourd'hui, un seul prestataire existe pour encaisser l'acompte
d'une réservation cliente — Stripe Connect Express (`src/lib/detailing/stripe.ts`). Ce
document spécifie l'ajout de deux options supplémentaires, **avant tout code** :

1. **PayPal**, comme second prestataire d'encaissement en ligne.
2. **Virement manuel**, un mode explicitement choisi par le professionnel — pas le repli
   automatique actuel quand Stripe n'est pas configuré.

Il ne remplace rien : Stripe reste l'option par défaut et la seule pleinement automatisée
de bout en bout (webhook → confirmation instantanée).

---

## 0. Arbitrages à valider avec Dorian avant d'implémenter

> Ces quatre points sont des décisions produit, pas des détails techniques. Je propose une
> réponse par défaut, mais elles engagent le fonctionnement réel du service — à confirmer
> avant d'écrire une ligne de code.

**0.1 — PayPal exige une candidature partenaire, pas une simple clé API.**
Contrairement à Stripe Connect (self-service, un compte suffit), le split de paiement
PayPal (« PayPal Complete Payments Platform for Marketplaces », API Partner Referrals)
n'est accessible qu'aux partenaires approuvés par PayPal — un dossier à déposer, avec un
délai d'instruction qui n'est pas sous notre contrôle (Source :
[developer.paypal.com/docs/multiparty](https://developer.paypal.com/docs/multiparty/)).
**Proposition** : déposer la candidature partenaire dès validation de ce document, en
parallèle du développement des autres briques (virement manuel, refonte de l'écran), pour
ne pas bloquer tout le chantier sur ce délai.

**0.2 — PayPal ne propose pas nativement de « frais plateforme à zéro » comme réglage
affiché.** Le mécanisme de split (`platform_fee`) est conçu pour que la plateforme prenne
une commission ; on peut le régler à 0, mais ce n'est pas le cas d'usage que PayPal met en
avant, et un dossier partenaire qui déclare 0 % de commission partout devra probablement
le justifier lors de l'instruction. **Proposition** : documenter dans le dossier de
candidature que Qualifyr facture par abonnement, pas par commission — cohérent avec ce qui
est déjà fait avec Stripe (`createDepositCheckout`, aucun `application_fee_amount`).

**0.3 — Le virement manuel casse l'invariant « le webhook fait foi ».**
`docs/13-saas-nettoyage-automobile.md` §2.5 pose que la confirmation de réservation vient
toujours d'un webhook de paiement, jamais d'une déclaration du navigateur ni du
professionnel. Un virement bancaire n'a pas d'équivalent — personne n'appelle Qualifyr
quand l'argent arrive sur le compte du professionnel. **Proposition** : en mode virement
manuel, c'est le **professionnel** qui confirme la réception dans son dashboard (bouton
« Acompte reçu »), avec un avertissement explicite au client au moment de la réservation :
« Cette réservation n'est confirmée qu'après réception de votre virement par le
professionnel — pas de confirmation automatique. » Aucune promesse de délai n'est faite
(rejoint l'interdit CLAUDE.md sur les fausses promesses).

**0.4 — Le mode virement manuel prive le professionnel de la garantie anti-désistement.**
L'intérêt même de l'acompte encaissé en ligne, documenté dans `docs/13` §0.1, est de
limiter les annulations de dernière minute et les no-show. Un virement manuel n'offre
aucune de ces garanties (le client peut annoncer un virement qu'il n'envoie jamais).
**Proposition** : l'écran d'activation (`PaymentSetup.tsx`) doit dire cela clairement au
moment où le professionnel choisit ce mode — pas seulement le documenter ici. Formulation
à valider avec Dorian, sans superlatif ni dramatisation (charte éditoriale), par exemple :
« Vous choisissez vous-même l'acompte reçu. Qualifyr ne peut pas garantir qu'il a
réellement été envoyé. »

---

## 1. Modèle de données

Aucun typage central n'existe aujourd'hui (pas de `database.types.ts` généré) : les
requêtes Supabase utilisent des `.select('col1, col2')` en chaîne libre. Les nouvelles
colonnes s'ajoutent en migration SQL, dans le même style que les migrations existantes
(`supabase/migrations/009_payments_and_completion.sql`, `012_detailer_iban.sql`).

### 1.1 Table `detailers`

```sql
-- Nouvelle migration : 0XX_payment_mode_paypal_manual.sql

-- Mode d'encaissement choisi par le professionnel. 'stripe' reste la valeur
-- par défaut pour ne rien changer aux comptes déjà configurés.
alter table public.detailers
  add column if not exists payment_mode text
    not null default 'stripe'
    check (payment_mode in ('stripe', 'paypal', 'manuel'));

-- PayPal : identifiant du compte marchand PayPal du professionnel une fois
-- l'onboarding partenaire terminé (équivalent de stripe_account_id).
alter table public.detailers
  add column if not exists paypal_merchant_id text,
  add column if not exists paypal_payments_receivable boolean not null default false,
  add column if not exists paypal_onboarded_at timestamptz;

-- Virement manuel : coordonnées affichées au client (IBAN déjà présent
-- via `012_detailer_iban.sql`, réutilisé tel quel — pas de duplication).
-- Rien à ajouter ici : `iban` existe déjà sur `detailers`.
```

`payment_mode` est la source de vérité unique consultée par `checkout/route.ts` — elle
remplace la déduction implicite actuelle (`stripe_account_id` renseigné ou non). Un
professionnel en mode `stripe` mais dont `stripe_charges_enabled = false` reste dans l'état
« dossier à terminer » déjà géré ; un professionnel en mode `paypal` suit la même logique
avec `paypal_payments_receivable` ; un professionnel en mode `manuel` n'a besoin d'aucune
des deux.

### 1.2 Table `detailer_bookings`

```sql
alter table public.detailer_bookings
  add column if not exists paypal_order_id text,
  add column if not exists deposit_confirmed_by text
    check (deposit_confirmed_by in ('webhook_stripe', 'webhook_paypal', 'manuel')),
  add column if not exists deposit_confirmed_by_user_id uuid references auth.users(id);
```

`deposit_confirmed_by` distingue une confirmation automatique (webhook) d'une confirmation
manuelle (professionnel) — utile pour un futur litige client et pour l'audit interne, sans
rien promettre au client sur la fiabilité de l'une ou l'autre.

---

## 2. Dashboard professionnel — refonte de `PaymentSetup.tsx`

Le composant actuel (`src/components/app/PaymentSetup.tsx`) porte un choix binaire caché :
« Stripe est configuré ou non », avec un seul bouton « Activer les paiements ». Le
commentaire en tête du fichier précise un choix de conception à respecter : *« le detailer
n'achète pas une intégration Stripe, il achète le fait d'être payé »* — ce principe reste
valable, mais il n'est plus tenable de masquer complètement le prestataire dès qu'il y en a
plusieurs : le professionnel doit choisir lequel utiliser.

**Proposition d'écran** :

1. Un sélecteur à trois options en tête du module, présentées par leur usage plutôt que
   par leur nom technique :
   - « Paiement en ligne automatique — carte bancaire » (Stripe)
   - « Paiement en ligne automatique — PayPal »
   - « Virement bancaire, confirmé par vous » (manuel)
2. Selon le choix, le module affiche le flux correspondant :
   - **Stripe / PayPal** : bouton d'activation → redirection vers le formulaire hébergé du
     prestataire (comme aujourd'hui pour Stripe) → badge Actif / Dossier à terminer / Non
     activé.
   - **Manuel** : pas de redirection externe. Affiche l'IBAN déjà enregistré
     (`detailers.iban`, réutilisé depuis la QR-facture suisse) ou invite à le renseigner
     s'il est absent. Affiche l'avertissement du point 0.4 ci-dessus, non masquable par un
     simple clic (case à cocher de confirmation, comme le consentement Hermès dans
     `HermesSettings.tsx`).
3. Changer de mode après coup est autorisé à tout moment (un professionnel qui a des
   soucis avec un prestataire doit pouvoir basculer), mais n'affecte que les nouvelles
   réservations — jamais celles déjà engagées dans un mode donné.

---

## 3. Décision du prestataire côté client final

`src/lib/detailing/booking-public.ts` (`getPublicBookingSummary`) calcule aujourd'hui
`paymentAvailable: Boolean(detailer.stripe_charges_enabled)`. Il doit désormais renvoyer le
mode effectif :

```ts
type PaymentAvailability =
  | { readonly mode: 'stripe'; readonly available: boolean }
  | { readonly mode: 'paypal'; readonly available: boolean }
  | { readonly mode: 'manuel'; readonly iban: string | null };
```

`src/app/reservation/[slug]/confirmation/page.tsx` branche sur ce type plutôt que sur un
booléen unique :

- `stripe` / `paypal` avec `available: true` → bouton de paiement correspondant
  (`PayDepositButton` existant, ou son équivalent PayPal).
- `stripe` / `paypal` avec `available: false` → message actuel inchangé (« n'a pas encore
  activé le paiement en ligne… »).
- `manuel` → affiche l'IBAN et le montant exact à virer, avec la mention « réservation
  confirmée seulement à réception » (point 0.3). Pas de bouton de paiement.

---

## 4. Encaissement PayPal

Nouveau fichier `src/lib/detailing/paypal.ts`, miroir de `stripe.ts` (même contrainte du
dépôt : pas de SDK, appels REST directs, cohérence avec le style existant) :

- `createPartnerReferral({ email, country, businessName })` → initie l'onboarding
  (Partner Referrals API v2), renvoie une URL d'inscription hébergée par PayPal — même
  principe que `createOnboardingLink` de Stripe.
- `getMerchantStatus(merchantId)` → vérifie `payments_receivable` et
  `primary_email_confirmed`, équivalent de `retrieveAccount`.
- `createDepositOrder({ merchantId, bookingId, amount, currency, ... })` → crée une
  commande PayPal (`Orders API`) avec `payee.merchant_id` pointant vers le compte du
  professionnel — le split se fait au niveau de PayPal, l'argent ne transite jamais par un
  compte Qualifyr, comme pour Stripe. `platform_fee` réglé à 0 conformément au point 0.2.
- `verifyWebhookSignature(...)` → vérification de signature des webhooks PayPal
  (mécanisme différent de Stripe : validation via l'API `/v1/notifications/verify-webhook-signature`
  plutôt qu'un HMAC local — à documenter dans le code au moment de l'écrire, car c'est une
  vraie différence d'implémentation, pas un simple renommage).

Nouveau webhook `src/app/api/detailing/paypal-webhook/route.ts`, miroir de
`stripe-webhook/route.ts` : écoute `CHECKOUT.ORDER.APPROVED` / `PAYMENT.CAPTURE.COMPLETED`,
vérifie la signature avant toute lecture, confirme la réservation de façon idempotente
(même garde `where status = 'en_attente_paiement'`).

---

## 5. Encaissement manuel

Pas de nouveau prestataire externe. Le flux :

1. Le client voit l'IBAN et le montant exact sur l'écran de confirmation, effectue son
   virement en dehors de Qualifyr.
2. Le professionnel reçoit une notification (déjà existante — nouvelle réservation) et,
   une fois le virement constaté sur son propre compte bancaire, clique « Acompte reçu »
   dans son dashboard (nouvelle route `PATCH /api/app/bookings/[id]/deposit-confirm`,
   protégée par la même vérification de propriété que les autres routes du dashboard —
   `owner-isolation`, déjà testé par `tests/owner-isolation.test.ts`, à étendre).
3. Cette action fait passer la réservation au même statut que la confirmation webhook,
   avec `deposit_confirmed_by = 'manuel'` et l'identifiant du professionnel qui a cliqué.

Aucune relance automatique de paiement n'est prévue pour ce mode (elle suppose un lien de
paiement, qui n'a pas de sens pour un virement) — `hermes-outreach`/relances de devis
existantes ne sont pas concernées.

---

## 6. Ce qui ne change pas

- Le plafond de l'acompte à 30 % du montant de la prestation (`docs/13` §0.1) s'applique
  identiquement aux trois modes — c'est une règle métier, pas une contrainte technique de
  Stripe.
- L'avertissement juridique sur l'acompte non remboursable en vente à distance reste
  affiché quel que soit le mode choisi.
- Le hold de créneau de 15 minutes pendant le paiement (`docs/13` §2.5) s'applique à
  Stripe et PayPal ; il n'a pas de sens en mode manuel (pas de tunnel de paiement à
  attendre) — le créneau est simplement réservé dès la création de la demande, comme le
  fait déjà le repli actuel.
- Aucune commission Qualifyr sur l'acompte, quel que soit le prestataire (point 0.2).

---

## 7. Ordre de construction proposé

1. Migration SQL (`payment_mode`, colonnes PayPal, colonnes de traçabilité sur
   `detailer_bookings`) — sans rien changer au comportement (`payment_mode` par défaut à
   `'stripe'`, tous les comptes existants continuent exactement comme aujourd'hui).
2. Mode manuel d'abord (aucune dépendance externe, aucun délai d'instruction) : refonte de
   `PaymentSetup.tsx` avec le sélecteur, route de confirmation manuelle, écran de
   confirmation client.
3. Dépôt de la candidature partenaire PayPal (point 0.1) — en parallèle, puisque le délai
   ne dépend pas de nous.
4. `paypal.ts`, route d'onboarding, webhook, une fois la candidature approuvée.
5. `npm run lint && npm run typecheck && npm run test && npm run build` avant toute mise en
   ligne, comme pour chaque phase.

Ce document sert de référence : toute décision de structure prise pendant l'implémentation
qui s'écarterait de ce qui précède doit d'abord être répercutée ici, conformément à la
règle du projet (« on met à jour le doc d'abord, puis on implémente »).
