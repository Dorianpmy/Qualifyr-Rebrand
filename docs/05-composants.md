# 05 — Composants

## `DarkFooter` — halo d'ambiance en option (20 septembre 2026, troisième retour)

Dorian compare une capture de `FinalCtaSection` (halo chaud diffus derrière la carte « Agent
Qualifyr ») à une capture du pied de page juste en dessous (fond plat) et demande de reprendre
ce fond coloré dans le second : la coupure entre les deux se voyait trop nettement.

`DarkFooter` accepte désormais une prop `glow?: boolean` (défaut `false`) qui pose un
`AmbientGlow` (`position="top"`, `intensity="soft"`) derrière la relance — le même mécanisme que
`Section`, réservé à deux ou trois halos par page (voir `docs/03-direction-artistique.md` §1.7,
mis à jour). `DarkFooter` étant posé sur sept pages, l'activer par défaut aurait dépassé ce budget
sur les six qui ferment déjà avec leur propre halo (`DarkHero` + `CtaSection`/`DarkVerticalPage`,
`glow="bottom"`) : seul `src/app/page.tsx` passe `glow` — c'est la seule page où `FinalCtaSection`
tient déjà le rôle de sortie juste au-dessus, donc le halo du pied de page le prolonge au lieu
d'ouvrir un troisième point de couleur. Le `<footer>` reçoit `relative isolate overflow-hidden`,
nécessaires à `AmbientGlow`, que la prop soit activée ou non.

---

## `DarkFooter` — capture de bureau plutôt que de téléphone (20 septembre 2026, second retour)

Dorian rejette la première version du visuel produit (capture de téléphone en portrait,
encadrée) livrée plus tôt le même jour : « je déteste ce bloc, enlève ce screen iPhone ». Un
portrait de téléphone posé dans une page pensée pour du bureau ne lit pas comme un fragment de
la page, mais comme un objet rapporté — l'inverse de l'effet recherché.

Il fournit une nouvelle capture, de bureau cette fois : sidebar complète, quatre compteurs,
calendrier. Même traitement d'anonymisation que la première (voir
`docs/03-direction-artistique.md` §12.1, mis à jour) : nom et ville de l'entreprise retirés de
la sidebar, ligne d'URL du compte retirée du contenu — sans toucher aux boutons voisins ni au
titre, contrairement au premier recadrage qui avait supprimé le bloc entier. Le cadre passe d'un
ratio portrait (`900/1330`, `max-w-20rem`) à un ratio paysage (`1400/847`, pleine largeur de sa
colonne) et la grille de la relance s'ajuste (`0.8fr / 1.05fr` plutôt que `1.1fr / 1fr`) pour
laisser plus de place à une image qui n'est plus verticale. L'ancien fichier
(`espace-pro-demandes.webp`) est supprimé ; plus aucune référence n'y pointe.

---

## `MessageBubble` — récidive du carré noir Safari iOS, ombre retirée (20 septembre 2026)

Dorian revoit exactement le bug déjà signalé le 18/09 (carré noir plein derrière chaque groupe
de bulles du hero), sur une nouvelle capture, malgré le correctif du 18/09 qui remplaçait le
`box-shadow` par un `filter: drop-shadow(...)` supposé équivalent. Le correctif n'a pas tenu sur
l'appareil réel de Dorian : `filter`, comme `box-shadow`, force la promotion de l'élément sur son
propre calque, et c'est cette promotion combinée au `transform` que `.bubble-impact` anime qui
déclenche le rendu en rectangle opaque sur WebKit — pas la propriété CSS précise utilisée pour
l'ombre.

Sans accès à un Safari iOS réel dans ce projet (seul Chromium est disponible ici), retenter une
troisième variante CSS reviendrait à deviner. L'ombre est retirée entièrement de
`MessageBubble.tsx` : bulles bleues pleines, sans ombre. Plus de calque forcé par un effet de
peinture, plus de rectangle possible. Cette ombre était de toute façon teintée de bleu
(`rgba(22, 131, 248, …)`), ce que `docs/03-direction-artistique.md` (ombres colorées interdites)
n'autorisait pas — sa suppression aligne le composant sur la charte plutôt que de créer une
exception jamais documentée.

---

## `DarkFooter` — visuel produit dans la relance de fin de page (20 septembre 2026)

Demande de Dorian : donner un visage à la relance charbon du pied de page, jusque-là un simple
titre centré suivi d'un bouton. Il fournit une capture réelle de l'espace pro (page Demandes,
KPI et calendrier) et demande qu'elle apparaisse « comme sur la photo de référence » — une
composition éditoriale avec texte à gauche, capture encadrée à droite, dans le style déjà arrêté
pour ce bloc le même jour : **sans ombre portée ni reflet**, à l'inverse du mockup flottant que
`docs/03-direction-artistique.md` §12 écarte explicitement. Voir §12.1 du même document pour la
justification de l'exception et le détail du recadrage (statut iPhone et identifiant du compte
client retirés avant intégration — aucune donnée du compte SW Carcleaning n'est exposée).

La relance passe d'une colonne centrée à deux colonnes sur grand écran (`lg:grid-cols-[1.1fr_1fr]`) :
titre, phrase de contexte et bouton d'un côté ; `next/image` de la capture de l'autre, dans un
cadre à arêtes franches (`border-hairline`, pas de rayon — cohérent avec le reste du système,
qui réserve l'arrondi à l'exception). Sur mobile, la capture passe sous le texte, largeur pleine,
hauteur plafonnée pour ne pas dominer l'écran. Aucun chiffre affiché n'est modifié : les
compteurs à zéro sont ceux du compte réel au moment de la capture.

---

## Icônes monochromes et police Quicksand pour l'espace pro (20 septembre 2026)

Retour de Dorian avec une référence plus sobre : remplacer les emoji colorés (ajoutés plus tôt
le même jour) par des icônes minimalistes sans couleur, et adopter une police plus ronde et plus
fine pour tout le tableau de bord.

**Icônes.** Retour à un jeu SVG linéaire monochrome — proche de celui d'avant l'expérience
emoji, trait affiné (1.7 → 1.5 px) — sur les deux barres, mobile et bureau. `Démarchage`
(Hermès) reçoit enfin sa propre icône (avion en papier) plutôt que de reprendre celle de
`Prospect` (loupe), les deux se distinguant mal l'une de l'autre. `Déconnexion` et « Page
client » n'étaient pas concernés par l'exception emoji et ne le sont pas plus par ce retour.
`docs/03-direction-artistique.md` §7.1 réécrit pour documenter l'état final plutôt que
d'empiler une troisième version de l'historique du jour.

**Police.** Quicksand (300 à 700), chargée via `next/font/google` dans `app/app/layout.tsx`,
scopée à `/app` par une variable CSS (`--font-dashboard`) posée sur un conteneur enveloppant —
le site vitrine garde Cormorant Garamond / Manrope, aucune fuite. Le sélecteur qui applique la
police (`.shell, .shell *`) a été étendu à `.loginShell, .loginShell *` : l'écran de connexion
vit dans le même dossier `/app` mais hors de `.shell` (pas encore de session), et sans cet ajout
la police aurait changé entre la connexion et le tableau de bord juste après. Documenté dans
`docs/03-direction-artistique.md` §2.4.

**Build non vérifiable ici.** `next build` télécharge les polices Google Fonts à la
construction ; ce bac à sable n'a pas d'accès réseau (déjà noté pour Inter/Manrope). Confirmé
en le lançant : les trois polices (Inter, Manrope, Quicksand) échouent au fetch, pour la même
raison. `lint`, `typecheck` et les tests passent, mais le build doit être vérifié une fois
poussé, là où Netlify a un accès réseau réel.

---

## Cases de statistiques épurées sur bureau (20 septembre 2026)

Retour de Dorian : « les carreaux sont vachement gros ». Sur bureau, la grille à quatre
colonnes (`.kpis`) s'étirait sur toute la largeur de `.main` (jusqu'à 1120 px) alors que
chaque case ne contient qu'un nombre et deux courtes lignes de texte — le problème était la
largeur de la grille, pas seulement son remplissage intérieur (déjà réduit une première fois
le 12/09/2026).

Un `max-width: 640px` sur `.kpis` à partir de 900 px fait redevenir les quatre cases des
pastilles à la taille de leur contenu plutôt que des blocs étirés ; la grille à deux colonnes
du téléphone n'est pas concernée, l'espace y est déjà compté. Rayon réduit de 14 à 10 px et
`padding` resserré (`0.75rem 0.85rem` → `0.65rem 0.75rem`) pour aller avec. Ces cases sont
partagées par toutes les pages à cases (Démarchage, accueil…) : l'effet se voit partout.

---

## L'emoji devient l'icône des deux barres de navigation (20 septembre 2026)

Retour de Dorian sur la barre d'onglets mobile : « trop terne, pas assez de personnalité »,
dans le même esprit que la demande d'emoji sur le menu de bureau plus tôt le même jour.

Le menu de bureau avait réservé l'emoji au-delà de 900 px, en ajout au pictogramme linéaire,
par crainte qu'un caractère de plus par libellé fasse déborder la barre mobile — calée au pixel
sur cinq colonnes égales, débordement déjà corrigé le 22/08/2026 (`AppShell.tsx`). Cette crainte
supposait que l'emoji s'ajoute *à côté* du texte ; en le faisant remplacer l'icône plutôt que
s'y ajouter, il occupe la même case qu'elle (au-dessus du libellé sur la barre mobile, comme le
pictogramme avant lui) et n'ajoute donc aucune largeur.

Le jeu d'icônes SVG linéaires de `AppShell.tsx` (`icons`, huit tracés) est retiré : l'emoji est
maintenant l'icône des deux barres. `Déconnexion` et le bouton central « Page client » gardent
leur pictogramme et leur symbole de marque, inchangés — ils ne sont pas rendus par `renderTab`.
`docs/03-direction-artistique.md` §7.1 mis à jour pour refléter l'exception élargie.

---

## Aperçu du mois sur la page Demandes — palette ajustée (20 septembre 2026)

Retour de Dorian après déploiement : les trois couleurs d'origine (pêche, terracotta, laiton —
reprises du contour tricolore existant) se distinguaient mal une fois réduites à une puce pleine
de 5 px, alors que le même trio fonctionnait comme dégradé large sur les autres écrans. Un
dégradé n'a pas besoin que chaque teinte se reconnaisse isolément ; une puce, si.

Palette dédiée du calendrier, définie directement dans `.calDotInterieur`/`.calDotExterieur`/
`.calDotComplet` (`app.module.css`) : `#8b4a2e` (rouille sombre), `#c9843d` (ambre moyen),
`#e0bc6e` (or clair). Toujours chaudes (13°–43°, comme l'exige `docs/03-direction-artistique.md`
§1), mais étagées nettement en clarté plutôt que juxtaposées à luminosité proche — un repère qui
tient même sans distinguer finement les teintes. Puces agrandies de 5 à 7 px au passage.

---

## Aperçu du mois sur la page Demandes (20 septembre 2026)

Demande de Dorian : un calendrier sur la page Demandes, avec une couleur par prestation pour
les rendez-vous. Deux précisions obtenues avant implémentation : un **mini-calendrier du mois**
(aperçu, pas la vue Planning complète), et **une couleur par prestation** — pas par statut de
réservation, déjà couvert par les badges de la liste.

**Palette.** `scope` (`interieur` / `exterieur` / `complet`) est une énumération fixe à trois
valeurs (`types.ts`), pas un catalogue libre par professionnel — pas besoin d'assignation
dynamique. Les trois couleurs reprennent le contour « tricolore » déjà utilisé ailleurs dans ce
dashboard (onglet actif, carte d'activation du paiement, écran de connexion) : pêche
(`--accent-1`), terracotta (`#c9835c`), laiton (`#c7a06b`) — trois teintes chaudes, aucune
identité supplémentaire ajoutée pour ce seul composant.

**Accessibilité.** La couleur des puces n'est jamais la seule information : chaque case porte un
`title` (infobulle) et un texte `visually-hidden` décrivant le jour, le nombre de réservations et
les prestations concernées (`calendarDayDescription`), et une légende visible sous le calendrier
associe chaque couleur à son libellé.

**Réservations exclues.** Une réservation `annule` ou `expire` ne représente plus une
intervention ce jour-là — elle n'apparaît ni dans les puces ni dans le décompte, cohérent avec
`listBookingsForDay` (tournée du jour, Planning) qui applique la même logique côté statut
`confirme`.

**Réorganisation technique.** `scopeLabel`, `slotStart` et toute la nouvelle logique de
calendrier (`monthlyCalendar`, `calendarDayDescription`, `SCOPE_DISPLAY_ORDER`) ont été extraits
de `dashboard.ts` vers un nouveau fichier `src/lib/detailing/calendar.ts`, sans dépendance à
Supabase ni à React — même principe que `availability.ts` et `quote.ts`. `dashboard.ts` porte
`import 'server-only'` (accès base), ce qui interdit d'importer quoi que ce soit du fichier
depuis un test ; la nouvelle logique, purement calculatoire, devait donc vivre ailleurs pour être
testée (`tests/monthly-calendar.test.ts`, 12 cas). `dashboard.ts` réexporte `scopeLabel` pour ne
rien changer aux imports déjà en place ailleurs dans le produit.

---

## Emoji dans le menu de bureau de l'espace pro — ajustement (20 septembre 2026)

Suite immédiate de l'entrée ci-dessous : la première version affichait le pictogramme
linéaire **et** l'emoji côte à côte sur chaque ligne du menu de bureau — deux icônes pour
la même entrée, qui faisaient double emploi (retour de Dorian après déploiement). L'emoji
remplace maintenant le pictogramme sur ce menu (`.navIconMobileOnly` masque l'icône SVG à
partir de 900 px, `.navEmoji` prend `order: -1` pour se placer là où elle était). La barre
d'onglets mobile n'est pas concernée : elle n'affichait déjà pas l'emoji, et garde son
icône linéaire seule.

---

## Emoji dans le menu de bureau de l'espace pro (20 septembre 2026)

Demande de Dorian, après comparaison avec le menu d'un produit concurrent : ajouter du « peps »
au tableau de bord (`AppShell.tsx`). L'iconographie du produit interdit l'emoji sans exception
(`docs/03-direction-artistique.md` §7) — l'ajout a donc commencé par une exception documentée
avant le code (§7.1), scopée précisément pour ne pas déborder sur le reste du produit :

- Elle ne touche que le **menu vertical de bureau** de l'espace pro (`/app`, ≥ 900 px). Le site
  vitrine garde l'interdiction intacte.
- Un emoji décoratif s'ajoute à côté du pictogramme linéaire existant sur huit entrées
  (Demandes 📋, Planning 📅, Prospect 🔍, Prestations 💶, Démarchage 📣, Avant/Après 📸,
  Factures 🧾, Abonnement 💳) — il ne le remplace pas. `Déconnexion` et le bouton « Page client »
  n'en reçoivent pas : le premier est une action neutre, le second porte déjà le symbole de
  marque.
- Masqué sur la barre d'onglets mobile (`.navEmoji`, `display:none` sous 900 px) : cette barre
  est calée au pixel sur cinq colonnes égales, et un caractère de plus par libellé y recréerait
  le débordement corrigé le 22/08/2026 (« Prestatio… »).
- `aria-hidden="true"` sur l'emoji : le nom accessible du lien reste porté par le seul libellé
  texte, un lecteur d'écran n'énonce pas le symbole.

**Ce qui n'a pas été fait, volontairement.** Le produit de référence affichait aussi un compteur
de série (« 11 semaines d'affilée ») et des badges « bientôt disponible ». Les deux auraient
nécessité soit une donnée réelle qui n'existe pas encore (un suivi d'activité pour calculer une
série), soit un chiffre ou un badge inventés pour l'occasion — exactement le faux contenu que
`CLAUDE.md` interdit. Ni l'un ni l'autre n'a été ajouté ; un vrai indicateur de série reste
possible plus tard, comme fonctionnalité à part entière avec son propre calcul.

---

## WhatsApp — token confirmé valide (20 septembre 2026)

Les modèles Meta (`nouvelle_reservation`, `vehicule_pret`, `demande_avis`) sont approuvés
(« Actif – Qualifié »). `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` étaient déjà présentes dans
Netlify depuis le 17/09, sans certitude qu'il s'agissait du token permanent d'un utilisateur
système plutôt que de l'ancien token de test de 24h (qui aurait expiré). Vérifié via une route
de diagnostic temporaire (`api/debug-whatsapp-env`, supprimée une fois la confirmation obtenue) :
lecture des métadonnées du numéro (`GET /{phone-number-id}`), sans envoi de message ni exposition
du token. Réponse `200`, `verified_name: "Qualifyr"` — le token en place fonctionne, rien à
reconfigurer.

Reste à confirmer : un envoi réel (nouvelle réservation chez un detailer dont le champ
« Numéro WhatsApp affiché aux clients » est renseigné) pour vérifier que le message arrive
effectivement, au-delà de la seule validité du token.

---

## Manifest PWA dédié à l'espace pro (18 septembre 2026)

Demande de Dorian : que l'espace pro (`/app`) s'installe comme une application, avec le logo
Qualifyr. Une partie existait déjà — `appleWebApp` dans `app/app/layout.tsx` fait qu'un ajout à
l'écran d'accueil iOS s'ouvre en plein écran, sans barre d'adresse. Ce qui manquait : sur Android,
« Installer l'application » (Chrome) suit le manifest **du site**, pas la page consultée au moment
de l'installation — un pro qui installe depuis son tableau de bord aurait donc atterri sur le site
vitrine (`start_url: '/'` du manifest racine, `app/manifest.ts`), pas sur `/app`.

**Solution.** Un second manifest, propre à l'espace pro : `app/app/manifest.webmanifest/route.ts`
(une route classique, pas le fichier spécial `manifest.ts` de Next.js — celui-ci ne produit qu'un
seul manifest, à la racine). `start_url`/`scope` valent `/app`, le nom devient « Qualifyr — Espace
pro », le fond et le thème reprennent le noir de l'interface pro (`#0e0e0f`). Les icônes sont les
mêmes que le manifest racine (`qualifyr-192.png`, `qualifyr-512.png`, `icon.svg`) : une seule
identité visuelle Qualifyr, pas de logo par professionnel. Branché via `metadata.manifest` dans
`app/app/layout.tsx`.

**Installation côté pro** : Android/Chrome → menu ⋮ → « Installer l'application » (ou bandeau
automatique) ; iOS/Safari → Partager → « Sur l'écran d'accueil ». Dans les deux cas, l'icône ouvre
directement le tableau de bord, sans barre de navigateur.

**Parenthèse explicative sur le tableau de bord** (même jour, demande de Dorian). Le manifest
rendait l'installation *possible*, mais rien sur l'écran « Demandes » ne disait à un pro qu'elle
existait. Ajout d'une ligne sous le fil d'Ariane de la page (`app/app/page.tsx`), au même style que
la ligne au-dessus (`.subtitle`) : une précision entre parenthèses, pas une bannière avec un bouton
à fermer. Reprend le tutoiement déjà utilisé sur cet écran (« Ton pipeline… », « Partage ta
page… »), par cohérence avec le reste du dashboard.

---

## Résend — cause réelle des e-mails de réservation jamais envoyés (18 septembre 2026)

Suite du correctif `createBooking` ci-dessous : une fois `await Promise.allSettled(...)` en
place, une réservation réelle ne générait toujours **aucune** tentative côté Resend. Le correctif
serverless était donc réel mais insuffisant seul.

**Diagnostic.** Une route temporaire (`api/debug-email-env`, supprimée une fois la cause confirmée)
a permis de vérifier, en production, la présence des variables d'environnement (toutes présentes)
puis de déclencher un `resend.emails.send(...)` réel et de renvoyer l'erreur exacte au lieu de la
seule journaliser côté serveur (logs Netlify inaccessibles depuis l'interface pour ce projet).
Résultat : `403 validation_error — "The mail.qualifyragence.com domain is not verified"`, alors que
`mail.qualifyragence.com` est bien vérifié côté compte Resend.

**Cause.** La clé `RESEND_API_KEY` en service était une clé Resend restreinte à un seul domaine
d'expédition (mécanisme `sending_access` + `domainId` de Resend), configurée au moment de sa
création (13/08/2026) sur un domaine différent — vraisemblablement l'ancien
`notifications.qualifyragence.com`, abandonné depuis. Une clé ainsi restreinte refuse tout envoi
depuis un autre domaine, même vérifié, avec un message d'erreur trompeur (« domaine non vérifié »)
qui ne distingue pas « non vérifié » de « non autorisé pour cette clé ».

**Correctif.** Nouvelle clé API Resend créée sans restriction de domaine, `RESEND_API_KEY` mise à
jour dans Netlify, puis nouveau déploiement déclenché manuellement (un changement de variable
d'environnement seul ne redéploie pas les fonctions déjà construites). Confirmé en production :
`sendAttempt.ok: true`. La route de diagnostic temporaire a été supprimée dans la foulée.

---

## `StatusActions` — suppression définitive d'une demande (18 septembre 2026)

Demande de Dorian : ses réservations tests s'accumulaient dans « Demandes » sans qu'aucun bouton
existant ne les fasse disparaître — « Annuler » ne fait que passer le statut à `annule`, la ligne
reste affichée indéfiniment.

Ajout d'un bouton « Supprimer » distinct, sur la fiche d'une demande (`/app/bookings/[id]`) :
supprime la ligne de `detailer_bookings` (nouvelle fonction `deleteBooking`, `dashboard.ts`,
nouvelle route `DELETE /api/app/bookings/[id]`), avec la même vérification de propriété
(`detailer_id`) que les autres actions. `window.confirm` avant l'appel : contrairement à un
changement de statut, il n'y a pas de retour en arrière possible une fois la ligne supprimée.

---

## `createBooking` — les e-mails et le WhatsApp de réservation ne partaient jamais (18 septembre 2026)

Signalé par Dorian après plusieurs réservations tests réelles, menées jusqu'au bout : la page de
confirmation affichait « un e-mail a été envoyé à … », mais l'historique Resend restait vide —
aucune tentative d'envoi, pas même un échec visible.

**Cause.** `createBooking` (`booking.ts`) lançait `notifyBookingEmails(...)` et
`notifyNewBooking(...)` (WhatsApp) en `void`, sans les attendre, puis retournait aussitôt. La
route qui l'appelle (`api/detailing/[slug]/bookings/route.ts`) renvoie alors sa réponse HTTP
immédiatement après. Sur une fonction serverless (les fonctions Netlify de ce projet incluses),
rien ne garantit qu'un travail asynchrone non attendu ait le temps de partir avant que la
plateforme ne gèle l'exécution une fois la réponse envoyée — l'appel réseau vers Resend (et vers
l'API WhatsApp) pouvait donc être interrompu avant même d'avoir été émis, sans la moindre erreur
puisqu'il n'atteignait jamais l'API distante.

**Correctif.** Les deux envois sont maintenant rassemblés dans un tableau de promesses et
attendus (`await Promise.allSettled(...)`) avant que `createBooking` ne retourne. Le comportement
« best-effort » est inchangé — un échec d'e-mail ou de WhatsApp n'annule toujours pas la
réservation, `Promise.allSettled` ne lève jamais — seul le moment où la réponse HTTP part change
(quelques centaines de ms de plus, le temps réel de l'appel réseau).

---

## `DarkHeader` / `DarkFooter` — préchargement de liens en arrière-plan (18 septembre 2026)

Demande de Dorian : « comment améliorer la vitesse sur mon site et saas ». Audit du site en
ligne (requêtes réseau capturées via le navigateur) : à chaque visite de l'accueil, cinq
requêtes de préchargement partent immédiatement en arrière-plan (`/fonctionnalites`, `/tarifs`,
`/faq`, `/app`, `/nettoyage-automobile`) — parfois la même page plusieurs fois en quelques
secondes. Aucun tiers en cause : c'est le comportement par défaut de `next/link`, qui précharge
la page complète de chaque lien dès qu'il entre dans le viewport. `DarkHeader` est toujours
visible dès le premier pixel (bandeau collant), donc ses cinq liens se préchargent tous au
chargement, avant tout clic. `DarkFooter` a le même effet dès qu'on défilie jusqu'en bas
(douze liens d'un coup).

**Correctif** : `prefetch={false}` sur les liens secondaires des deux composants (navigation du
header, panneau mobile, groupes du footer). L'action principale (`primaryCta`, « Créer mon
compte ») garde le comportement par défaut : c'est la seule destination qu'on veut réellement
précharger. Aucun impact sur la navigation elle-même — un clic déclenche toujours le
chargement, juste sans l'avoir anticipé ; la différence n'est perceptible que sur le volume de
données transférées en arrière-plan, plus sensible en connexion mobile.

Reste à mesurer avec un audit Lighthouse mobile réel (voir `docs/04-plan-implementation.md` pour
le seuil visé) : ce correctif réduit une dépense réseau constatée, mais ne remplace pas un
relevé chiffré de LCP/CLS/INP sur les pages clés.

---

## `MessageBubble` — carré noir derrière les bulles sur Safari iOS (18 septembre 2026)

Signalé par Dorian sur capture d'écran mobile (page d'accueil, nuage de bulles décoratives du
hero) : un carré noir plein s'affichait derrière chaque groupe de bulles. Jamais reproduit sur
Chromium (vérifié via le navigateur intégré) — bug WebKit connu.

**Cause.** `.bubble-impact` (`tailwind.css`) anime l'arrivée de chaque bulle via `transform`
(`translateY` + `scale`). `MessageBubble.tsx` posait par ailleurs un `boxShadow` sur ce même
élément. Sur Safari iOS, un `box-shadow` combiné à une animation `transform` peut se peindre en
rectangle opaque au lieu de l'ombre portée attendue, dès que Safari promeut l'élément sur son
propre calque de composition pendant l'animation.

**Correctif.** `boxShadow` remplacé par `filter: drop-shadow(...)` — rendu visuellement
identique ici (la bulle a un fond plein, une forme simple, pas de transparence interne à
respecter), mais qui compose correctement avec `transform` sur WebKit. Contournement documenté
de ce bug précis, pas une réécriture générale : `box-shadow` reste employé sans problème
ailleurs dans le projet, tant qu'il n'est pas posé sur un élément animé via `transform`.

---

## Recherche d'adresse biaisée autour du professionnel (17 septembre 2026)

Repéré par Dorian sur une réservation réelle chez Auto Clean Pro (Fréjus, Var) : un client
qui tape « Frejus » se voyait proposer en premier résultat un lieu-dit du même nom situé à
200 km, dans les Hautes-Alpes. Nominatim (`/api/detailing/geocode`) classe les résultats par
pertinence textuelle pure, sans notion de proximité géographique — un homonyme rural peut
donc dépasser la ville que le client a réellement en tête.

**Correctif** : `viewbox` (préférence, pas un filtre dur — pas de `bounded=1`, un client qui
réserve pour une résidence secondaire lointaine reste trouvable) recentre désormais le
classement autour du point de départ du professionnel (`detailer.base`) quand il en a un, ou
à défaut autour du centre de sa ville (`detailer.city`, geocodée une fois puis mise en cache
30 jours — cas d'Auto Clean Pro, qui ne facture aucun déplacement et n'a donc jamais
renseigné de point de départ précis). `AddressPicker` reçoit un nouveau prop `city`, câblé
depuis `BookingFlow` sur `/reservation/[slug]` et `/embed/[slug]`.

## Crédit « Propulsé par Qualifyr » sur les pages publiques (17 septembre 2026)

Demande de Dorian : un moyen subtil de faire connaître Qualifyr (le SaaS et
l'offre de création de site) à travers les pages que ses professionnels
publient, sans nuire à leur propre conversion.

**Nouveau composant `PoweredByQualifyr.tsx`**, posé en pied de page sur
`/reservation/[slug]` (juste après `BookingFlow`) et sur `/embed/[slug]`
(sauf la variante `demo`, déjà posée sur qualifyragence.com lui-même — le
crédit y serait redondant). Texte discret, couleur `--color-faint`, aucun
accent de couleur de la page, lien vers la page d'accueil (`productionUrl`)
plutôt que directement vers `/creation-site-web` : le visiteur d'une page de
réservation est un client du professionnel, pas un prospect déjà qualifié
pour un site — la page d'accueil présente l'ensemble de l'offre et laisse le
visiteur curieux naviguer lui-même.

Le tunnel embarqué (`/embed/[slug]`) se redimensionne déjà automatiquement
via `EmbedAutoHeight` (`ResizeObserver` sur `document.documentElement`) :
aucun ajustement necessaire pour que le crédit soit pris en compte dans la
hauteur publiée au site hébergeur.

## Textes de réassurance rééquilibrés selon acompte ou non (17 septembre 2026)

Sur une fiche sans acompte (Auto Clean Pro, `deposit_enabled = false`), la
carte du milieu (« Annulation gratuite jusqu'à N h avant ») tenait en une
seule phrase courte quand les deux autres cartes de `BookingIntro.tsx` en
tenaient quatre — déséquilibre visuel repéré par Dorian sur capture. La
phrase de repli sans acompte dit maintenant explicitement ce que garantit
réellement le parcours (aucun prélèvement à la réservation, règlement
directement avec le professionnel — cohérent avec l'écran de confirmation de
`BookingFlow`, qui ne mentionne aucun paiement en ligne dans ce cas), sans
rien inventer de plus. Les deux autres cartes sont légèrement resserrées au
passage.

## Bloc « À partir de / Dès / Lieu » centré sur mobile (17 septembre 2026)

Repéré par Dorian sur une capture de la page publique d'Auto Clean Pro : sur
téléphone, les trois chiffres clés (prix, durée, lieu) s'affichaient collés à
gauche dans leur encadré, alors que tout le reste de l'en-tête (titre, texte,
carte) est centré — l'œil accroche sur ce bloc qui détonne.

En cause : une règle mobile de `BookingIntro.module.css` (`.facts { align-items:
flex-start }`, ajoutée à l'origine pour empiler les trois faits en colonne sous
560px) qui, en gardant l'alignement à gauche, cassait la symétrie du reste de
la page. Remplacé par `align-items: center` + `text-align: center` : les trois
faits restent empilés sur mobile, mais chacun est maintenant centré comme sur
ordinateur.

Corrigé au passage : la page **Avant / Après** (`src/app/app/cases/page.tsx`)
affichait « Preuve sociale que **Detailr** ne pousse pas » — reliquat d'un nom
de code antérieur au projet. Remplacé par Qualifyr.

## Refonte visuelle de la facture imprimable (17 septembre 2026)

Demande de Dorian après avoir vu le gabarit existant (`/app/invoices/[id]/print`) :
le document généré était un simple texte noir sur blanc, système, sans aucune
identité visuelle — pas assez « pro » pour un document envoyé à un client.

**Important, correction de Dorian en cours de travail** : le logo et la marque
Qualifyr ne doivent **jamais** apparaître sur ce document. La facture est émise
par le professionnel (le detailer), pas par Qualifyr — Qualifyr ne fait que la
générer pour son compte. Un premier essai ajoutait le logo Qualifyr et un
bandeau « Facturé via Qualifyr » ; retiré immédiatement sur retour de Dorian.
Le nom affiché en en-tête reste uniquement celui du professionnel
(`legal_name` en base, ou le nom du compte à défaut).

**Ce qui a changé dans `src/app/app/invoices/[id]/print/page.tsx`** (styles
uniquement, aucune logique ni donnée modifiée) : bandeau d'en-tête charbon
(`#171513`) portant le nom du professionnel en Georgia (à défaut des polices
maison, non chargées sur cette page qui rend un `<html>` brut hors du layout
Next.js), fond de page sable (`#DCCFBD`) autour d'une feuille couleur papier
(`#FFFDF8`), liseré laiton (`#B08A52`) sous l'en-tête, libellés Émetteur/Client
en cuivre profond (`#8B452F`), tableau et totaux réalignés sur les tons
neutres du reste de la charte (`docs/03-direction-artistique.md`). Le bloc
QR-facture suisse (`swiss-qr-bill.ts`) n'est pas concerné par cette refonte,
seulement replacé proprement en dehors du bloc de contenu paddé.

**Vérification** : `lint`, `typecheck` et les 343 tests passent. `build` n'a
pas pu être vérifié dans cet environnement (bac à sable sans accès réseau
pour télécharger les polices Google Fonts — limitation de l'environnement,
sans lien avec ce changement) ; à revérifier lors d'un déploiement Netlify
normal si besoin.

## Invitation calendrier (.ics) jointe aux e-mails de réservation (16 septembre 2026)

Demande de Dorian, après avoir vu à quoi ressemblaient les e-mails de confirmation
(client et professionnel) : pouvoir ajouter le rendez-vous à son agenda (iOS ou
Samsung/Android) en un geste, sans passer par une autre application.

**Nouveau module `lib/detailing/ics.ts`** : construit un fichier `.ics` minimal (norme
RFC 5545), sans dépendance externe — un `.ics` est du texte brut, une bibliothèque
n'aurait rien apporté pour une trentaine de lignes de gabarit. Pas de `import
'server-only'` ici, à la différence de `whatsapp.ts` : ce module ne lit aucun secret,
seulement du formatage de texte.

**Joint aux deux e-mails de nouvelle réservation** (`sendClientBookingEmail` et
`sendDetailerBookingEmail`, `lib/detailing/email.ts`), pas à la relance de devis
abandonné (`sendAbandonedBookingEmail`) : à ce stade, rien n'est encore confirmé, une
invitation calendrier prétendrait un rendez-vous qui n'existe pas. Le contenu de
l'événement (description) reprend le même tableau que le corps de l'e-mail (`rows()`),
pour que l'agenda et le message portent toujours la même information. Le titre de
l'événement diffère selon le destinataire : nom du professionnel pour le client,
véhicule et formule pour le professionnel — c'est le seul champ qu'un agenda affiche
sans ouvrir l'événement.

Ouvert nativement par Gmail, Outlook, Apple Mail et l'application Email de Samsung, sur
iOS comme sur Android : chacun propose « Ajouter au calendrier » à l'ouverture de la
pièce jointe.

## Nouvel écran « Horaires » — le professionnel configure lui-même ses jours et heures d'ouverture (16 septembre 2026)

Référence : `docs/19-horaires-ouverture.md`. En creusant pourquoi SW Carcleaning n'affichait
aucun créneau sur trois semaines glissantes quel que soit le jour testé : le moteur de
créneaux lit une table `detailer_availability` (un jour de semaine, une heure d'ouverture,
une heure de fermeture, un battement) qui existait déjà, mais **aucun écran de
l'application ne permettait de la remplir** — seule une requête SQL manuelle le pouvait.
Dorian a choisi de construire un vrai écran plutôt qu'un correctif SQL ponctuel.

**Nouveau composant `HoursSetup.tsx`**, intégré en tête de la page **Planning**
(`src/app/app/planning/page.tsx`, au-dessus de « Tournée du jour », qui devient un sous-titre
de la page plutôt que son titre — la page couvre désormais les deux). Sept lignes
(lundi→dimanche), chacune un interrupteur Ouvert/Fermé et, si ouvert, une heure de début et
de fin (`<input type="time">`) ; un battement unique pour toute la semaine (§0.2 du
document de référence — pas un par jour, personne n'a demandé cette granularité). Même
architecture que `PaymentSetup.tsx` (docs/18) : chargement au montage, édition locale
distincte de ce qui est enregistré, bouton « Enregistrer » explicite.

**Nouvelle route `GET`/`PUT /api/app/availability`**, même garde que les routes voisines
(`requireCapability('planning')` + `getDetailerForOwner`, jamais un identifiant pris dans le
corps de la requête). Fermer un jour supprime sa ligne plutôt que de la désactiver par un
booléen — c'est l'absence de ligne pour un `weekday` qui signale déjà « fermé » au moteur de
créneaux (`availability.ts:47-48`), ce nouvel écran ne fait que refléter cette convention
existante plutôt que d'en inventer une seconde.

**Migration `026_detailer_availability_unique.sql`** : un index unique sur
`(detailer_id, weekday)`, nécessaire pour que l'upsert par jour remplace une ligne existante
plutôt que d'en créer une seconde (aucune migration ne traçait de contrainte à la création
initiale de cette table).

**Volontairement hors périmètre** (documenté en §0 de la référence, pas oublié) : les
fermetures ponctuelles (`detailer_closures`, déjà en base et déjà lues par le moteur de
créneaux, toujours sans écran) et les réglages `minBookingNoticeHours` /
`slotGranularityMinutes` (sur `detailers`, gardent leurs valeurs par défaut). Pas de test
dédié à la nouvelle route : aucune route sœur de ce dashboard (`payment-settings`,
`stripe-connect`, `deposit-confirm`) n'en a — la convention de ce projet teste l'isolation
propriétaire au niveau des fonctions `lib/`, pas des routes Next elles-mêmes
(`tests/owner-isolation.test.ts`), et cette route suit exactement le même schéma
d'autorisation qu'elles.

## Tunnel de réservation — bouton Continuer bloqué à l'étape « Lieu » sans adresse de départ (16 septembre 2026)

Bug déjà repéré dans `docs/17-audit-fonctionnel-trois-agents.md` (point 6), reproduit par Dorian sur
le compte SW Carcleaning : pour un professionnel n'ayant pas encore renseigné son adresse de départ
(`detailer.base = null`), le bouton « Continuer » restait grisé si le client laissait vide le champ
« Distance jusqu'au professionnel » — alors que le texte d'aide affiché disait explicitement que
c'était permis (« sinon laissez vide — il ajustera »). Un client qui suivait la consigne à l'écran
se retrouvait bloqué sans le moindre message d'erreur.

**Corrigé en rendant le champ réellement facultatif** (option choisie par Dorian entre les deux
proposées par l'audit, l'autre étant de le rendre obligatoire avec un message d'erreur).
`canProceed.lieu` (`BookingFlow.tsx`) n'exige plus `travelKm` non vide : `effectiveTravelKm` retombe
déjà sur `0` dans ce cas, et `0` est toujours dans le rayon gratuit du professionnel — le calcul du
devis ne change pas, seul le blocage disparaît.

## Tunnel de réservation — champ caché par la barre d'action et bulle WhatsApp sur le bouton (16 septembre 2026)

Deux débordements signalés par Dorian sur `BookingFlow` (`/reservation/[slug]`, `/embed/[slug]`),
l'un seulement visible sur ordinateur, l'autre sur les deux formats.

**Immatriculation à moitié cachée, sur ordinateur seulement.** `.actions` (la barre « Continuer »/
« Confirmer ») reste `position: fixed` en bas d'écran à toutes les tailles. Le padding réservé en
bas de `.workspace` pour ne pas être recouvert par cette barre valait `8.5rem` sur mobile, mais
seulement `3rem` à partir de `min-width: 64rem` — mesuré à environ `5,1rem` de haut sur un écran de
bureau, la barre dépassait donc largement ce padding et recouvrait le dernier champ de chaque
étape (l'immatriculation, sur « Votre véhicule »). Corrigé à `6,5rem`.

**Bulle WhatsApp posée sur le bouton d'action.** `WhatsAppBadge` est fixé en bas à droite de
l'écran (`right/bottom: 1rem`) avec un `z-index` volontairement élevé pour rester au-dessus du
contenu — mais `BookingFlow` pose sa propre barre d'action fixe dans cette même zone, et le badge
s'affichait donc pile sur le bouton. Nouveau prop `liftAboveActionBar` sur `WhatsAppBadge` : relève
le badge à `5,75rem` du bas plutôt que `1rem`, activé sur les trois points de rendu du tunnel
(`/reservation/[slug]`, `/embed/[slug]` professionnel réel et démo). Les autres pages du site, sans
barre d'action fixe, gardent la position par défaut.

## E-mail de nouvelle demande au professionnel — rendu plus visible, devise corrigée (16 septembre 2026)

Demande de Dorian : après avoir écarté le SMS et la notification WhatsApp (bloquée par le délai
d'approbation d'un modèle chez Meta — voir section suivante), rendre plus visible l'e-mail déjà
envoyé au professionnel par `sendDetailerBookingEmail` (`lib/detailing/email.ts`), seul canal de
notification réellement actif aujourd'hui.

**Objet enrichi.** Un aperçu de notification (téléphone, client mail) n'affiche souvent que
l'objet. Il contient désormais le créneau et le montant du devis, précédés de `🔔` pour se
distinguer au coup d'œil dans une boîte dense : `🔔 Nouvelle demande — lundi 21 septembre 2026 à
10:00 · 89,00 CHF` (auparavant : `Nouvelle réservation — lundi 21 septembre à 10:00`, sans montant).

**Lien direct vers la fiche.** Un bouton « Voir la demande » (texte et HTML) pointe vers
`{site.url}/app/bookings/{bookingId}` — le professionnel répond en un clic, sans chercher la
réservation dans son tableau de bord. `textBody`/`htmlBody` acceptent désormais un `cta?`
optionnel à cet effet ; les autres e-mails (`sendClientBookingEmail`) n'en passent pas.

**Bug de devise corrigé au passage, non signalé par Dorian.** `formatPrice` dans `email.ts`
formatait tout montant en EUR, quel que soit le pays du professionnel — un detailer suisse voyait
donc ses propres devis affichés en euros dans ses e-mails de notification. Corrigé en le
faisant passer par `formatMoney`/`profileFor` (`locale.ts`), déjà utilisés ailleurs (WhatsApp,
`PricingEditor`). Un nouveau champ `country?` sur `BookingEmailPayload`, alimenté par
`booking.ts` (`detailer.country`), pilote la devise affichée.

## Notification WhatsApp au professionnel — nouvelle demande de réservation (16 septembre 2026)

Demande de Dorian : prévenir un professionnel par WhatsApp à chaque nouvelle demande de
réservation, en plus de l'e-mail déjà envoyé par `sendDetailerBookingEmail`. Il avait d'abord
envisagé une notification « push » du navigateur, écartée après explication (Safari sur iPhone
n'autorise les notifications que pour un site ajouté à l'écran d'accueil — une vraie
particularité de la plateforme, pas un bug).

**Réutilise l'infrastructure déjà en place.** `lib/detailing/whatsapp.ts` sait déjà envoyer des
messages WhatsApp via l'API Cloud de Meta (`vehicule_pret`, `demande_avis`) — `notifyNewBooking`
en est un troisième, même mécanique (`sendTemplate`), déclenché depuis `createBooking`
(`booking.ts`) juste après l'e-mail, en best-effort (un échec n'annule jamais la réservation).

**Nécessite un nouveau modèle approuvé par Meta**, comme les deux précédents — c'est un délai
externe à prévoir, pas un manque dans le code. Texte à soumettre dans le gestionnaire WhatsApp
Business, sous le nom `nouvelle_reservation` :

> Nouvelle demande de réservation sur Qualifyr : {{1}}, le {{2}}. Montant du devis : {{3}}.
> Détails et confirmation : {{4}}

Variables : véhicule + formule (« Berline · Extérieur »), créneau formaté, montant dans la
devise du professionnel, lien direct vers la réservation dans le dashboard.

**Numéro du professionnel (`detailers.whatsapp_number`), sans repli.** À la différence de la
bulle WhatsApp du parcours client (qui retombe sur le numéro de support Qualifyr tant que le
professionnel n'a pas rempli le sien), une notification professionnelle sans numéro renseigné
n'est simplement pas envoyée — un repli enverrait les notifications de tous les professionnels
non configurés directement à Dorian.

## Bulle WhatsApp — numéro de Qualifyr affiché à tort au client d'un professionnel (13 septembre 2026)

Demande de Dorian : `WhatsAppBadge` était câblé en dur sur le numéro de support Qualifyr sur
*toutes* les pages. Sur `/reservation/[slug]` et `/embed/[slug]` — les pages où un client final
réserve chez un professionnel — un clic sur la bulle écrivait donc à Qualifyr au lieu d'écrire
au professionnel chez qui la réservation avait lieu.

**État avant correction, plus nuancé qu'il n'y paraît.** `WhatsAppBadge` s'auto-masquait déjà
sur `/app` et `/reservation` (son propre test de chemin, `isSaaSPath`) — donc aucune bulle,
plutôt qu'une bulle au mauvais numéro, y apparaissait. `/embed/[slug]` n'était en revanche pas
exclu : la bulle Qualifyr y apparaissait bel et bien. Dans les deux cas, le résultat concret
pour ces pages était le même : aucune façon, ou la mauvaise façon, de joindre le professionnel.

**Nouveau champ.** `detailers.whatsapp_number` (migration 025), réglable dans Prestations →
Réglages, sous le même format libre que l'IBAN — la validation (`isValidWhatsAppNumber`, 8 à 15
chiffres une fois nettoyé) se fait à l'affichage, jamais en bloquant l'enregistrement : un
numéro mal formé fait simplement disparaître le bouton plutôt que planter une page. Tant qu'il
est vide, le numéro de support Qualifyr sert de repli — jamais de bulle muette.

**`WhatsAppBadge` accepte désormais `phoneNumber`/`message`.** Sans ces props (usage historique,
posé une fois dans `layout.tsx`), rien ne change : le badge continue à utiliser le numéro
Qualifyr et à s'effacer sur `/app`, `/reservation` et, désormais, `/embed`. Avec `phoneNumber`
fourni explicitement (même `null`), le masquage par chemin ne s'applique plus — c'est ce que
posent maintenant `/reservation/[slug]/page.tsx` et `/embed/[slug]/page.tsx`, avec le numéro du
professionnel (repli Qualifyr inclus) et un message dédié, `buildClientWhatsAppMessage` (« au
sujet d'une réservation chez {nom} »), distinct du message `buildDirectWhatsAppMessage` du site
vitrine qui parle, lui, d'un projet avec Qualifyr — les mélanger aurait envoyé un client vers un
message parlant de Qualifyr à un professionnel qui n'y comprendrait rien.

**`/embed/demo`, cas à part.** C'est la démonstration produit de Qualifyr elle-même (intégrée en
iframe sur la page d'accueil), pas la page d'un professionnel réel : elle garde explicitement le
numéro de support Qualifyr plutôt qu'un repli.

Vérifié qu'aucun autre point du parcours client ne pointait vers le numéro Qualifyr : `Header`
(et son propre bouton WhatsApp, `WhatsAppDirectButton`) est déjà masqué sur ces pages via
`body:has(main [data-theme='dark']) [data-legacy-chrome]`, que `BookingFlow` active sur
`/reservation` et `/embed`. Aucune autre référence WhatsApp dans `components/detailing` ou dans
ces deux routes.

## Prestations — bouton « Enregistrer » caché par la barre d'onglets (12 septembre 2026)

Capture de Dorian : après la correction du débordement de la grille tarifaire, le bouton
« Enregistrer » (`.saveBar`, sticky en bas d'écran) n'apparaissait plus que par une fine
tranche blanche — le reste caché sous la barre d'onglets flottante du dashboard.

**Deux barres visaient le même coin de l'écran.** `.saveBar` était `position: sticky;
inset-block-end: 0`, donc collée au tout dernier pixel bas de l'écran. Or la barre d'onglets du
dashboard (`.sidebar`, `app.module.css`) est `position: fixed`, plaquée au même endroit
(0,6rem de décollement + 3,7rem de hauteur = 4,3rem), et passe par-dessus. Un correctif
précédent (`padding-block-end` avec `env(safe-area-inset-bottom)`) réglait déjà le cas de la
barre d'outils de Safari, mais pas celui, plus haut, de la barre d'onglets de l'app elle-même.

**Correction.** Sous 900px (largeur où la barre d'onglets est flottante ; au-delà elle devient
un menu latéral fixe), `.saveBar` remonte de `4,3rem + env(safe-area-inset-bottom)` au lieu de
`0` — juste au-dessus de la barre d'onglets plutôt que dessous.

## Sélecteur de mode d'encaissement — libellés trop longs sur mobile (12 septembre 2026)

Capture de Dorian : « Carte bancaire (automatique) » et « Je gère la réception moi-même » —
les deux onglets du sélecteur `PaymentSetup.tsx` — pressés bord à bord sans respiration sur
téléphone. `.modeTab`/`.modeSwitch` est le même contrôle segmenté 50/50 que la bascule
Se connecter/Créer un compte de l'écran de connexion (`LoginForm.tsx`), dimensionné pour des
libellés courts (« Se connecter », 12 caractères) — pas pour deux phrases de 29-30 caractères.

Deux corrections, une de contenu et une défensive :
- Libellés raccourcis dans `PaymentSetup.tsx` : « Carte bancaire (automatique) » → « Carte
  bancaire », « Je gère la réception moi-même » → « Réception manuelle ». Le badge d'état
  (Actif/Non activé) et le texte au-dessus continuent de porter le sens perdu.
- `.modeTab` (partagé par tous les sélecteurs de ce type) : `min-inline-size: 0` pour autoriser
  un retour à la ligne si un futur libellé est de nouveau trop long, `text-align: center` pour
  que ce retour à la ligne reste lisible, et un léger resserrement du texte/padding sous 420px.

## Prestations (grille tarifaire) — débordement horizontal sur téléphone (12 septembre 2026)

Capture de Dorian, sur téléphone, zoom vérifié à 100 % : les cartes de la grille tarifaire
(Berline, SUV/break, Utilitaire, Prestige) débordaient à droite de l'écran, avec les champs
« min » coupés.

**Cause : un « blowout » de grille CSS, classique et déjà rencontré dans ce même fichier.**
`.cellInputs` (les deux champs CHF/min d'une case) est une grille à deux colonnes `1fr 1fr`.
Sans indication contraire, un navigateur ne laisse jamais une colonne `1fr` descendre sous la
taille minimale de son contenu (`min-width: auto`) — et cette taille minimale se propage vers le
haut à travers `.cell` puis `.grid`, qui poussent alors toute la page plus large que l'écran au
lieu de se comprimer. `PricingEditor.module.css` corrige déjà ce problème à plusieurs endroits
(`.nameField input`, `.inline input`, `.baseSearch input` ont tous un `min-inline-size: 0`
explicite, commenté comme tel) — il manquait sur `.cell`, `.cellInputs` et `.inline` eux-mêmes,
les conteneurs immédiatement responsables du débordement visible. Complété.

**Bug voisin, même famille : le sélecteur de pays.** `.setting select` n'avait aucune largeur
déclarée — un `<select>` sans `width` se dimensionne sur son option la plus longue
(« France — EUR, TVA 20 % »), ce qui le fait déborder une fois `.settingsGrid` passé à deux
colonnes sur téléphone. Ajout de `inline-size: 100%` + `min-inline-size: 0`, même famille de
correctif.

## Échelle visuelle du dashboard — réduction (12 septembre 2026)

Dorian, capture à l'appui (page Démarchage) : « l'affichage est trop immense ». Deux causes,
une propre à la page, une partagée par tout le dashboard.

**Page Démarchage désynchronisée du reste.** `src/app/app/hermes/page.tsx` posait son titre et
son intro à la main en Tailwind (`text-[1.35rem]`, `text-[0.9375rem]`) au lieu des classes
partagées `.title`/`.subtitle`/`.main` (1.1–1.2rem, 0.72rem, largeur maximale 1120px) utilisées
par toutes les autres pages — d'où un titre visiblement plus gros et une largeur non contrainte
sur grand écran. Réalignée sur `invoices/page.tsx` et consorts.

**Réduction partagée, ressentie sur tout le SaaS.** `.title` (desktop 1.3rem → 1.2rem), `.main`
(padding desktop 2rem/2.25rem/3rem → 1.5rem/2rem/2.25rem), `.kpi` (padding 0.9rem/0.95rem →
0.75rem/0.85rem) et `.kpiValue` (1.3rem → 1.15rem) sont utilisées par toutes les pages à cases
(accueil, Démarchage…) — les resserrer ici réduit l'échelle générale sans dupliquer le
changement page par page. `.hermesForm`/`.hermesSection` (écarts 1.5rem → 1.15rem/1.25rem) et le padding des champs
(0.7rem/0.9rem → 0.6rem/0.85rem) suivent le même mouvement.

**Ce qui n'a pas bougé.** Le texte des champs de saisie reste à 16px (`max(16px, 1em)`,
`.shell :is(input, select, textarea)`) — en dessous, iOS zoome la page au focus et ne revient
jamais à l'échelle initiale. Les cibles tactiles (boutons, onglets) gardent leur taille : seuls
les textes, cases et espacements ont été resserrés.

## Mobile dashboard — débordement horizontal et photos avant/après (12 septembre 2026)

À la demande de Dorian : « la page trop large sur bcp d'onglet + lenteur ». Deux bugs distincts,
tous deux issus du même angle mort — le fallback mobile `.mobileList`/`.mobileCard` (déjà en
place sur `/app` pour les demandes) n'avait pas été répété partout où `.table` est utilisé.

**Débordement (« trop large ») — Factures.** `src/app/app/invoices/page.tsx` et
`src/app/app/invoices/[id]/page.tsx` forçaient leur tableau (`style={{ display: 'table' }}`)
au lieu de laisser la règle CSS `.table { display: none }` sous 720px s'appliquer. Un tableau à
4–5 colonnes rendu de force à 360px déborde l'écran — c'était le module concrètement « trop
large ». Retiré ; les deux pages ont désormais une liste de cartes (`.mobileList`/`.mobileCard`)
sous 720px, comme `/app`.

**Contenu disparu, pas seulement débordant — Prospection.** `src/app/app/prospection/[id]/page.tsx`
et `ImportProspects.tsx` n'avaient, eux, aucun forçage — mais aucun fallback non plus : la
règle `.table { display: none }` cachait la liste sous 720px sans rien la remplacer. Le tableau
ne débordait pas, il disparaissait simplement sur téléphone. Ajout du même fallback carte.

**Lenteur — photos Avant/Après.** `src/app/app/cases/page.tsx` chargeait les photos via `<img>`
brut (`eslint-disable-next-line @next/next/no-img-element`), sans compression AVIF/WebP ni
chargement différé — alors que `next.config.js` autorise déjà le Storage Supabase précisément
pour `next/image`. Remplacé par `<Image>` (4:3, `sizes` responsive) : mêmes dimensions
d'affichage (`.casePair img` fixe déjà l'aspect-ratio et l'`object-fit` en CSS), photos
optimisées et chargées à la demande.

## Accent chaud du dashboard et micro-interactions (12 septembre 2026)

À la demande de Dorian : le dashboard (`[data-app='dashboard']`) et l'écran de connexion
(`[data-app='login']`) utilisaient `--accent-2` (bleu givré `#b8cfe4`) et `--accent-3` (lilas
`#c9c4ee`) sur les contours dégradés, points d'état, halos et texte en dégradé — deux couleurs
explicitement interdites par `docs/03-direction-artistique.md` §1.7 (« bleu électrique »,
« mauve, violet ») et déjà signalées, sans être corrigées, dans `docs/17-audit-fonctionnel-trois-agents.md`
finding #4.

**Recolorisation, strictement scopée au dashboard/login.** `--accent-2` et `--accent-3` restent
inchangés partout ailleurs (identité des trois agents sur le site vitrine, `AgentGrid.tsx`,
`.node-hero` etc. — hors périmètre de cette demande, toujours signalé comme non résolu).
Uniquement dans `src/app/app/app.module.css` et les blocs `[data-app='dashboard']` de
`tailwind.css`, chaque référence est remplacée par du laiton (`#c7a06b`) et du cuivre
(`#c9835c`) — les teintes officielles de `docs/03` §1.2, éclaircies pour rester lisibles sur
les fonds presque noirs du dashboard (même logique déjà appliquée à `--state-error`).

**Halos retirés, pas seulement recolorés.** `.paymentPanel`, `.loginBox` et `.navItemFab`/
`.app-tab-fab` portaient des `box-shadow` diffuses ou des cercles floutés en arrière-plan
(`.loginShell::before/::after`) — exactement les « box-shadow diffuses de type glow » et
« halos lumineux » interdits par `docs/03` §1.7. Retirés ; le contour dégradé (net, sans flou)
suffit à porter l'accent. Une ombre neutre (`rgba(0, 0, 0, …)`, sans teinte) remplace la lueur
là où un peu de relief restait utile.

**Micro-interactions ajoutées** (`peps` demandé par Dorian) : survol laiton sur les onglets du
menu latéral (`.navItem`, ordinateur uniquement — `hover: hover` exclut le tactile), léger
soulèvement + ombre laiton au survol de `.app-primary`, contour laiton au survol de
`.app-ghost`/`.app-filter`, et un survol équivalent sur `.paymentPanel`. Toutes ces transitions
sont neutralisées sous `prefers-reduced-motion: reduce`.

## Mode de paiement manuel — virement et lien PayPal (12 septembre 2026)

Référence : `docs/18-options-paiement-acompte.md`. `PaymentSetup.tsx` (dashboard,
`/app/prestations`) gagne un sélecteur en tête de module — Stripe (inchangé) ou
« Je gère la réception moi-même ». En mode manuel, un second sélecteur propose
virement bancaire ou lien PayPal personnel, avec un avertissement non masquable
(`.manualWarning`, ambre — même vocabulaire que `.badgeAttente`) : ce mode retire
la garantie anti-désistement que Stripe apporte, et Qualifyr ne peut pas vérifier
qu'un paiement a réellement eu lieu.

Réglages persistés via `PUT /api/app/payment-settings` (nouvelle route), lus via
`GET` de la même route — distincte de `/api/app/stripe-connect`, qui reste le
seul point d'entrée pour l'onboarding Stripe. Le lien PayPal est validé côté
serveur (`src/lib/detailing/paypal-link.ts`, hôte `paypal.com`/`paypal.me`
uniquement) à l'enregistrement, puis revalidé à chaque lecture publique
(`booking-public.ts`) — jamais fait confiance à une valeur stockée sans
recontrôle, puisque c'est elle qui est montrée comme cliquable à un client final.

Nouveau composant `DepositConfirmButton.tsx` (détail d'une réservation,
`/app/bookings/[id]`) : bouton « Acompte reçu », affiché uniquement pour un
detailer en mode manuel avec une réservation `en_attente_paiement`. Appelle
`PATCH /api/app/bookings/[id]/deposit-confirm`, qui pose `deposit_confirmed_by`
= `'manuel'` — distinct du bouton générique « Confirmer » de `StatusActions`
(préexistant, toujours disponible, mais sans cette traçabilité).

`src/app/reservation/[slug]/confirmation/page.tsx` affiche l'IBAN ou le lien
PayPal du professionnel avec la mention « pas de confirmation automatique »
quand `paymentMode === 'manuel'`, à la place du bouton `PayDepositButton`.

## Boutons d'appel à l'action — retrait du halo lumineux (12 septembre 2026)

`.accent-glow` (halo flouté derrière le bouton, radial-gradient sur `--accent-1`/
`--accent-2`) et `.cta-beam` (anneau conique animé « comète », même famille de
teintes) sont supprimés — classes et définitions CSS. Dorian a signalé visuellement
le défaut (deux formes ovales floues autour des boutons de la section finale de
l'accueil) ; l'effet correspond mot pour mot à l'interdit `CLAUDE.md` sur les « halos
lumineux, néon » et relève de la palette interdite (dégradé utilisant les tokens
d'accent, hors accessoire de marque). Retiré des 8 fichiers qui les posaient sur un
`<Link>`/bouton : `DarkHero.tsx`, `FinalCtaSection.tsx`, `AgentGrid.tsx`,
`DarkFooter.tsx`, `DarkVerticalPage.tsx`, `DemoSection.tsx`, `DarkHeader.tsx` (deux
occurrences), `DarkPricing.tsx`. Les définitions CSS mortes (`tailwind.css`) sont
retirées avec, y compris le `@property --qualifyr-beam-angle` et les
`@keyframes qualifyr-beam-orbit` qui n'existaient que pour `.cta-beam`.

`.accent-ring` (bordure en dégradé des pastilles, `DarkHero.tsx`) et `.accent-text`
sont des classes distinctes, toujours utilisées, non concernées par ce retrait.

## Connexion / création de compte — mise à jour du 12 septembre 2026

`LoginForm` (`/app/login`) n'envoie plus de lien magique. L'écran porte deux onglets
— **Se connecter** et **Créer un compte** — sur les mêmes champs e-mail et mot de passe :

- **Créer un compte** appelle `POST /api/app/signup` (`signUpWithPassword`, douze
  caractères minimum, sans règle de composition — même choix que `PasswordForm`).
  Supabase envoie un e-mail de confirmation ; tant qu'il n'est pas ouvert, aucune
  session n'existe. C'est la seule vérification d'identité : pas de case à cocher,
  pas d'étape supplémentaire.
- **Se connecter** reste `POST /api/app/login-password`, inchangé.
- **Mot de passe oublié ?** est un lien de texte sous le formulaire, visible en mode
  connexion seulement — recours minoritaire, pas une action de même rang que
  « Se connecter ». Il appelle toujours `POST /api/app/reset-password`.
- Un seul bouton « Afficher/Masquer le mot de passe » sert les deux onglets ; aucun
  champ de confirmation du mot de passe (voir la justification dans `PasswordForm`).

**Pourquoi le lien magique a disparu.** Il dépendait d'une redirection Supabase
exactement autorisée dans le projet ; mal configurée, l'e-mail partait mais le lien
ramenait sur l'écran de connexion sans jamais ouvrir de session — silencieusement,
sans erreur visible. Un mot de passe choisi à l'inscription retire cette dépendance
de chaque connexion et ne la laisse plus peser que sur l'e-mail de confirmation.

`app.module.css` gagne `.modeSwitch`/`.modeTab`/`.modeTabActive` (le contrôle
segmenté) et `.forgotLink`. `.error` passe de `#f87171` (rouge vif) à `#e8a598` —
la charte réserve le rouge vif à rien du tout ; `#e8a598` est le même rouge sourd
que `--state-error` dans `tailwind.css`, repris en dur ici car ce module ne voit pas
ce jeton.

## Diagnostic guidé — mise à jour du 1er août 2026

Le diagnostic commercial possède désormais **une seule source de vérité** : la route
`/diagnostic`. Aucun questionnaire WhatsApp parallèle ne doit être maintenu. Les
responsabilités des actions commerciales sont séparées explicitement :

- `DiagnosticLink` mène toujours vers `/diagnostic`, quel que soit l'état de la
  configuration WhatsApp ;
- `WhatsAppDirectButton` ouvre uniquement une conversation directe avec le message court
  public, sans collecter ni prétendre transmettre des réponses ;
- `DiagnosticForm` valide les cinq étapes, envoie d'abord vers `POST /api/diagnostic`, puis
  propose WhatsApp et le calendrier uniquement après une réponse serveur réussie ;
- le résumé WhatsApp structuré est généré par `buildDiagnosticWhatsAppMessage`, sans champ
  vide ni identifiant technique ;
- `useFormSubmission` peut signaler une session inachevée afin que la personne choisisse
  explicitement de la reprendre ou de recommencer.

La modale historique `WhatsAppDiagnostic` et son événement global sont supprimés : ils
dupliquaient la collecte et permettaient de contourner l'envoi serveur.

`DiagnosticForm` orchestre désormais huit états : introduction, cinq étapes, vérification et
confirmation. Les choix sont de vrais boutons radio ou cases à cocher, rendus sous forme de
grandes lignes éditoriales. Un maximum de trois origines de demandes et de deux priorités est
appliqué sans effacer les choix déjà faits.

Le composant réutilise `Field`, `TextInput`, `TextArea`, `Consent`, `HoneypotField`,
`ErrorSummary` et `Button`. La génération du message WhatsApp reste centralisée dans
`src/lib/whatsapp.ts`. Le header global affiche une variante minimale sur `/diagnostic` et le
footer, le bouton WhatsApp flottant et la relance d'inactivité y sont masqués afin de ne pas
concurrencer le parcours.

Design system de Qualifyr Agence. Ce document fait autorité sur l'usage des composants.
Il se lit avec `docs/03-direction-artistique.md` (jetons, compositions) et
`docs/01-positionnement.md` (vocabulaire).

Planche de contrôle : `/design-system`, accessible en développement (`npm run dev`).
Le fichier s'appelle `page.dev.tsx` et cette extension n'est déclarée dans `pageExtensions`
qu'hors production : **ni la route ni sa feuille de style n'existent dans le build livré**.

---

## 0. Principes transverses

1. **Rien n'est écrit en dur.** Aucune couleur, aucun espacement, aucune durée hors
   `src/styles/tokens.css`. Les composants consomment des rôles (`--surface-page`,
   `--text-secondary`, `--rule-strong`), pas des jetons bruts.
2. **Une carte n'est pas un rectangle ombré.** La structure du site repose sur des filets et
   du vide. Les seules ombres autorisées sont `--shadow-subtle` et `--shadow-raised`, et
   aucun composant ne les utilise à ce jour.
3. **`<button>` agit, `<a>` navigue.** Cette distinction n'est jamais inversée.
4. **Une icône ne porte jamais seule une information.** Elle est `aria-hidden`, accompagne un
   texte, et n'est jamais placée dans une pastille colorée.
5. **Aucun contenu inventé.** Un composant qui n'a pas de matière réelle n'est pas rempli :
   il est retiré, ou son bloc disparaît proprement (`ContactPanel`, `Footer`).
6. **Composants serveur par défaut.** Seuls `Header` et `MobileNavigation` sont des îlots
   client, et uniquement parce qu'ils ont besoin de `usePathname`, de l'état d'ouverture du
   menu et de la position de défilement.

---

## 1. Inventaire

### Acquisition et mesure

- `AttributionCapture` : composant client global et invisible ; premier contact stable, dernier contact mis à jour uniquement lors d’une nouvelle campagne.
- `src/lib/analytics.ts` : événements commerciaux typés, émis via `CustomEvent` et vers `dataLayer` uniquement lorsqu’elle existe déjà.
- Les CTA prioritaires portent un identifiant stable. Aucun texte libre, e-mail, téléphone, budget exact ou réponse de formulaire n’est mesuré.

### `src/components/ui/` — primitives

| Composant | Variantes | Rôle |
|---|---|---|
| `Logo` | `size` : `default` \| `large` · `stacked` · `inverse` | Marque + mot |
| `QualifyrMark` | — | Le Q, tracé vectoriel, `currentColor` |
| `Button` | `variant` : `primary` \| `secondary` \| `text` \| `inverse` · `loading` · `disabled` · `withArrow` | Action réelle |
| `ButtonLink` | mêmes variantes | Navigation présentée comme une action |
| `TextLink` | `tone` : `accent` \| `quiet` \| `inverse` · `href` \| `externalHref` | Lien dans un texte |
| `Eyebrow` | `bare` · `numbered` · `inverse` | Sur-titre en capitales espacées |
| `Divider` | `tone` : `hairline` \| `accent` \| `inverse` · `short` · `spacing` | Filet de structure |
| `Icon` | `arrow-right`, `arrow-up-right`, `plus`, `minus`, `close`, `menu` | Jeu d'icônes maison |
| `BrandIcon` | `whatsapp`, `instagram`, `tiktok` | Pictogrammes SVG monochromes des canaux confirmés |

### `src/components/layout/` — mise en page

| Composant | Variantes | Rôle |
|---|---|---|
| `Container` | `width` : `default` (1260px) \| `reading` (720px) \| `wide` | Largeur et gouttières |
| `Section` | `surface` : `page` \| `raised` \| `sunken` \| `inverse` · `spacing` · `ruled` | Bande pleine largeur, rythme vertical |
| `Header` | — | En-tête collant |
| `MobileNavigation` | — | Menu plein écran sous 992px |
| `Footer` | — | Pied de page sombre |
| `SkipLink` | — | Lien d'évitement vers `#contenu` |
| `Breadcrumbs` | `trail` · `current` | Fil d'Ariane, pages de second niveau |

### `src/components/editorial/` — blocs de contenu

| Composant | Variantes | Rôle |
|---|---|---|
| `SectionHeading` | `level` 1–3 · `split` · `inverse` | Sur-titre + titre + chapô |
| `EditorialCard` | `boxed` · `size` : `default` \| `large` · `inverse` | Bloc de texte titré, filet supérieur |
| `OutcomeCard` | `inverse` | Un moyen mis en regard de son effet |
| `JourneyStep` | `inverse` | Une des six étapes du parcours |
| `MethodStep` | `inverse` | Une étape du déroulé d'une collaboration |
| `CaseStudyCard` | `offset` | Réalisation réelle |
| `QuoteBlock` | `centered` · `inverse` · `attribution` | Phrase manifeste |
| `EditorialMedia` | `ratio` : `portrait` \| `landscape` \| `panorama` · `zoom` · `priority` | Image éditoriale |
| `FAQAccordion` | `defaultOpen` | Questions fréquentes |
| `ContactPanel` | `inverse` | Coordonnées réellement renseignées |
| `CallToAction` | `light` · `eyebrow` · `reassurance` · `secondaryAction` | Bloc de clôture |
| `HeroComposition` | — | Planche éditoriale du hero |
| `JourneyTrack` | — | Frise du parcours client |
| `ComparisonPanel` | — | Comparatif avant / après |
| `CasePlate` | `tone` : `sand` \| `ink` · `size` · `logo` · `priority` | Panneau d'identification d'un projet |
| `CaseGallery` | `priorityFirst` | Galerie d'une étude de cas — masquée si vide |
| `ArticleCard` | `featured` · `compact` | Entrée éditoriale du journal : numéro, catégorie, date, titre, résumé et lien de lecture |
| `VerticalServicePage` | `content` | Page commerciale métier partagée : hero, freins, réponse Qualifyr, parcours, preuve ou concept, méthode, FAQ et CTA |

### `src/components/motion/` — mouvement

| Composant | Rôle |
|---|---|
| `RevealObserver` | Un seul observateur par route. Révèle le contenu des grandes `Section` au défilement : opacité et 12 px de translation, une seule fois. La première section reste immédiatement visible. Le serveur rend le contenu **visible** ; le masquage initial dépend de `data-motion="on"`, posé avant le premier rendu uniquement si `prefers-reduced-motion` n'est pas demandé. Sans JavaScript, sans le script, ou en mouvement réduit : la page est entière. |

**Règle** : réservé aux **grandes compositions** — quatre cibles sur tout le site. Jamais sur
le hero, jamais sur une carte, jamais en cascade.

### `src/components/seo/` — référencement

| Composant | Rôle |
|---|---|
| `JsonLd` | Insertion d'un bloc de données structurées. Ne reçoit que des objets construits par `src/lib/structured-data.ts` — jamais de saisie visiteur. |

Les schémas globaux décrivent `Organization` / `ProfessionalService` et `WebSite`. L'accueil
ajoute `WebPage`, la page de création de site ajoute `Service`, et les fils d'Ariane visibles
peuvent ajouter `BreadcrumbList`. Toute coordonnée ou URL sociale inconnue est omise.
Le journal ajoute `Blog` et chaque article publié ajoute `BlogPosting` avec sa date réelle.

### `ArticleCard`

- Composant serveur, sans état ni dépendance.
- La variante `featured` compose une une en deux colonnes sur grand écran ; `compact` sert
  aux articles suivants sur la page du journal. L'accueil ne rend plus de carte d'article.
- Le panneau visuel est typographique et décoratif (`aria-hidden`) : aucune image générique,
  aucun faux écran et aucun projet fictif.
- Toute la carte est un lien ; le titre reste le nom accessible principal.
- Les publications futures ne lui sont jamais transmises.

### `src/components/form/` — formulaires

Le `DiagnosticForm` est un parcours guidé en cinq étapes. Chaque étape est validée avant de
continuer avec le même schéma partagé par le client et l’API. La progression est annoncée aux
technologies d’assistance, les étapes restent modifiables depuis le récapitulatif et le focus
est déplacé vers le titre de l’étape suivante sans modifier la position de lecture. Les
données, les erreurs serveur, le champ piège et la protection contre le double envoi
conservent leur fonctionnement existant.

Les `Select` masquent uniquement la flèche système au profit d'un chevron CSS, sans remplacer
le contrôle natif. Les groupes de cases gardent de vrais `input[type="checkbox"]`, visibles au
clavier et annoncés par les lecteurs d'écran, dans des surfaces tactiles d'au moins 44 px.

| Composant | Rôle |
|---|---|
| `Fieldset` / `FieldRow` | Groupe de champs `<fieldset>` + `<legend>`, rangée à deux colonnes |
| `Field` | Libellé associé, aide facultative, message d'erreur |
| `TextInput`, `TextArea`, `Select` | Contrôles pilotés par React (`value` + `onChange`) |
| `CheckboxGroup` | Cases à cocher multiples |
| `Consent` | Case de consentement, jamais pré-cochée, liée à la politique de confidentialité |
| `HoneypotField` | Champ piège, hors tabulation et hors arbre d'accessibilité |
| `FieldError`, `FormActions`, `RequiredNote` | Message d'erreur, zone d'action, mention des champs requis |
| `ErrorSummary`, `SuccessPanel` | Résumé d'erreurs focalisable, confirmation sur place |
| `useFormSubmission` | Logique commune : état, validation, focus, envoi, verrou |
| `DiagnosticForm`, `ContactForm` | **Îlots client** — assemblage complet des deux formulaires |

---

## 2. Détail et règles d'usage

### `Logo` / `QualifyrMark`

Verrouillage horizontal : le nouveau **Q** à gauche, `QUALIFYR` et `AGENCE` dans le lockup
fourni par Dorian. La variante `stacked` conserve une composition compacte lorsque la hauteur
n'est pas contrainte.

Le fond gris, le halo et le relief métallique du visuel de présentation ne sont pas repris.
Le lockup est préparé en aplat charbon et bascule en ivoire sur les fonds sombres. Les
déclinaisons, la limite de la source raster et le remplacement futur par le master vectoriel
officiel sont documentés dans `docs/12-logo-qualifyr.md`.

**À ne pas faire** : réintroduire un dégradé, ajouter une ombre, colorer la marque en laiton
ou la placer dans une pastille.

---

### `Button` / `ButtonLink`

Quatre variantes. **Le charbon reste la couleur des boutons** : le laiton et le cuivre ne
deviennent jamais une couleur de fond ou de bordure de bouton.

| Variante | Apparence | Quand |
|---|---|---|
| `primary` | Charbon plein, texte blanc chaud | Action principale — une seule par écran |
| `secondary` | Contour `--rule-strong`, fond transparent | Action alternative |
| `text` | Sans fond, soulignement laiton qui se trace au survol | Action tertiaire, dans un flux |
| `inverse` | Blanc chaud plein | Sur `Section surface="inverse"` |

États :

- **hover** : assombrissement + translation de −1px. Neutralisée si `prefers-reduced-motion`.
- **focus** : anneau global `2px` `--focus-ring`, décalé de `3px`. Jamais supprimé.
- **disabled** : `opacity: .45`, curseur `not-allowed`, translation neutralisée.
- **loading** : `aria-busy`, bouton neutralisé, indicateur circulaire + libellé
  « Envoi en cours ». En mouvement réduit, la rotation s'arrête et l'information reste portée
  par le texte.

**Règles** : `withArrow` est réservé aux actions qui font avancer le parcours. Un bouton ne
contient jamais une icône seule sans libellé accessible.

---

### `TextLink`

Le soulignement est **permanent** à 35 % d'opacité et passe à 100 % au survol. Un lien n'est
jamais identifiable par la seule couleur — condition d'accessibilité, pas un choix esthétique.

`externalHref` détecte les URL en `http` et ajoute `target="_blank"`, `rel="noreferrer"` et
une flèche sortante. Les liens `mailto:` et `tel:` restent dans l'onglet courant.

---

### `Eyebrow`

Sur-titre en capitales espacées (`0.12em`) précédé d'un filet de laiton. C'est le **seul**
emploi de majuscules décoratives autorisé sur le site.

**Règles** : un seul par section. Ne porte jamais l'information principale. `bare` retire le
filet pour les usages imbriqués (dans une `EditorialCard`, par exemple).

---

### `Divider`

Outil de structure principal. `tone="accent"` (laiton) est **limité à une occurrence par
écran** : au-delà, l'accent cesse d'être un accent.

---

### `Section` + `Container`

`Section` porte le fond et le rythme vertical, `Container` la largeur. Toujours imbriqués dans
cet ordre — jamais l'inverse.

Alternance des surfaces : `page` (ivoire) par défaut, `raised` (blanc chaud) et `sunken`
(sable) pour marquer un changement, `inverse` (charbon) **une seule fois par page**, pour le
bloc de clôture.

`surface="inverse"` pose `data-surface="inverse"`, ce qui bascule automatiquement l'anneau de
focus et la couleur de sélection de texte. Ne jamais poser cet attribut à la main.

---

### `Header`

Contenu : logo · Méthode · Réalisations · À propos · Diagnostic · bouton « Parler de mon
activité ».

Comportement :

- Collant, `z-index: 100`.
- Au repos, aucun filet : l'en-tête se confond avec la page. Dès 8px de défilement, un filet
  fin apparaît en bord inférieur.
- Fond : voile ivoire à 88 % avec une légère saturation, **sans flou**, sous `@supports`.
  Repli opaque là où `backdrop-filter` n'existe pas. Pas de glassmorphism.
- Page active : couleur pleine **et** filet permanent sous le lien. L'indication ne repose
  jamais sur la seule couleur.
- Navigation clavier complète, `aria-current="page"` sur l'entrée active.

**Interdits** : mega-menu, sous-menu déroulant, second bouton d'action, barre d'annonce,
sélecteur de langue.

---

### `MobileNavigation`

Panneau plein écran sous 992px.

- `aria-expanded` et `aria-controls` sur le déclencheur.
- `role="dialog"` + `aria-modal="true"` + `aria-label` sur le panneau.
- Focus déplacé sur le bouton **Fermer** à l'ouverture, rendu au déclencheur à la fermeture.
- Piège de focus au `Tab` et au `Shift+Tab`.
- `Échap` ferme.
- Défilement du corps de page bloqué, `overscroll-behavior: contain`.
- Cibles ≥ 44px, entrées de menu à 56px de hauteur minimale.
- Zones sûres iOS : `env(safe-area-inset-*)` sur les quatre côtés, `viewportFit: 'cover'`
  déclaré dans le `viewport` du layout racine.
- Numérotation `01`–`04` en repère typographique, sans icône.

---

### `OfferConfigurator`

Parcours progressif en cinq étapes, placé après les preuves de l'accueil. Il recueille
l'activité, la situation et le frein principal avant de présenter une recommandation et le
prix complet sur douze mois.

- aucune réponse présélectionnée ;
- une question principale par écran ;
- cartes entièrement activables au clavier et au toucher ;
- réponses conservées au retour arrière ;
- recommandations déterministes et testées ;
- options ajoutées ou retirées sans masquer leur prix ;
- grille tarifaire déterminée selon le code pays fourni par l'hébergeur : euros par défaut et
  CHF pour la Suisse, sans sélecteur de pays dans l'interface ;
- tarifs suisses calculés avec la règle commerciale documentée, puis arrondis à la dizaine
  supérieure ; aucune adresse IP n'est transmise au composant ni conservée ;
- prix présenté d'abord comme un équivalent mensuel exact sur 12 mois, avec une alternative
  lisible « mise en place + suivi » et le total contractuel toujours visible ;
- WhatsApp prérempli avec les réponses, le parcours, les options et l'estimation ;
- calendrier secondaire et modification des réponses disponibles à l'étape finale.

---

### `Footer`

Clôture globale en deux parties :

1. un bloc d'appel à l'action charbon — « Prêt à transformer votre projet digital ? » —
   avec un lien vers l'estimation et un lien vers le diagnostic ;
2. un pied de page ivoire en quatre colonnes : marque, services, entreprise, coordonnées et
   zone d'accompagnement, puis une ligne légale.

**La colonne « Contact » n'apparaît que si `src/content/contact.ts` contient au moins un canal
renseigné.** Le lien vers le calendrier suit la même règle avec
`NEXT_PUBLIC_QUALIFYR_BOOKING_URL`. Les réseaux sociaux viennent exclusivement de
`contact.social`. Aucune adresse, aucun numéro d'entreprise, aucun téléphone, aucun horaire
ni aucun réseau social n'est inventé — c'est une règle, pas un état provisoire.

Les libellés de services respectent le vocabulaire public autorisé. Un service sans page
dédiée renvoie vers le diagnostic, la méthode ou l'estimation selon l'action réellement
disponible ; aucun lien vide ni route fictive n'est créé.

Les liens Instagram et TikTok sont rendus sous forme de boutons éditoriaux avec pictogramme
SVG et nom du réseau. Le bouton WhatsApp fixe remplace le sigle « WA » par le pictogramme de
marque et expose aussi le mot « WhatsApp » au survol et au focus. Chaque cible conserve un
nom accessible complet et une surface tactile d'au moins 44 px.

---

### `Breadcrumbs`

Réservé aux pages de second niveau : mentions légales, politique de confidentialité, pages de
confirmation. L'arborescence est plate ; un fil d'Ariane sur l'accueil ou sur Méthode serait
du bruit.

La page courante est le dernier élément, sans lien, marquée `aria-current="page"`.

---

### `SectionHeading`

Composant **unique** pour tous les titres : `level={1}` pour le titre de page,
`level={2}` pour une section, `level={3}` pour une sous-section. Il n'existe volontairement
pas de second composant de titre, afin que la hiérarchie reste vérifiable d'un seul endroit.

**Un seul `level={1}` par page.** `split` rejette le chapô en colonne de droite sur grand
écran — c'est la composition asymétrique par défaut du site.

### `VerticalServicePage`

Composant serveur réservé aux deux verticales officielles. Son contenu provient de
`src/content/verticals.ts` et sa structure ne varie pas : un seul H1, sections sémantiques,
listes éditoriales, FAQ native et clôture vers le diagnostic.

- La variante `real` affiche une image réelle et un lien vers l'étude de cas.
- La variante `concept` affiche une composition abstraite sans faux écran et nomme le concept
  avant toute description.
- Les cartes ne sont jamais dupliquées dans les fichiers de route ; les routes ne contiennent
  que les métadonnées, le JSON-LD et la donnée à rendre.
- Aucun chiffre, résultat, prix, témoignage, logo absent ou promesse temporelle ne peut être
  ajouté dans ce composant.

---

### `EditorialCard`

Bloc de texte titré, délimité par un **filet supérieur**. Ni ombre, ni fond, ni gros rayon.

**Trois par rangée au maximum.** Au-delà, on retombe dans la grille de vignettes générique que
la direction artistique proscrit. `boxed` est réservé aux blocs isolés — jamais en grille.

---

### `OutcomeCard`

Met en regard un **moyen** (petit, en sur-titre) et son **effet sur l'activité** (grand, en
serif). La hiérarchie visuelle applique le positionnement : la promesse est le développement
de l'activité, jamais l'outil employé.

**Interdit** : tout chiffre, pourcentage, délai ou statistique dans `result`. Il n'existe
aucune donnée vérifiée à afficher.

---

### `JourneyStep`

Une des six étapes du parcours client. Les libellés — être trouvé, être compris, être choisi,
être réservé plus facilement, obtenir des avis, favoriser les nouvelles réservations — sont du
vocabulaire de référence : **ils ne se paraphrasent pas** et viennent toujours de `journey`
dans `src/content/brand.ts`.

Rendu en séquence continue (`<ul>`), lignes séparées par des filets pleine largeur.
Jamais en grille de vignettes.

---

### `MethodStep`

Une étape du **déroulé d'une collaboration** : cadrage, conception, mise en place, ajustement.
Vertical, relié par un trait continu ponctué de points de laiton.

À ne pas confondre avec `JourneyStep`, qui décrit le parcours du client final. Aucune durée
annoncée tant qu'elle n'est pas un engagement réellement tenu.

---

### `CaseStudyCard`

Réalisation réelle. `deliverables` liste ce qui a été **fait**, jamais ce que cela aurait
produit.

**Interdits absolus** : résultat chiffré, pourcentage, note, témoignage, logo client,
« projet fictif », « concept ». SW Carcleaning peut être cité comme réalisation réelle, sans
aucun chiffre. Une seule réalisation tant qu'il n'y en a qu'une : pas de grille remplie de
cases vides.

---

### `QuoteBlock`

Phrase manifeste en grande serif, précédée d'un filet de laiton. **Pas de guillemets
décoratifs surdimensionnés.**

**Usage par défaut : sans attribution.** C'est un bloc de position, pas un témoignage.
Qualifyr n'a aucun témoignage recueilli et validé ; en produire un ici, même vraisemblable,
est interdit. La prop `attribution` existe pour le jour où une citation réelle et autorisée
par écrit sera disponible — elle reste inutilisée jusque-là.

---

### `EditorialMedia`

Cadre au ratio imposé (`4:5`, `3:2`, `16:9`), `alt` **obligatoire**, `next/image` avec `fill`
et `sizes`. Aucun rayon : l'image est un bloc franc. `zoom` limite l'agrandissement à
`scale(1.02)` et se désactive en mouvement réduit.

La légende porte un repère court en laiton à gauche — annotation de magazine.

**Interdits** : rendus 3D, captures d'interface, faux écrans d'application, mockups flottants,
banques d'images génériques. **Si aucune photo réelle n'est disponible pour une section, on
retire la section** — on ne la remplit pas avec un visuel de substitution.

---

### `FAQAccordion`

Construit sur `<details>` / `<summary>` natifs : pliage accessible au clavier, restitué
correctement par les lecteurs d'écran, **fonctionnel sans JavaScript**. Aucun état React,
aucun ARIA maintenu à la main, aucune dépendance.

L'indicateur `+` pivote de 45° à l'ouverture. Aucune question ouverte par défaut, sauf
`defaultOpen` explicite.

**Ne pas s'en servir pour masquer un contenu faible** : chaque réponse doit tenir seule et
dire quelque chose de vrai.

---

### `ContactPanel`

N'affiche que les canaux réellement présents dans `src/content/contact.ts`. Tant qu'aucun
n'existe, le panneau propose l'échange (bouton vers le diagnostic) plutôt que d'inventer une
adresse, un numéro ou des horaires. **Ce repli est un choix assumé, pas un état d'attente à
combler.**

---

### `CallToAction`

Bloc de clôture, identique en bas de chaque page. Porte l'unique appel à l'action du site.

`reassurance` accepte une liste courte de faits **vérifiables** — « Échange sans engagement »,
« Analyse personnalisée », « Aucune fausse promesse ». Jamais de délai de réponse, de gratuité
chiffrée ni de disponibilité limitée.

**Interdits** : urgence artificielle, « places limitées », compte à rebours, promesse de
rappel sous 24 h, mention de gratuité non tenue. Une seule action principale ;
`secondaryAction` reste facultative.

---

### `HeroComposition`

Planche éditoriale du hero : un panneau charbon portant les sept moments du parcours
(découverte locale → demande d'avis) et une fiche ivoire décalée montrant la **structure**
d'une demande.

**Ce n'est pas une interface, et cela ne doit jamais le devenir.** Les champs de la fiche sont
volontairement vides — on montre l'ossature d'une demande, pas une demande fictive remplie.
La bande de semaine n'affiche que les initiales des jours. **Interdiction stricte** d'ajouter
un prix, une date, une heure, un nom de client ou une note : ce sont des données inventées
(AGENTS.md, §6).

Deux traits obliques à 8 % et 5 % d'opacité évoquent le reflet d'une carrosserie polie. Aucun
dégradé, aucun halo, aucune ombre.

La fiche est `aria-hidden` : purement illustrative, elle serait bruyante à l'oral. La séquence
des moments reste du texte lisible, et un `figcaption` décrit l'ensemble.

Décalage progressif : empilé sous 768px, deux colonnes à partir de 768px, chevauchement de la
fiche sur le panneau à partir de 992px.

---

### `JourneyTrack`

Frise des neuf moments du parcours client.

- **Mobile** : séquence verticale reliée par un trait continu, une étape par ligne,
  entièrement lisible sans zoom.
- **À partir de 768px** : trois colonnes, chaque étape posée sous un filet fin.
- **Aucun défilement horizontal, à aucun palier.** Un carrousel ou une bande scrollable est
  proscrit.

Rendu en `<ol>` : l'ordre porte du sens.

---

### `ComparisonPanel`

Comparatif avant / après. La colonne « avant » est posée sur le sable, la colonne « après »
sur le charbon : le contraste de surface porte la comparaison, sans flèche ni pictogramme de
progression.

**La prop `note` est obligatoire.** Elle rend explicite qu'il s'agit d'une façon de travailler
et non d'un résultat garanti. Aucun chiffre, aucun pourcentage, aucune durée n'a sa place dans
les deux colonnes.

---

### Formulaires

Règles appliquées, non négociables :

- **Un vrai `<label for>` par contrôle.** Jamais de placeholder en guise de libellé : il
  disparaît à la saisie et n'est pas restitué de façon fiable.
- **`<fieldset>` + `<legend>` pour chaque groupe.** Le contexte est annoncé avant les champs,
  sans ARIA ajouté à la main.
- **Les champs facultatifs sont marqués** — plutôt qu'un astérisque sur tous les autres.
- **Contrôles à 16px minimum** (pas de zoom automatique sur iOS), hauteur ≥ 46px,
  bordure `--rule-strong` à 4.88:1 pour respecter WCAG 1.4.11.
- **Aucun état porté par la seule couleur** : le message d'état a un titre, un texte et un
  liseré latéral, et il est annoncé par `role="status"`.
- **Consentement non pré-coché**, avec finalité explicite.

**Les formulaires sont en service.** La validation est partagée avec le serveur
(`src/lib/validation.ts`), les saisies survivent à une erreur, le focus va au premier champ
fautif, le double envoi est bloqué, et la confirmation remplace le formulaire sur place.

Si le service d'e-mail n'est pas configuré, la réponse dit franchement que le message n'a pas
été transmis — **jamais de faux succès** (AGENTS.md, §6). Détail complet dans
`docs/04-plan-implementation.md`, §7.

`useFormSubmission` porte toute la logique : les deux formulaires ne diffèrent que par leurs
champs.

---

### `CasePlate`

Panneau d'identification d'un projet. Deux états, un seul composant :

- **avec logo réel** : image affichée via `next/image`, dimensions déclarées, formats
  modernes automatiques ;
- **sans logo** : composition typographique — secteur, filet de laiton, nom du client en
  grande serif.

Le second état **n'est pas un placeholder d'attente** : c'est une mise en page finie, qui
tient seule et ne se signale jamais comme provisoire. Aucun texte du type « image à venir »
n'est affiché au visiteur.

Pour passer au logo réel : renseigner `logo` dans le fichier de contenu du projet. Aucun
composant à modifier. Utilisé à l'identique sur l'accueil, `/realisations` et l'étude de cas
— un seul endroit à changer le jour où le logo arrive.

---

### `CaseGallery`

Galerie d'une étude de cas. **Rend `null` si la liste est vide** : la section disparaît
entièrement plutôt que d'afficher un cadre vide.

Alternance bureau (16/10, pleine largeur) et téléphone (9/16, en regard du texte, décalé une
fois sur deux). Légendes discrètes numérotées. **Aucun carrousel** : tout est atteignable en
défilant, au clavier comme au doigt.

Performance imposée par le composant : `width`/`height` déclarés (aucun décalage de mise en
page), AVIF puis WebP, `sizes` adapté au format, `loading="lazy"` sauf éventuellement sur le
premier visuel, `priority` réservé au visuel principal. Le type `GalleryItem` rend `alt`
obligatoire — une image sans texte alternatif fait échouer le typecheck.

### `InteractiveSitePreview`

Fenêtre de consultation d'une réalisation web réelle. Le composant charge directement le site
public dans un `iframe` : le visiteur peut faire défiler les pages, suivre les liens et utiliser
la navigation comme sur le site d'origine, sans écran d'activation.

Le composant comporte toujours : le domaine, un lien d'ouverture dans un nouvel onglet, un
titre accessible pour l'`iframe`, un chargement différé et une politique de référent stricte.
Il ne doit jamais être imbriqué dans un lien ou un bouton. Sur mobile, sa hauteur est réduite
afin que la personne retrouve facilement le contenu principal. Dans une composition vedette
sur desktop, son conteneur doit lui donner toute la largeur disponible pour déclencher le
rendu desktop du site intégré.

Les zones d'en-tête et d'actions internes aux fenêtres de réservation ou de diagnostic
restent des conteneurs visuels (`div`) : les éléments sémantiques `<header>` et `<footer>`
sont réservés aux repères globaux de la page.

---

## 3. Exemples de composition

### Ouverture de page

```tsx
<Section spacing="tight">
  <Container>
    <SectionHeading
      level={1}
      split
      eyebrow="Méthode"
      title="La méthode Qualifyr"
      lead="…"
    />
  </Container>
</Section>
```

### Séquence du parcours

```tsx
<Section surface="raised" ruled>
  <Container>
    <SectionHeading eyebrow="Le parcours" title="Six étapes, une seule direction" />
    <ul>
      {journey.map((step) => (
        <JourneyStep key={step.number} number={step.number} label={step.label}>
          …
        </JourneyStep>
      ))}
    </ul>
  </Container>
</Section>
```

### Réalisation en diptyque décalé

```tsx
<Section>
  <Container>
    <CaseStudyCard
      offset
      client="SW Carcleaning"
      title="…"
      summary="…"
      deliverables={['Structuration des prestations', 'Parcours de réservation']}
      media={<EditorialMedia src={photo} alt="…" ratio="portrait" captionMark="01" caption="…" />}
    />
  </Container>
</Section>
```

### Clôture

```tsx
<Section surface="inverse">
  <Container>
    <CallToAction title="Faites grandir votre activité de nettoyage automobile.">
      {brand.explanation}
    </CallToAction>
  </Container>
</Section>
```

---

## 4. Règles à ne pas enfreindre

1. Aucune couleur verte, mauve, violette, bleue ou cyan. Aucun dégradé, aucun néon, aucun halo.
2. Le laiton et le cuivre restent des accents : jamais un fond de bouton, jamais deux accents
   dans une même section.
3. Pas de bento grid, pas de dizaines de petites cartes, pas d'icône dans chaque phrase.
4. Pas de grosse ombre, pas de rayon supérieur à `--radius-sm` (4px), pas de glassmorphism.
5. Pas de dashboard fictif, pas de mockup flottant, pas d'illustration 3D.
6. Un seul `<h1>` par page ; la hiérarchie de titres ne saute jamais un niveau.
7. Aucun texte indispensable visible uniquement au survol.
8. `prefers-reduced-motion` neutralise toutes les transitions, sans perte d'information.
9. Aucun témoignage, chiffre, logo client, tarif ou disponibilité inventé.
10. Aucune nouvelle dépendance sans justification écrite dans `docs/04-plan-implementation.md`.

---

## 4bis. Structure de la page d'accueil

Sept temps éditoriaux, dans cet ordre. L'alternance des surfaces porte le rythme : ivoire par
défaut, sable pour les respirations, **une seule section charbon** — la réalisation réelle.

| # | Section | Surface | Composants |
|---|---|---|---|
| 1 | Hero | page sur vidéo | `Eyebrow`, calendrier, WhatsApp et lien vers la réalisation |
| 2 | Transformation | page | `SectionHeading`, résultats recherchés ×3 |
| 3 | Réalisation | **inverse** | preuve factuelle + `InteractiveSitePreview` unique |
| 4 | Entreprises | sunken | trois familles de services, sans déplacement au survol |
| 5 | Méthode | page | `MethodStep` ×4 |
| 6 | Clôture | page | calendrier, WhatsApp et lien texte vers `/estimation` |

Règles de la page :

- **Un seul `<h1>`** : la promesse. Toutes les sections portent un `<h2>`.
- **Un seul appel à l'action principal** dans le hero : « Réserver un échange ».
- Le diagnostic est secondaire et mène à `/diagnostic` ; le lien tertiaire pointe vers la
  réalisation réelle. WhatsApp direct reste un canal séparé.
- WhatsApp reste disponible dans l'en-tête et le bouton fixe ; le calendrier apparaît dans
  le hero et la clôture.
- L'estimation vit uniquement à `/estimation` et n'est jamais rendue dans l'accueil.
- Le Journal reste sur sa route.

---

## 4ter. Compositions des pages secondaires

Chaque page a une composition distincte, mais consomme le même système. Aucune ne réutilise
la mise en page de l'accueil.

| Page | Composition | Surfaces |
|---|---|---|
| `/methode` | Ouverture courte + grille unique des quatre temps, puis adaptation métier et principe d'outillage réunis | page → raised → sunken |
| `/a-propos` | Ouverture en largeur de lecture, manifeste numéroté en trois colonnes larges, phrase manifeste centrée, bande « ce que nous ne faisons pas » en négatif | page → raised → page → sunken → **inverse** → raised |
| `/diagnostic` | Introduction autonome, cinq étapes conditionnelles, vérification éditable et confirmation après envoi serveur | page → sunken → inverse → page |
| `/contact` | Deux colonnes serrées : orientation et coordonnées à gauche, formulaire court à droite. Page volontairement courte, sans bloc de clôture | page |
| `/realisations` | Une entrée par bande pleine largeur, numérotée, `CasePlate` + descriptif | page, clôture inverse |
| `/realisations/sw-car-cleaning` | Hero en diptyque avec panneau de projet, contexte à deux colonnes, objectifs en séquence numérotée, travail réalisé en négatif sur trois colonnes, galerie conditionnelle, enseignement | page → raised → page → **inverse** → sunken (si galerie) → raised → page |
| `/blog` | Ouverture courte, une éditoriale, puis grille des articles précédents et orientation vers le diagnostic | page → raised → page |
| `/blog/[slug]` | Ouverture en largeur de lecture, contenu séquencé, repère de publication et appel à l'action discret | page → raised → page |

Note : `/contact` est la seule page sans `CallToAction` final. Y placer un appel à l'action
vers le diagnostic juste sous un formulaire de contact serait redondant ; l'orientation vers
le diagnostic est faite en toutes lettres en haut de page.

---

## 5. Composants volontairement absents

- **`Card` générique** — remplacée par `EditorialCard`, `OutcomeCard` et `CaseStudyCard`, qui
  portent chacun une intention. Une carte générique pousse à empiler des vignettes.
- **`Badge` / `Tag` / `Pill`** — aucun usage réel : rien à étiqueter tant qu'il n'y a ni
  catégories, ni tarifs, ni statuts.
- **`Modal` / `Tooltip`** — aucun besoin en V1, et un tooltip cacherait du texte derrière un
  survol.
- **`Carousel`** — proscrit par la direction artistique.
- **`Stat` / `Counter`** — il n'existe aucun chiffre vérifié à afficher.
- **`Grid` générique** — les compositions sont spécifiques ; une grille abstraite ferait
  perdre le contrôle éditorial.
