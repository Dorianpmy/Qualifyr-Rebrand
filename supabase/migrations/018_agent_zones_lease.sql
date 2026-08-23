-- ---------------------------------------------------------------------------
-- agent_zones — un bail sur `en_cours`, pour survivre à un processus tué.
--
-- **Le défaut.** `/api/agent/process` marque une zone `en_cours` avant de la
-- traiter, pour qu'un second passage qui chevaucherait le premier ne la
-- reprenne pas. Mais rien ne relit jamais `en_cours` : ni la file d'analyse
-- (`status = 'en_attente'`), ni la file de renvoi (`status =
-- 'rapport_en_attente'`), ni aucune autre route. Si le processus est tué en
-- plein traitement — dépassement des 60 s de `maxDuration`, redéploiement,
-- incident de la plateforme — la zone reste `en_cours` pour toujours.
-- `agent_zones.ts:93` traite `en_cours` comme une demande déjà en cours : un
-- visiteur qui redemande la même zone se voit répondre « déjà demandée », sur
-- une zone morte.
--
-- **`locked_at` porte un bail de dix minutes** (voir `MAX_LOCK_MS` dans
-- `src/app/api/agent/process/route.ts`), largement au-dessus des 60 s de
-- `maxDuration` — aucun risque de reprendre une requête réellement encore en
-- cours — et largement sous les quinze minutes du cron suivant, pour qu'une
-- zone tuée soit reprise au passage d'après plutôt qu'un tour plus tard.
--
-- **Les renvois de rapport ne transitent plus par `en_cours` du tout.** Ils
-- restent `rapport_en_attente` et gagnent leur propre `locked_at` : un bail
-- générique sur `en_cours` ne dirait pas de quelle file une zone récupérée
-- venait, et la retraiter comme une analyse relancerait `scanZone()` sur une
-- zone déjà rapportée. En gardant le statut inchangé pendant le renvoi,
-- aucune ambiguïté n'est possible à la reprise.
--
-- Idempotente : `if not exists` partout, exécutable deux fois sans effet.
-- ---------------------------------------------------------------------------

alter table public.agent_zones
  add column if not exists locked_at timestamptz;

-- Les deux files de reprise ont désormais besoin de filtrer sur `locked_at`
-- en plus du statut ; les index précédents (créés sur `created_at` /
-- `report_first_failed_at` seuls) restent utiles pour le tri, celui-ci sert
-- spécifiquement la relecture des baux expirés.
create index if not exists agent_zones_locked_idx
  on public.agent_zones (locked_at)
  where status in ('en_cours', 'rapport_en_attente');
