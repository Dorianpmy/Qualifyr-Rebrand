-- Migration 008 : injection de réservations de démonstration pour le detailer 'demo'
-- Nécessaire pour le test du tunnel de réservation et du dashboard.
-- Les 4 réservations couvrent les statuts : confirme, en_attente_paiement, realise.
-- Les créneaux sont espacés pour éviter les conflits d'exclusion (exclusion constraint
-- detailer_bookings_no_overlap sur detailer_id, slot).

-- Nettoyage préalable : supprimer les anciennes démos si elles existent.
delete from detailer_bookings
where detailer_id in (select id from detailers where slug = 'demo');

insert into detailer_bookings (
  detailer_id, status, email, phone,
  vehicle_size, vehicle_model, plate,
  scope, soiling, location_mode, postal_code,
  quoted_price, quoted_minutes, deposit_amount,
  slot, hold_expires_at
)
select d.id, v.status, v.email, v.phone,
       v.size, v.model, v.plate,
       v.scope, v.soiling, v.loc, v.cp,
       v.price, v.minutes, round(v.price * 0.3),
       -- Créneaux disjoints : chaque départ + durée ne chevauche pas le suivant.
       -- 1) 3h  → [3h, 7h]   (240 min)
       -- 2) 7h  → [7h, 9h]   (120 min)
       -- 3) 9h  → [9h, 10.5h](90 min)
       -- 4) 11h → [11h, 16h] (300 min)
       tstzrange(now() + v.startd, now() + v.startd + (v.minutes || ' minutes')::interval),
       v.hold
from detailers d
cross join (values
  ('confirme',            'marc.leroy@gmail.com',   '06 12 34 56 78', 'suv',        'Tiguan',   'FT-482-QL', 'complet',   'poils_taches', 'domicile', '69003', 289, 240, null::timestamptz, interval '3 hours'),
  ('en_attente_paiement', 'sophie.bernard@sfr.fr',  '07 88 21 05 33', 'citadine',   'Clio V',   'GK-119-BR', 'interieur', 'tres_sale',    'atelier',  null,   129, 120, now() + interval '8 minutes', interval '7 hours'),
  ('confirme',            'a.diallo@outlook.fr',    '06 45 90 12 76', 'berline',    'Passat',   'DR-702-ZM', 'exterieur', 'normal',       'domicile', '69007', 159, 90,  null,                       interval '9 hours'),
  ('realise',             'contact@transports-py.fr','04 78 55 21 09','utilitaire', 'Jumpy',    'EV-330-TC', 'complet',   'tres_sale',    'atelier',  null,   349, 300, null,                       interval '11 hours')
) as v(status, email, phone, size, model, plate, scope, soiling, loc, cp, price, minutes, hold, startd)
where d.slug = 'demo';
