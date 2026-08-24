# Système commercial Qualifyr

Ce dossier décrit un système simple : attirer vers une page spécialisée, apporter une preuve réelle, puis orienter vers le diagnostic, l’estimation, WhatsApp ou le calendrier selon la maturité du prospect.

## Parcours public

- Nettoyage automobile : `/nettoyage-automobile` → diagnostic prérempli.
- Preuve : `/realisations/sw-car-cleaning` → diagnostic ou estimation.
- Qualification : `/diagnostic`.
- Orientation budgétaire : `/estimation` (indicative, jamais présentée comme un devis).

## Liens de campagne

Exécuter `npm run marketing:links`. Les liens courts `/go/*` sont une liste blanche interne : aucune destination libre n’est acceptée. Les paramètres UTM et le domaine référent sont conservés dans `sessionStorage` pendant la session, sans cookie, sans donnée personnelle et sans envoi à un tiers.

Liens canoniques à utiliser dans les profils et les messages :

| Usage | Lien court | Destination suivie |
|---|---|---|
| Profil Instagram | `https://qualifyragence.com/go/instagram` | Diagnostic · `instagram / organic / profil` |
| Profil TikTok | `https://qualifyragence.com/go/tiktok` | Diagnostic · `tiktok / organic / profil` |
| Profil LinkedIn | `https://qualifyragence.com/go/linkedin` | Diagnostic · `linkedin / organic / profil` |
| Prospection nettoyage automobile | `https://qualifyragence.com/go/prospection-nettoyage` | Page métier · `prospection / dm / nettoyage_auto` |
| Preuve SW Car Cleaning | `https://qualifyragence.com/go/preuve-sw` | Étude de cas · `prospection / dm / preuve_sw` |
| Partenaire ou prescripteur | `https://qualifyragence.com/go/partenaire` | Diagnostic · `partenaire / referral / partenaires` |

Ne jamais construire une variante libre de `/go/*` : tout nouveau lien doit d’abord être ajouté à la liste blanche du code, testé, puis documenté ici.

## Routine hebdomadaire

1. Publier deux contenus utiles issus du backlog.
2. Contacter cinq professionnels du nettoyage par jour ouvré.
3. Envoyer la page spécialisée, puis la preuve SW uniquement si elle répond à la situation.
4. Suivre les conversations qualifiées dans le modèle CSV.
5. Revoir chaque vendredi les sources qui déclenchent de vraies conversations.

## Mesure

L’application émet des événements typés localement (`qualifyr:analytics`) et les pousse dans `dataLayer` uniquement si un outil compatible existe déjà. Aucun fournisseur, cookie ou identifiant utilisateur n’est ajouté par ce système.
