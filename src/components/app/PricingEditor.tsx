'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { optionCopy, scopeCopy, soilingCopy, vehicleSizeCopy } from '@/components/detailing/content';
import { formatMoney, profileFor } from '@/lib/detailing/locale';
import type {
  DetailerSettings,
  OptionRow,
  PriceCell,
  PricingCatalogue,
  ScopeLabelRow,
  SoilingRow,
} from '@/lib/detailing/pricing-admin';
import { optionKeys, scopes, vehicleSizes } from '@/lib/detailing/types';
import styles from '@/app/app/app.module.css';
import editor from './PricingEditor.module.css';

/**
 * Éditeur de catalogue.
 *
 * **Ce qu'il remplace.** Ajouter un professionnel exigeait d'écrire à la main
 * quinze lignes de tarifs, cinq options et trois multiplicateurs en SQL. Tant
 * que c'était vrai, chaque nouveau client coûtait une intervention technique —
 * ce qui rend l'outil invendable au-delà de quelques comptes.
 *
 * **Un seul bouton d'enregistrement.** Une sauvegarde automatique à chaque
 * frappe publierait des prix intermédiaires : quelqu'un qui remplace 120 par
 * 180 passe par « 1 », puis « 18 ». Un client réservant à cet instant
 * paierait 1 €.
 */

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function PricingEditor({ catalogue }: { catalogue: PricingCatalogue }) {
  const router = useRouter();

  const [prices, setPrices] = useState<readonly PriceCell[]>(catalogue.prices);
  const [scopeLabels, setScopeLabels] = useState<readonly ScopeLabelRow[]>(catalogue.scopeLabels);
  const [options, setOptions] = useState<readonly OptionRow[]>(catalogue.options);
  const [soiling, setSoiling] = useState<readonly SoilingRow[]>(catalogue.soiling);
  const [settings, setSettings] = useState<DetailerSettings>(catalogue.settings);

  const [baseQuery, setBaseQuery] = useState(catalogue.settings.baseAddress ?? '');
  const [locating, setLocating] = useState(false);
  const [baseError, setBaseError] = useState<string | null>(null);

  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const profile = profileFor(settings.country);

  function cellAt(scope: string, size: string): PriceCell | undefined {
    return prices.find((cell) => cell.scope === scope && cell.vehicleSize === size);
  }

  function updateCell(scope: string, size: string, field: 'basePrice' | 'baseMinutes', raw: string) {
    setPrices((current) =>
      current.map((cell) =>
        cell.scope === scope && cell.vehicleSize === size
          ? { ...cell, [field]: toNumberOrNull(raw) }
          : cell,
      ),
    );
    setState('idle');
  }

  function updateOption<K extends keyof OptionRow>(key: string, field: K, value: OptionRow[K]) {
    setOptions((current) =>
      current.map((option) => (option.key === key ? { ...option, [field]: value } : option)),
    );
    setState('idle');
  }

  /**
   * Géocode l'adresse de départ.
   *
   * Déclenché par un bouton et non à la frappe : c'est une adresse saisie une
   * fois pour toutes, pas un champ de recherche, et interroger le service de
   * géocodage à chaque lettre le ferait bloquer.
   */
  async function locateBase() {
    const query = baseQuery.trim();
    if (query.length < 3) return;

    setLocating(true);
    setBaseError(null);
    try {
      const response = await fetch(
        `/api/detailing/geocode?q=${encodeURIComponent(query)}&country=${settings.country}`,
      );
      const data = (await response.json()) as {
        results?: { label: string; lat: number; lon: number }[];
      };
      const first = data.results?.[0];
      if (!first) {
        setBaseError('Adresse introuvable. Ajoute le numéro et la ville.');
        return;
      }
      setSettings({
        ...settings,
        baseAddress: first.label,
        baseLatitude: first.lat,
        baseLongitude: first.lon,
      });
      setBaseQuery(first.label);
      setState('idle');
    } catch {
      setBaseError('Recherche indisponible. Réessaie dans un instant.');
    } finally {
      setLocating(false);
    }
  }

  async function save() {
    setState('saving');
    setMessage(null);
    try {
      const response = await fetch('/api/app/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices, scopeLabels, options, soiling, settings }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!data.ok) {
        setState('error');
        setMessage(data.message ?? 'Enregistrement impossible.');
        return;
      }
      setState('saved');
      router.refresh();
    } catch {
      setState('error');
      setMessage('Enregistrement impossible. Vérifie ta connexion.');
    }
  }

  // Le nombre de cases vides est l'information la plus utile de l'écran : une
  // case vide est une prestation que le tunnel refusera de chiffrer.
  const missing = prices.filter(
    (cell) => cell.basePrice === null || cell.baseMinutes === null,
  ).length;

  return (
    <div className={editor.editor}>
      <section className={editor.block}>
        <div className={editor.blockHead}>
          <h2 className={editor.blockTitle}>Grille tarifaire</h2>
          <p className={editor.blockHint}>
            Une ligne par formule. Donne-lui le nom sous lequel tu la vends — « Formule Éclat »,
            « Pack Restitution » — puis le prix de départ et la durée pour chaque taille de
            véhicule. Les options et l’état du véhicule s’ajoutent par-dessus au moment du devis.
            {missing > 0 ? (
              <>
                {' '}
                <strong className={editor.warn}>
                  {missing} case{missing > 1 ? 's' : ''} vide{missing > 1 ? 's' : ''}
                </strong>{' '}
                — ces combinaisons n’apparaîtront pas sur ta page publique.
              </>
            ) : null}
          </p>
        </div>

        {scopes.map((scope) => (
          <div key={scope} className={editor.scopeBlock}>
            <div className={editor.scopeHead}>
              <span className={editor.scopeBadge}>{scopeCopy[scope].label}</span>
              <label className={editor.nameField}>
                <span className={editor.nameLabel}>Nom vu par tes clients</span>
                <input
                  type="text"
                  value={scopeLabels.find((row) => row.scope === scope)?.label ?? ''}
                  placeholder={scopeCopy[scope].label}
                  onChange={(event) => {
                    const value = event.target.value;
                    setScopeLabels((current) =>
                      current.map((row) =>
                        row.scope === scope ? { ...row, label: value } : row,
                      ),
                    );
                    setState('idle');
                  }}
                />
              </label>
              <label className={editor.nameField}>
                <span className={editor.nameLabel}>Ce que ça comprend</span>
                <input
                  type="text"
                  value={scopeLabels.find((row) => row.scope === scope)?.description ?? ''}
                  placeholder={scopeCopy[scope].hint}
                  onChange={(event) => {
                    const value = event.target.value;
                    setScopeLabels((current) =>
                      current.map((row) =>
                        row.scope === scope ? { ...row, description: value || null } : row,
                      ),
                    );
                    setState('idle');
                  }}
                />
              </label>
            </div>

            <div className={editor.grid}>
              {vehicleSizes.map((size) => {
                const cell = cellAt(scope, size);
                const empty = !cell || cell.basePrice === null || cell.baseMinutes === null;

                return (
                  <div key={size} className={editor.cell} data-empty={empty}>
                    <span className={editor.cellLabel}>{vehicleSizeCopy[size].label}</span>
                    <div className={editor.cellInputs}>
                      <label className={editor.inline}>
                        <span className={editor.unit}>{profile.currency === 'CHF' ? 'CHF' : '€'}</span>
                        <input
                          type="number"
                          min={0}
                          step={5}
                          inputMode="decimal"
                          aria-label={`Prix ${scopeCopy[scope].label} ${vehicleSizeCopy[size].label}`}
                          value={cell?.basePrice ?? ''}
                          onChange={(event) =>
                            updateCell(scope, size, 'basePrice', event.target.value)
                          }
                        />
                      </label>
                      <label className={editor.inline}>
                        <span className={editor.unit}>min</span>
                        <input
                          type="number"
                          min={0}
                          step={15}
                          inputMode="numeric"
                          aria-label={`Durée ${scopeCopy[scope].label} ${vehicleSizeCopy[size].label}`}
                          value={cell?.baseMinutes ?? ''}
                          onChange={(event) =>
                            updateCell(scope, size, 'baseMinutes', event.target.value)
                          }
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className={editor.block}>
        <div className={editor.blockHead}>
          <h2 className={editor.blockTitle}>Options</h2>
          <p className={editor.blockHint}>
            Décochée, l’option disparaît entièrement du parcours client — elle n’est pas seulement
            masquée, elle ne peut plus figurer dans un devis.
          </p>
        </div>

        <div className={editor.optionList}>
          {optionKeys.map((key) => {
            const option = options.find((entry) => entry.key === key);
            if (!option) return null;

            return (
              <div key={key} className={editor.option} data-off={!option.enabled}>
                <label className={editor.optionToggle}>
                  <input
                    type="checkbox"
                    checked={option.enabled}
                    onChange={(event) => updateOption(key, 'enabled', event.target.checked)}
                  />
                  <span className={editor.optionName}>{optionCopy[key].label}</span>
                </label>

                <p className={editor.optionArgument}>{optionCopy[key].lines[0]}</p>

                <div className={editor.optionFields}>
                  <label className={editor.inline}>
                    <span className={editor.unit}>{profile.currency === 'CHF' ? 'CHF' : '€'}</span>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      aria-label={`Prix ${optionCopy[key].label}`}
                      value={option.price}
                      onChange={(event) =>
                        updateOption(key, 'price', Number(event.target.value) || 0)
                      }
                    />
                  </label>
                  <label className={editor.inline}>
                    <span className={editor.unit}>min</span>
                    <input
                      type="number"
                      min={0}
                      step={15}
                      aria-label={`Durée ${optionCopy[key].label}`}
                      value={option.minutes}
                      onChange={(event) =>
                        updateOption(key, 'minutes', Number(event.target.value) || 0)
                      }
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={editor.block}>
        <div className={editor.blockHead}>
          <h2 className={editor.blockTitle}>État du véhicule</h2>
          <p className={editor.blockHint}>
            Un coefficient appliqué à la main-d’œuvre, pas au prix total : un véhicule très sale
            demande plus de temps, pas plus de produit. 1,3 signifie « 30 % de temps en plus ».
          </p>
        </div>

        <div className={editor.soilingList}>
          {soiling.map((row) => (
            <label key={row.level} className={editor.soilingRow}>
              <span className={editor.soilingName}>
                {soilingCopy[row.level].label}
                <span className={editor.scopeHint}>{soilingCopy[row.level].hint}</span>
              </span>
              <input
                type="number"
                min={1}
                step={0.05}
                disabled={row.level === 'normal'}
                value={row.labourMultiplier}
                onChange={(event) => {
                  const value = Number(event.target.value) || 1;
                  setSoiling((current) =>
                    current.map((entry) =>
                      entry.level === row.level ? { ...entry, labourMultiplier: value } : entry,
                    ),
                  );
                  setState('idle');
                }}
              />
            </label>
          ))}
        </div>
        <p className={editor.blockHint}>
          L’état normal reste à 1 : c’est la référence sur laquelle tous les autres se calculent.
        </p>
      </section>

      <section className={editor.block}>
        <div className={editor.blockHead}>
          <h2 className={editor.blockTitle}>Réglages</h2>
          <p className={editor.blockHint}>
            Le pays pilote la devise, la TVA, le format du code postal et l’indicatif téléphonique,
            partout — page client, e-mails et factures.
          </p>
        </div>

        <div className={editor.settingsGrid}>
          <label className={editor.setting}>
            <span>Pays</span>
            <select
              value={settings.country}
              onChange={(event) => {
                setSettings({ ...settings, country: event.target.value });
                setState('idle');
              }}
            >
              <option value="FR">France — EUR, TVA 20 %</option>
              <option value="CH">Suisse — CHF, TVA 8,1 %</option>
            </select>
          </label>

          <label className={editor.setting}>
            <span>Annulation gratuite jusqu’à</span>
            <input
              type="number"
              min={0}
              step={1}
              value={settings.freeCancellationHours}
              onChange={(event) => {
                setSettings({
                  ...settings,
                  freeCancellationHours: Number(event.target.value) || 0,
                });
                setState('idle');
              }}
            />
          </label>

          <label className={editor.setting}>
            <span>Acompte (% du total)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={settings.depositPercent}
              onChange={(event) => {
                setSettings({ ...settings, depositPercent: Number(event.target.value) || 0 });
                setState('idle');
              }}
            />
          </label>

          <label className={editor.settingCheck}>
            <input
              type="checkbox"
              checked={settings.depositEnabled}
              onChange={(event) => {
                setSettings({ ...settings, depositEnabled: event.target.checked });
                setState('idle');
              }}
            />
            <span>Demander un acompte à la réservation</span>
          </label>

          <label className={editor.settingCheck}>
            <input
              type="checkbox"
              checked={settings.mobileService}
              onChange={(event) => {
                setSettings({ ...settings, mobileService: event.target.checked });
                setState('idle');
              }}
            />
            <span>J’interviens à domicile</span>
          </label>

          <label className={editor.settingCheck}>
            <input
              type="checkbox"
              checked={settings.workshopService}
              onChange={(event) => {
                setSettings({ ...settings, workshopService: event.target.checked });
                setState('idle');
              }}
            />
            <span>Je reçois à l’atelier</span>
          </label>

          <label className={editor.settingCheck}>
            <input
              type="checkbox"
              checked={settings.published}
              onChange={(event) => {
                setSettings({ ...settings, published: event.target.checked });
                setState('idle');
              }}
            />
            <span>Page publique en ligne</span>
          </label>
        </div>

        {/* Point de départ des tournées.
            Sans lui, la distance jusqu'au client est incalculable : le tunnel
            retombe alors sur une estimation saisie à la main par le client,
            c'est-à-dire sur une devinette qui fixe tes frais de déplacement. */}
        <div className={editor.settingFull}>
          <span>Adresse de départ de tes déplacements</span>
          <div className={editor.baseSearch}>
            <input
              type="text"
              value={baseQuery}
              placeholder="15 avenue Jean Jaurès, Lyon"
              onChange={(event) => {
                setBaseQuery(event.target.value);
                setState('idle');
              }}
            />
            <button type="button" className={editor.baseButton} onClick={locateBase}>
              {locating ? 'Recherche…' : 'Localiser'}
            </button>
          </div>
          {settings.baseLatitude !== null && settings.baseLongitude !== null ? (
            <p className={editor.blockHint}>
              Point retenu : {settings.baseAddress}. Les distances de tes clients se calculent
              depuis là.
            </p>
          ) : (
            <p className={editor.blockHint}>
              <strong className={editor.warn}>Aucun point de départ.</strong> Tant qu’il manque,
              tes clients doivent estimer eux-mêmes la distance — et cette estimation fixe tes
              frais de déplacement.
            </p>
          )}
          {baseError ? <p className={editor.blockHint}>{baseError}</p> : null}
        </div>

        <label className={editor.settingFull}>
          <span>Phrase d’accueil sur ta page client</span>
          <textarea
            rows={3}
            value={settings.intro ?? ''}
            placeholder="Laissée vide, une phrase par défaut est utilisée."
            onChange={(event) => {
              setSettings({ ...settings, intro: event.target.value || null });
              setState('idle');
            }}
          />
        </label>
      </section>

      {/* Barre collante : sur une page aussi longue, un bouton en pied de
          document oblige à faire défiler quinze tarifs pour enregistrer une
          case corrigée en haut. */}
      <div className={editor.saveBar}>
        <div className={editor.saveStatus} role="status">
          {state === 'saving' ? 'Enregistrement…' : null}
          {state === 'saved' ? 'Enregistré. Ta page client est à jour.' : null}
          {state === 'error' ? <span className={editor.warn}>{message}</span> : null}
          {state === 'idle' ? (
            <>
              Exemple de prix affiché :{' '}
              <strong>{formatMoney(prices[0]?.basePrice ?? 0, profile)}</strong>
            </>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={state === 'saving'}
          onClick={save}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
