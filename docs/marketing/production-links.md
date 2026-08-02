# Liens commerciaux de production

Le domaine est centralisé dans `src/content/site.ts`. Ces liens courts redirigent
temporairement vers une destination interne en ajoutant uniquement les paramètres UTM
documentés ci-dessous.

| Usage | Lien court | Destination | Source | Support | Campagne |
|---|---|---|---|---|---|
| Bio TikTok | `https://qualifyragence.com/go/tiktok` | `/diagnostic` | `tiktok` | `organic` | `profil` |
| Bio Instagram | `https://qualifyragence.com/go/instagram` | `/diagnostic` | `instagram` | `organic` | `profil` |
| Profil LinkedIn | `https://qualifyragence.com/go/linkedin` | `/diagnostic` | `linkedin` | `organic` | `profil` |
| Prospection nettoyage automobile | `https://qualifyragence.com/go/prospection-nettoyage` | `/nettoyage-automobile` | `prospection` | `dm` | `nettoyage_auto` |
| Prospection conciergerie | `https://qualifyragence.com/go/prospection-conciergerie` | `/conciergerie` | `prospection` | `dm` | `conciergerie` |
| Preuve SW Car Cleaning | `https://qualifyragence.com/go/preuve-sw` | `/realisations/sw-car-cleaning` | `prospection` | `dm` | `preuve_sw` |
| Partenaires et recommandations | `https://qualifyragence.com/go/partenaire` | `/diagnostic` | `partenaire` | `referral` | `partenaires` |

## Utilisation recommandée

- Utiliser le lien de bio correspondant au réseau, sans rajouter d'UTM manuellement.
- Envoyer le lien métier adapté dans les messages de prospection ; joindre le lien de preuve
  lorsque SW Car Cleaning répond à l'objection du prospect.
- Réserver le lien partenaire aux recommandations réelles.
- Ne jamais ajouter d'e-mail, de téléphone, de nom ou de texte libre dans les UTM.
- Contrôler la sortie de référence avant une campagne avec `npm run marketing:links`.
