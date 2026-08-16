'use client';

import { useEffect, useRef, useState } from 'react';
import {
  distanceKm,
  googleMapEmbedUrl,
  googleMapsLink,
  type Point,
} from '@/lib/detailing/geo';
import styles from './AddressPicker.module.css';

/**
 * Saisie de l'adresse d'intervention, avec vérification sur carte.
 *
 * **Ce qu'elle remplace.** Le client saisissait un code postal puis
 * **estimait lui-même** la distance jusqu'au professionnel — la valeur qui
 * détermine les frais de déplacement. Sous-estimée, le professionnel roule à
 * perte. Surestimée, la réservation est perdue pour un montant qui n'existe
 * pas. Et personne ne connaît la distance à vol d'oiseau qui le sépare d'un
 * atelier dont il ignore l'adresse.
 *
 * La carte n'est pas un ornement : c'est la seule façon pour le client de
 * vérifier que le point retenu est bien sa rue, avant qu'un professionnel ne
 * s'y déplace.
 */

export type SelectedAddress = {
  readonly label: string;
  readonly lat: number;
  readonly lon: number;
  readonly postalCode: string | null;
  readonly distanceKm: number | null;
};

type Suggestion = {
  label: string;
  lat: number;
  lon: number;
  postalCode: string | null;
};

export function AddressPicker({
  country,
  base,
  value,
  onChange,
  accessNote,
  onAccessNoteChange,
}: {
  readonly country: string;
  /** Point de départ du professionnel ; sans lui, aucune distance calculable. */
  readonly base: Point | null;
  readonly value: SelectedAddress | null;
  readonly onChange: (address: SelectedAddress | null) => void;
  readonly accessNote: string;
  readonly onAccessNoteChange: (note: string) => void;
}) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [suggestions, setSuggestions] = useState<readonly Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [touched, setTouched] = useState(false);

  // Un appel par frappe saturerait le service de géocodage et le ferait
  // bloquer. On attend que la saisie se stabilise.
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!touched) return;

    // Une suggestion déjà retenue ne doit pas relancer une recherche : le
    // champ contient alors l'adresse complète, et la liste se rouvrirait
    // sous le doigt du client au moment où il continue.
    if (value && query === value.label) return;

    // Tout passe par le minuteur, y compris le vidage de la liste : appeler
    // `setState` directement dans le corps d'un effet déclenche une seconde
    // passe de rendu à chaque frappe, ce que React signale comme un défaut de
    // performance — et sur un champ à saisie assistée, c'est une passe par
    // caractère tapé.
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (query.trim().length < 3) {
        setSuggestions([]);
        return;
      }
      setSearching(true);
      fetch(
        `/api/detailing/geocode?q=${encodeURIComponent(query)}&country=${encodeURIComponent(country)}`,
      )
        .then((response) => response.json())
        .then((data: { results?: Suggestion[] }) => setSuggestions(data.results ?? []))
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false));
    }, 400);

    return () => window.clearTimeout(debounceRef.current);
  }, [query, country, touched, value]);

  function select(suggestion: Suggestion) {
    const point = { lat: suggestion.lat, lon: suggestion.lon };
    onChange({
      label: suggestion.label,
      lat: suggestion.lat,
      lon: suggestion.lon,
      postalCode: suggestion.postalCode,
      distanceKm: base ? Math.round(distanceKm(base, point) * 10) / 10 : null,
    });
    setQuery(suggestion.label);
    setSuggestions([]);
  }

  return (
    <div className={styles.picker}>
      <label className={styles.label} htmlFor="address">
        Adresse où se trouvera le véhicule
      </label>
      <p className={styles.help}>
        Commencez à taper, puis choisissez dans la liste. La distance et les frais de déplacement
        se calculent tout seuls — vous n’avez rien à estimer.
      </p>

      <div className={styles.inputWrap}>
        <input
          id="address"
          name="address"
          type="text"
          autoComplete="street-address"
          className={styles.input}
          value={query}
          placeholder="12 rue de la République, Lyon"
          onChange={(event) => {
            setTouched(true);
            setQuery(event.target.value);
            // Modifier le texte invalide le point retenu : sans ça, le client
            // corrige son adresse et réserve sur l'ancienne position.
            if (value) onChange(null);
          }}
        />
        {searching ? <span className={styles.searching}>Recherche…</span> : null}
      </div>

      {suggestions.length > 0 ? (
        <ul className={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.lat},${suggestion.lon}`}>
              <button type="button" onClick={() => select(suggestion)}>
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {touched && !value && query.trim().length >= 3 && !searching && suggestions.length === 0 ? (
        <div className={styles.fallback}>
          <p className={styles.noResult}>
            Aucune adresse trouvée pour « {query.trim()} ». Essayez avec le numéro, le nom de rue,
            puis la ville.
          </p>
          {/*
           * Sortie de secours. Le service d'adresses est un tiers : il tombe,
           * il ignore les lieux-dits, il ne connaît pas les rues neuves. Sans
           * cette porte, un client dont l'adresse n'est pas reconnue ne peut
           * pas réserver du tout — on perd la vente pour une base de données
           * incomplète.
           *
           * La contrepartie est annoncée : sans point sur la carte, la
           * distance n'est pas calculable et le professionnel rappellera.
           */}
          <button
            type="button"
            className={styles.fallbackButton}
            onClick={() =>
              onChange({
                label: query.trim(),
                lat: 0,
                lon: 0,
                postalCode: null,
                distanceKm: null,
              })
            }
          >
            Utiliser cette adresse quand même
          </button>
        </div>
      ) : null}

      {/* Emplacement de la carte, visible **avant** toute sélection.
          Auparavant le bloc n'existait pas tant qu'aucune adresse n'était
          retenue : le client ne pouvait pas deviner qu'une carte apparaîtrait,
          et croyait la fonction absente. Un cadre vide qui annonce ce qui va
          venir vaut mieux qu'une surprise. */}
      {!value ? (
        <div className={styles.mapPlaceholder}>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={styles.mapPlaceholderIcon}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <p>Choisissez une adresse dans la liste : la carte s’affichera ici pour vérification.</p>
        </div>
      ) : null}

      {value ? (
        <div className={styles.confirmed}>
          {/* La carte confirme visuellement ce que le texte affirme. Un client
              qui a mal orthographié sa rue ne relira pas le libellé — il verra
              en revanche tout de suite qu'on lui montre un autre quartier. */}
          {/* Une adresse saisie à la main n'a pas de coordonnées : afficher une
              carte centrée sur 0,0 montrerait le golfe de Guinée. */}
          <div className={value.lat === 0 && value.lon === 0 ? styles.mapPlaceholder : styles.mapFrame}>
            {value.lat === 0 && value.lon === 0 ? (
              <p>
                Adresse saisie à la main : elle n’a pas pu être placée sur la carte. Le
                professionnel vérifiera le trajet et vous confirmera les frais de déplacement.
              </p>
            ) : (
              <iframe
                title="Emplacement du véhicule sur la carte"
                src={googleMapEmbedUrl({ lat: value.lat, lon: value.lon })}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className={styles.map}
              />
            )}
          </div>

          <div className={styles.confirmedMeta}>
            <p className={styles.confirmedAddress}>{value.label}</p>
            {value.distanceKm !== null ? (
              <p className={styles.confirmedDistance}>
                À {value.distanceKm.toLocaleString('fr-FR')} km à vol d’oiseau du professionnel.
              </p>
            ) : null}
            {/* Sortie vers l'application Maps du téléphone : c'est là que le
                client vérifie vraiment, en zoomant sur son immeuble. */}
            {value.lat !== 0 || value.lon !== 0 ? (
              <a
                className={styles.mapLink}
                href={googleMapsLink({ lat: value.lat, lon: value.lon })}
                target="_blank"
                rel="noreferrer"
              >
                Vérifier dans Google Maps
              </a>
            ) : null}
          </div>

          <label className={styles.noteField}>
            <span className={styles.noteLabel}>Précisions d’accès (facultatif)</span>
            <input
              type="text"
              value={accessNote}
              placeholder="Parking souterrain, digicode 12A34, place n° 47"
              onChange={(event) => onAccessNoteChange(event.target.value)}
            />
          </label>
          <p className={styles.help}>
            Un parking en sous-sol, un portail ou une place numérotée font gagner dix minutes au
            professionnel — et évitent un appel le jour même.
          </p>
        </div>
      ) : null}
    </div>
  );
}
