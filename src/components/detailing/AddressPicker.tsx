'use client';

import { useEffect, useRef, useState } from 'react';
import { distanceKm, osmEmbedUrl, type Point } from '@/lib/detailing/geo';
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
        <p className={styles.noResult}>
          Aucune adresse trouvée. Essayez avec le numéro et le nom de rue, puis la ville.
        </p>
      ) : null}

      {value ? (
        <div className={styles.confirmed}>
          <div className={styles.mapFrame}>
            <iframe
              title="Emplacement du véhicule"
              src={osmEmbedUrl({ lat: value.lat, lon: value.lon })}
              loading="lazy"
              className={styles.map}
            />
          </div>

          <div className={styles.confirmedMeta}>
            <p className={styles.confirmedAddress}>{value.label}</p>
            {value.distanceKm !== null ? (
              <p className={styles.confirmedDistance}>
                À {value.distanceKm.toLocaleString('fr-FR')} km à vol d’oiseau du professionnel.
              </p>
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
