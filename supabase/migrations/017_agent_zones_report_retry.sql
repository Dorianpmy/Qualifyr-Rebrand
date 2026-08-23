-- ---------------------------------------------------------------------------
-- agent_zones — distinguer « rapport pas encore envoyé » de « analyse pas
-- encore faite », et plafonner les reprises dans le temps, pas en nombre de
-- passages.
--
-- Avant cette migration, un envoi de rapport qui échouait (BOOKING_FROM_EMAIL
-- absente, RESEND_API_KEY absente, erreur Resend) marquait quand même la
-- zone `termine` : l'analyse avait bien trouvé des établissements, mais
-- personne ne recevait jamais rien, et rien ne retentait jamais l'envoi.
--
-- `rapport_en_attente` : l'analyse Sirene a abouti — `agent_prospects` et
-- `segments` sont déjà en base, elle n'est jamais rejouée, elle coûte du
-- quota — et seul l'envoi reste à reprendre.
--
-- `report_first_failed_at` porte le plafond de reprise (24h, voir
-- `lib/agent/report-retry.ts`). Un compteur de tentatives ne suffit pas :
-- `/api/agent/process` ne traite qu'un lot borné de renvois par passage, donc
-- le nombre de tentatives d'une zone donnée dépend de la longueur de la file
-- de renvois à cet instant, pas d'une cadence fixe — dix zones en attente
-- auraient multiplié par dix le délai réel avant abandon avec un compteur.
-- Une horloge ne dépend d'aucun des deux, et reste vraie si la fréquence du
-- cron ou la taille des lots changent un jour.
--
-- `report_attempts` est conservé, mais **pour le diagnostic seulement** —
-- combien de fois cette zone a été retentée. Il ne pilote plus aucune
-- décision : ne pas le rebrancher sur le plafond, c'est précisément ce que
-- cette migration corrige.
--
-- Idempotente : `if not exists` / `drop ... if exists` partout, exécutable
-- deux fois sans effet.
-- ---------------------------------------------------------------------------

-- Une contrainte `check` se remplace par un simple `drop`/`add` (même patron
-- que la migration 015).
alter table public.agent_zones
  drop constraint if exists agent_zones_status_check;
alter table public.agent_zones
  add constraint agent_zones_status_check
  check (status in ('en_attente', 'en_cours', 'rapport_en_attente', 'termine', 'echec'));

alter table public.agent_zones
  add column if not exists report_attempts integer not null default 0;

alter table public.agent_zones
  add column if not exists report_first_failed_at timestamptz;

-- La file de reprise du rapport : les échecs les plus anciens d'abord.
-- Symétrique à agent_zones_pending_idx (migration 010), qui sert la file
-- d'analyse.
create index if not exists agent_zones_report_pending_idx
  on public.agent_zones (report_first_failed_at)
  where status = 'rapport_en_attente';
