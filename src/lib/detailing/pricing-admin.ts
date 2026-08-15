import 'server-only';
import { getServiceSupabaseClient } from './supabase-server';
import { scopes, soilingLevels, vehicleSizes, optionKeys } from './types';
import type { OptionKey, Scope, SoilingLevel, VehicleSize } from './types';

/**
 * Lecture et écriture du catalogue d'un professionnel depuis son dashboard.
 *
 * **Pourquoi ce module et pas `config.ts`.** `loadDetailerBySlug` ne renvoie
 * que les fiches publiées et n'expose que ce dont la page publique a besoin.
 * Un professionnel doit pouvoir régler ses tarifs avant de publier sa page —
 * sinon il n'y a aucun moment où c'est possible.
 *
 * **Grille complète, toujours.** La lecture comble les cases absentes plutôt
 * que de les omettre. Une combinaison taille × formule sans ligne en base est
 * une prestation que le tunnel refuse de chiffrer : le client voit « une
 * erreur est survenue » et s'en va. En affichant la case vide dans l'éditeur,
 * le trou devient visible au professionnel avant de l'être à son client.
 */

export type PriceCell = {
  readonly scope: Scope;
  readonly vehicleSize: VehicleSize;
  readonly basePrice: number | null;
  readonly baseMinutes: number | null;
};

export type OptionRow = {
  readonly key: OptionKey;
  readonly enabled: boolean;
  readonly price: number;
  readonly minutes: number;
  readonly scaleWithSize: boolean;
  readonly affectedBySoiling: boolean;
};

/**
 * Nom commercial d'une formule.
 *
 * `scope` reste le périmètre technique qui pilote le calcul ; `label` n'est
 * qu'un habillage. Renommer une formule ne modifie donc jamais un prix.
 */
export type ScopeLabelRow = {
  readonly scope: Scope;
  readonly label: string;
  readonly description: string | null;
};

export type SoilingRow = {
  readonly level: SoilingLevel;
  readonly labourMultiplier: number;
};

export type DetailerSettings = {
  readonly country: string;
  readonly mobileService: boolean;
  readonly workshopService: boolean;
  readonly travelFreeRadiusKm: number;
  readonly travelFeePerKm: number;
  readonly travelMaxKm: number;
  readonly depositEnabled: boolean;
  readonly depositPercent: number;
  readonly freeCancellationHours: number;
  readonly published: boolean;
  readonly intro: string | null;
  /** Point de départ des tournées, d'où se calcule chaque distance. */
  readonly baseAddress: string | null;
  readonly baseLatitude: number | null;
  readonly baseLongitude: number | null;
};

export type PricingCatalogue = {
  readonly prices: readonly PriceCell[];
  readonly scopeLabels: readonly ScopeLabelRow[];
  readonly options: readonly OptionRow[];
  readonly soiling: readonly SoilingRow[];
  readonly settings: DetailerSettings;
};

/** Valeurs de départ d'une option jamais configurée. */
const optionDefaults: Record<OptionKey, Omit<OptionRow, 'key' | 'enabled'>> = {
  shampouinage: { price: 60, minutes: 60, scaleWithSize: true, affectedBySoiling: true },
  ceramique: { price: 350, minutes: 240, scaleWithSize: true, affectedBySoiling: false },
  polissage: { price: 180, minutes: 150, scaleWithSize: true, affectedBySoiling: false },
  phares: { price: 70, minutes: 45, scaleWithSize: false, affectedBySoiling: false },
  ozone: { price: 50, minutes: 45, scaleWithSize: false, affectedBySoiling: false },
};

const soilingDefaults: Record<SoilingLevel, number> = {
  normal: 1,
  tres_sale: 1.3,
  poils_taches: 1.5,
};

export async function loadCatalogue(detailerId: string): Promise<PricingCatalogue | null> {
  const client = getServiceSupabaseClient();
  if (!client) return null;

  const [detailerRes, pricesRes, optionsRes, soilingRes, labelsRes] = await Promise.all([
    client.from('detailers').select('*').eq('id', detailerId).maybeSingle(),
    client.from('detailer_prices').select('*').eq('detailer_id', detailerId),
    client.from('detailer_options').select('*').eq('detailer_id', detailerId),
    client.from('detailer_soiling').select('*').eq('detailer_id', detailerId),
    // La table peut ne pas exister si la migration 006 n'est pas passée : la
    // requête échoue alors sans faire tomber la page, et les noms par défaut
    // s'appliquent.
    client.from('detailer_scope_labels').select('*').eq('detailer_id', detailerId),
  ]);

  const detailer = detailerRes.data;
  if (!detailer) return null;

  const priceIndex = new Map<string, { price: number; minutes: number }>();
  for (const row of pricesRes.data ?? []) {
    priceIndex.set(`${row.scope}:${row.vehicle_size}`, {
      price: Number(row.base_price),
      minutes: Number(row.base_minutes),
    });
  }

  const prices: PriceCell[] = [];
  for (const scope of scopes) {
    for (const vehicleSize of vehicleSizes) {
      const found = priceIndex.get(`${scope}:${vehicleSize}`);
      prices.push({
        scope,
        vehicleSize,
        basePrice: found ? found.price : null,
        baseMinutes: found ? found.minutes : null,
      });
    }
  }

  const optionIndex = new Map(
    (optionsRes.data ?? []).map((row) => [row.option_key as OptionKey, row]),
  );
  const options: OptionRow[] = optionKeys.map((key) => {
    const row = optionIndex.get(key);
    if (!row) return { key, enabled: false, ...optionDefaults[key] };
    return {
      key,
      enabled: Boolean(row.enabled),
      price: Number(row.price),
      minutes: Number(row.minutes),
      scaleWithSize: Boolean(row.scale_with_size),
      affectedBySoiling: Boolean(row.affected_by_soiling),
    };
  });

  const soilingIndex = new Map(
    (soilingRes.data ?? []).map((row) => [row.level as SoilingLevel, Number(row.labour_multiplier)]),
  );
  const soiling: SoilingRow[] = soilingLevels.map((level) => ({
    level,
    labourMultiplier: soilingIndex.get(level) ?? soilingDefaults[level],
  }));

  const labelIndex = new Map(
    (labelsRes.data ?? []).map((row) => [
      row.scope as Scope,
      { label: String(row.label), description: (row.description as string | null) ?? null },
    ]),
  );
  const scopeLabels: ScopeLabelRow[] = scopes.map((scope) => {
    const found = labelIndex.get(scope);
    return {
      scope,
      label: found?.label ?? '',
      description: found?.description ?? null,
    };
  });

  return {
    prices,
    scopeLabels,
    options,
    soiling,
    settings: {
      country: (detailer.country as string | null) ?? 'FR',
      mobileService: Boolean(detailer.mobile_service),
      workshopService: Boolean(detailer.workshop_service),
      travelFreeRadiusKm: Number(detailer.travel_free_radius_km ?? 0),
      travelFeePerKm: Number(detailer.travel_fee_per_km ?? 0),
      travelMaxKm: Number(detailer.travel_max_km ?? 0),
      depositEnabled: Boolean(detailer.deposit_enabled),
      depositPercent: Number(detailer.deposit_percent ?? 30),
      freeCancellationHours: Number(detailer.free_cancellation_hours ?? 24),
      published: Boolean(detailer.published),
      intro: (detailer.intro as string | null) ?? null,
      baseAddress: (detailer.base_address as string | null) ?? null,
      baseLatitude: detailer.base_latitude == null ? null : Number(detailer.base_latitude),
      baseLongitude: detailer.base_longitude == null ? null : Number(detailer.base_longitude),
    },
  };
}

export type CataloguePatch = {
  readonly prices?: readonly {
    scope: Scope;
    vehicleSize: VehicleSize;
    basePrice: number | null;
    baseMinutes: number | null;
  }[];
  readonly scopeLabels?: readonly ScopeLabelRow[];
  readonly options?: readonly OptionRow[];
  readonly soiling?: readonly SoilingRow[];
  readonly settings?: Partial<DetailerSettings>;
};

/**
 * Enregistre le catalogue.
 *
 * Une case laissée vide **supprime** la ligne au lieu d'écrire un zéro : un
 * tarif à 0 € serait facturé 0 € au premier client qui le choisit, alors
 * qu'une ligne absente fait simplement disparaître la combinaison du tunnel.
 * C'est la différence entre une prestation non proposée et une prestation
 * offerte.
 */
export async function saveCatalogue(
  detailerId: string,
  patch: CataloguePatch,
): Promise<{ ok: boolean; message?: string }> {
  const client = getServiceSupabaseClient();
  if (!client) return { ok: false, message: 'Base indisponible.' };

  if (patch.prices) {
    const toUpsert = patch.prices
      .filter((cell) => cell.basePrice !== null && cell.baseMinutes !== null)
      .map((cell) => ({
        detailer_id: detailerId,
        scope: cell.scope,
        vehicle_size: cell.vehicleSize,
        base_price: cell.basePrice,
        base_minutes: cell.baseMinutes,
      }));

    const toDelete = patch.prices.filter(
      (cell) => cell.basePrice === null || cell.baseMinutes === null,
    );

    if (toUpsert.length > 0) {
      const { error } = await client
        .from('detailer_prices')
        .upsert(toUpsert, { onConflict: 'detailer_id,scope,vehicle_size' });
      if (error) return { ok: false, message: `Tarifs : ${error.message}` };
    }

    for (const cell of toDelete) {
      await client
        .from('detailer_prices')
        .delete()
        .eq('detailer_id', detailerId)
        .eq('scope', cell.scope)
        .eq('vehicle_size', cell.vehicleSize);
    }
  }

  if (patch.scopeLabels) {
    // Un nom vidé revient au libellé standard : on supprime la ligne plutôt
    // que d'enregistrer une chaîne vide, qui afficherait un bouton sans texte.
    const named = patch.scopeLabels.filter((row) => row.label.trim().length > 0);
    const cleared = patch.scopeLabels.filter((row) => row.label.trim().length === 0);

    if (named.length > 0) {
      const { error } = await client.from('detailer_scope_labels').upsert(
        named.map((row) => ({
          detailer_id: detailerId,
          scope: row.scope,
          label: row.label.trim(),
          description: row.description?.trim() || null,
        })),
        { onConflict: 'detailer_id,scope' },
      );
      if (error) return { ok: false, message: `Noms de formules : ${error.message}` };
    }

    for (const row of cleared) {
      await client
        .from('detailer_scope_labels')
        .delete()
        .eq('detailer_id', detailerId)
        .eq('scope', row.scope);
    }
  }

  if (patch.options) {
    const { error } = await client.from('detailer_options').upsert(
      patch.options.map((option) => ({
        detailer_id: detailerId,
        option_key: option.key,
        enabled: option.enabled,
        price: option.price,
        minutes: option.minutes,
        scale_with_size: option.scaleWithSize,
        affected_by_soiling: option.affectedBySoiling,
      })),
      { onConflict: 'detailer_id,option_key' },
    );
    if (error) return { ok: false, message: `Options : ${error.message}` };
  }

  if (patch.soiling) {
    const { error } = await client.from('detailer_soiling').upsert(
      patch.soiling.map((row) => ({
        detailer_id: detailerId,
        level: row.level,
        labour_multiplier: row.labourMultiplier,
      })),
      { onConflict: 'detailer_id,level' },
    );
    if (error) return { ok: false, message: `États : ${error.message}` };
  }

  if (patch.settings) {
    const s = patch.settings;
    const row: Record<string, unknown> = {};
    if (s.country !== undefined) row.country = s.country;
    if (s.mobileService !== undefined) row.mobile_service = s.mobileService;
    if (s.workshopService !== undefined) row.workshop_service = s.workshopService;
    if (s.travelFreeRadiusKm !== undefined) row.travel_free_radius_km = s.travelFreeRadiusKm;
    if (s.travelFeePerKm !== undefined) row.travel_fee_per_km = s.travelFeePerKm;
    if (s.travelMaxKm !== undefined) row.travel_max_km = s.travelMaxKm;
    if (s.depositEnabled !== undefined) row.deposit_enabled = s.depositEnabled;
    if (s.depositPercent !== undefined) row.deposit_percent = s.depositPercent;
    if (s.freeCancellationHours !== undefined) {
      row.free_cancellation_hours = s.freeCancellationHours;
    }
    if (s.published !== undefined) row.published = s.published;
    if (s.intro !== undefined) row.intro = s.intro;
    if (s.baseAddress !== undefined) row.base_address = s.baseAddress;
    if (s.baseLatitude !== undefined) row.base_latitude = s.baseLatitude;
    if (s.baseLongitude !== undefined) row.base_longitude = s.baseLongitude;

    if (Object.keys(row).length > 0) {
      const { error } = await client.from('detailers').update(row).eq('id', detailerId);
      if (error) return { ok: false, message: `Réglages : ${error.message}` };
    }
  }

  return { ok: true };
}
