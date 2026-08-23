-- ---------------------------------------------------------------------------
-- hermes_messages — réserver avant d'envoyer.
--
-- **Le défaut corrigé.** La ligne n'était écrite qu'après le retour de
-- `resend.emails.send` (`sent` en cas de succès, `failed` en cas d'erreur
-- propre). Si le processus était tué entre l'envoi confirmé par Resend et
-- cette écriture, aucune ligne n'existait : `remainingQuota` (qui compte les
-- lignes de `hermes_messages` sur 24 h) sous-comptait la journée, rendant du
-- quota qui n'aurait pas dû l'être, et `agent_prospects.contacted_at` restait
-- vide, laissant le prospect à nouveau candidat au passage suivant — un
-- second message de démarchage vers une entreprise qui avait déjà reçu le
-- premier. C'est le scénario qui déclenche un signalement, et un
-- signalement porte sur le domaine d'expédition, donc sur tous les comptes.
--
-- **La correction : une ligne `pending` insérée avant l'envoi, jamais
-- après.** L'index unique `(campaign_id, prospect_id)` (migration 016)
-- devient alors un verrou atomique plutôt qu'une garantie a posteriori : un
-- conflit d'insertion signifie que ce prospect est déjà réservé par un
-- passage précédent ou concurrent, et l'envoi n'a pas lieu.
--
-- **`sent_at` change de sens : « instant de la tentative », plus « instant
-- de l'envoi ».** Il reste `not null default now()`, posé une fois à la
-- réservation et jamais retouché à la finalisation (`sent`/`failed`).
-- `remainingQuota` (`outreach.ts`) continue de filtrer dessus sans aucune
-- modification : une tentative compte pour le quota dès sa réservation,
-- qu'elle aboutisse ou non. Ne pas renommer la colonne — le webhook
-- (`outreach/webhook/route.ts`, recherche par `provider_id`) et l'index
-- `hermes_messages_campaign_day_idx` s'en servent tels quels.
--
-- **Une ligne `pending` n'est jamais reprise automatiquement.** Elle
-- signifie « on ne sait pas si le message est parti » — la rejouer
-- réintroduirait exactement le double envoi que cette migration ferme. Elle
-- reste `pending` pour toujours ; le prospect correspondant est perdu, pas
-- resollicité. C'est le bon état : voir `src/app/api/agent/outreach/route.ts`.
--
-- **Le défaut de `status` passe de `'sent'` à `'pending'`.** Un défaut
-- `'sent'` sur une table qui sert de preuve d'envoi est un piège en soi :
-- l'insertion la plus distraite doit produire l'état le plus prudent, pas le
-- plus optimiste.
--
-- Idempotente : `drop constraint if exists` / `add constraint`, même patron
-- que la migration 017 (et 015, qui l'a introduit dans ce dépôt).
-- ---------------------------------------------------------------------------

alter table public.hermes_messages
  drop constraint if exists hermes_messages_status_known;
alter table public.hermes_messages
  add constraint hermes_messages_status_known
  check (status in ('pending', 'sent', 'failed', 'bounced', 'complained'));

alter table public.hermes_messages
  alter column status set default 'pending';
