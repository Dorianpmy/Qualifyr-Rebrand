# CLAUDE.md — Qualifyr Agence

Résumé condensé d'`AGENTS.md`, qui fait autorité en cas de doute ou de conflit.

Domaine : `https://qualifyragence.com` · reconstruction complète depuis une page blanche.
Branche de travail : `feature/qualifyr-rebrand-v1`.

## Avant toute modification

Lire dans l'ordre `docs/01-positionnement.md` à `docs/08-qa-responsive-accessibilite.md`.
Aucune décision de contenu/structure/design contre ces docs : on met à jour le doc **d'abord**, puis on implémente.

## Ne pas toucher

- `.git` (pas de suppression/reset), DNS, ancien déploiement, ancien dépôt.
- Pas d'opération Git forcée (`push --force`, `reset --hard`, `clean -fdx`) sans demande explicite.

## Positionnement

Qualifyr = site + parcours (trouvé, compris, choisi, réservé, avis, fidélisation) pour une verticale unique : **nettoyage automobile mobile/detailing**, plus l'offre élargie de conception de sites/apps/SaaS sur mesure. Ce n'est **ni** une agence web généraliste, ni IA, ni no-code, ni un CRM/ERP, ni une agence pub, ni généraliste tous artisans. Pas de page « Solutions » listant d'autres métiers. La verticale conciergerie, testée du 27 juillet au 24 août 2026, est abandonnée définitivement.

## Vocabulaire interdit (copy, meta, alt, JSON-LD, OG)

`IA`, `intelligence artificielle`, `CRM`, `ERP`, `automatisation`, `no-code`, `transformation digitale`, `présence en ligne`, `solution innovante`, `technologie révolutionnaire`, `écosystème`, `tunnel de vente`, `growth hacking`, `agence 360`, `acquisition omnicanale`. Toléré uniquement en commentaires techniques / doc interne.

## Palette interdite

Vert, mauve, violet, bleu électrique, cyan, dégradé bleu-violet, néon, halos lumineux. Palette chaude éditoriale : ivoire, blanc chaud, charbon, brun profond, sable, laiton mat, cuivre/terre cuite en accent rare (valeurs dans `docs/03-direction-artistique.md`). Exception formulaires : terre cuite (erreur) / brun profond (succès), jamais rouge/vert vifs standards.

## Faux contenus : interdits

Pas de témoignages, stats, chiffres, logos clients, récompenses, partenaires, tarifs, disponibilité limitée, fausses fonctionnalités inventés. `SW Carcleaning` = réalisation réelle citable, sans chiffre inventé. Contenu manquant → placeholder `TODO_CONTENU_REEL` signalé, ou section retirée — jamais comblée.

## Direction artistique

Luxueux, premium, éditorial, lumineux, chaleureux, précis, minimaliste, mature, mémorable. Ni startup IA, ni template SaaS, ni no-code, ni app financière, ni site auto agressif/tuning, ni copie de Patissio.

## Qualité — non négociable

- **A11y** : WCAG 2.2 AA, contraste ≥ 4.5:1 (3:1 large/UI), HTML sémantique, un seul `<h1>`, clavier complet, focus visible, `alt` pertinent, labels/erreurs de formulaire non liées à la seule couleur, cibles tactiles ≥ 44×44px, `prefers-reduced-motion`, zoom 200% sans casse.
- **Mobile-first** dès 360px, jamais de scroll horizontal.
- **Perf** : Lighthouse mobile Perf ≥ 95 / A11y 100 / BP 100 / SEO 100. LCP < 2.0s, CLS < 0.05, INP < 200ms. JS minimal, images optimisées (`loading="lazy"`, `fetchpriority="high"` sur LCP), polices auto-hébergées avec `font-display: swap`. Aucun script tiers/tracker non justifié.
- **Contenu** : français, vouvoiement, phrases courtes, pas de superlatif non démontrable, un message par section.

## Hermès — prospection sortante

Hermès envoie des e-mails **à des entreprises tierces, au nom d'un client
abonné**, sans validation humaine. C'est la seule partie du projet dont une
erreur ne produit pas un bug d'affichage mais une plainte et un domaine
d'expédition brûlé — pour tous les clients à la fois.

**Avant d'y toucher, lire `docs/14-hermes-prompt-claude-code.md`**, en
particulier la section « ce qu'il ne faut pas casser ». Les cinq mécanismes
qu'elle liste ne sont pas des préférences de style :

1. La liste de suppression (`hermes_suppressions`) est **globale**, tous
   comptes confondus. Jamais restreinte à un expéditeur.
2. Toute vérification impossible ⇒ **rien ne part**. Quota illisible vaut zéro,
   liste injoignable vaut adresse interdite.
3. `HERMES_FROM_EMAIL` reste **distinct** de `BOOKING_FROM_EMAIL`. Aucun repli.
4. Le pied de page des messages (identité, origine des données, lien
   d'opposition) n'est **jamais modifiable** par le client.
5. Les prospects sont filtrés par le périmètre du compte, via `agent_zones`.

Hermès n'est **pas un agent IA**. Depuis le 24/08/2026, un modèle de langage
(Mistral) classe les entreprises recensées par pertinence pour l'activité du
professionnel (`lib/agent/relevance.ts`) — **c'est la seule chose qu'il
fait** : il ne rédige aucun message, ne décide d'aucun envoi. « Les
entreprises sont classées par pertinence à l'aide d'un modèle de langage »
est une description honnête ; « agent IA » / « intelligence artificielle »
reste interdit, et le reste précisément parce que ce serait une promesse que
le code ne tient pas — `tests/no-false-promises.test.ts` l'interdit toujours.

## Fin de phase — obligatoire, dans l'ordre, jusqu'au vert

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Puis avant mise en ligne : audit Lighthouse mobile, vérif contrastes, passe clavier, recherche mots/couleurs interdits. Jamais de commit avec build cassé.

## Secrets

Aucune clé/token/mot de passe dans le dépôt. `.env.example` sans valeur ; vraies valeurs dans `.env.local` (gitignored) ou l'hébergeur. Jamais de préfixe `NEXT_PUBLIC_` sur une variable secrète. Config absente = échec explicite, jamais un faux succès.

## Règles de travail

Une phase = une intention = des commits lisibles. Ne pas anticiper les phases suivantes. Pas de dépendance hors de `docs/04-plan-implementation.md` sans justification. Pas de lib de composants prête à l'emploi imposant une esthétique générique. Tout nouveau composant documenté dans `docs/05-composants.md`. Signaler un blocage plutôt que le contourner.
