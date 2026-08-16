'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/form/Field';
import { ChoiceGroup, FieldError, TextInput } from '@/components/form/Controls';
import { uploadDetailerPhoto } from '@/lib/detailing/photos';
import { AddressPicker, type SelectedAddress } from './AddressPicker';
import { formatMoney, profileFor } from '@/lib/detailing/locale';
import { quote } from '@/lib/detailing/quote';
import {
  optionKeys as allOptionKeys,
  scopes,
  soilingLevels,
  vehicleSizes,
} from '@/lib/detailing/types';
import type {
  DetailerConfig,
  LocationMode,
  OptionKey,
  Quote,
  Scope,
  SoilingLevel,
  VehicleSize,
} from '@/lib/detailing/types';
import { optionCopy, revisionNotice, scopeCopy, soilingCopy, vehicleSizeCopy } from './content';
import styles from './BookingFlow.module.css';

export type DetailerSummary = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly city: string | null;
  /** 'FR' ou 'CH' — pilote devise, code postal et indicatif téléphonique. */
  readonly country: string;
  /**
   * Point de départ du professionnel. `null` tant qu'il ne l'a pas renseigné :
   * la distance devient alors incalculable et le formulaire retombe sur une
   * saisie manuelle plutôt que de facturer zéro kilomètre.
   */
  readonly base: { readonly lat: number; readonly lon: number } | null;
  /** Noms commerciaux des formules, tels que le professionnel les vend. */
  readonly scopeLabels: Readonly<Record<string, { label: string; description: string | null }>>;
  readonly mobileService: boolean;
  readonly workshopService: boolean;
  readonly workshopAddress: string | null;
};

type StepId = 'vehicule' | 'formule' | 'etat' | 'options' | 'lieu' | 'creneau' | 'photos';

/**
 * Chaque étape porte une phrase d'aide.
 *
 * « L'état » ne dit ni quoi faire, ni pourquoi la question est posée. Un
 * visiteur qui ne comprend pas ce qu'on lui demande choisit au hasard, et un
 * état déclaré au hasard produit un devis faux — donc un ajustement de prix
 * sur place, c'est-à-dire exactement ce que le produit promet d'éviter.
 */
const steps: readonly { id: StepId; title: string; help: string }[] = [
  {
    id: 'vehicule',
    title: 'Votre véhicule',
    help: 'La taille détermine la surface à traiter, donc le temps passé. Prenez la catégorie la plus proche, un exemple est donné pour chacune.',
  },
  {
    id: 'formule',
    title: 'Ce que vous voulez faire nettoyer',
    help: 'Intérieur, extérieur, ou les deux. Vous pourrez ajouter des prestations précises à l’étape suivante.',
  },
  {
    id: 'etat',
    title: 'L’état actuel du véhicule',
    help: 'Soyez franc : c’est ce qui rend le prix fiable. Un intérieur annoncé propre mais couvert de poils demandera plus de temps, et le montant sera revu sur place.',
  },
  {
    id: 'options',
    title: 'Des prestations en plus ?',
    help: 'Facultatif. Chaque option affiche ce qu’elle change et combien elle ajoute au total.',
  },
  {
    id: 'lieu',
    title: 'Où se passe l’intervention',
    help: 'Chez vous ou à l’atelier. À domicile, un forfait de déplacement peut s’ajouter au-delà d’un certain rayon.',
  },
  {
    id: 'creneau',
    title: 'Quand vous arrange-t-il ?',
    help: 'Seuls les créneaux réellement libres et assez longs pour votre prestation s’affichent.',
  },
  {
    id: 'photos',
    title: 'Vos coordonnées',
    help: 'Pour vous envoyer la confirmation. Les photos sont facultatives mais fiabilisent le montant.',
  },
];

const photoLabels = [
  'Intérieur — vue avant',
  'Intérieur — vue arrière',
  'Extérieur — trois quarts',
] as const;

/** Frais de déplacement : la devise suit le pays du professionnel. */

/**
 * Les montants ne sont plus formatés en dur.
 *
 * `${value} €` affichait des euros à un professionnel suisse. Le profil pays
 * porte la devise et sa position — « 289 € » en France, « CHF 289 » en Suisse,
 * ce qu'aucune concaténation ne produit correctement des deux côtés.
 */
function formatPriceIn(value: number, country: string): string {
  return formatMoney(Math.round(value), profileFor(country));
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${String(rest).padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatSlotLong(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tomorrowIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

type SlotOption = { readonly start: string; readonly end: string };

export function BookingFlow({
  detailer,
  quoteConfig,
}: {
  detailer: DetailerSummary;
  quoteConfig: DetailerConfig;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<'flow' | 'submitting' | 'done'>('flow');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const draftId = useState(() => crypto.randomUUID())[0];

  const [vehicleSize, setVehicleSize] = useState<VehicleSize | ''>('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [plate, setPlate] = useState('');
  const [scope, setScope] = useState<Scope | ''>('');
  const [soiling, setSoiling] = useState<SoilingLevel>('normal');
  const [selectedOptions, setSelectedOptions] = useState<readonly OptionKey[]>([]);
  const [locationMode, setLocationMode] = useState<LocationMode | ''>('');
  // Conservé en repli pour l'atelier et les fiches sans point de départ : le
  // champ de saisie a disparu, l'adresse le fournit désormais.
  const [postalCode] = useState('');
  const [travelKm, setTravelKm] = useState('');
  const [address, setAddress] = useState<SelectedAddress | null>(null);
  const [accessNote, setAccessNote] = useState('');

  /**
   * Distance et code postal viennent de l'adresse dès qu'elle est retenue.
   *
   * Deux sources pour une même valeur finissent toujours par diverger : le
   * client corrige son adresse, la distance manuelle reste, et le devis
   * facture un trajet qui n'existe plus. L'adresse prime, la saisie manuelle
   * n'est qu'un repli quand le professionnel n'a pas de point de départ.
   */
  const effectiveTravelKm = address?.distanceKm ?? (travelKm ? Number(travelKm) : 0);
  const effectivePostalCode = address?.postalCode ?? postalCode;

  const [selectedDay, setSelectedDay] = useState(tomorrowIso);
  const [slots, setSlots] = useState<readonly SlotOption[]>([]);
  const [slotsState, setSlotsState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photos, setPhotos] = useState<readonly (string | null)[]>([null, null, null]);
  const [photoUploading, setPhotoUploading] = useState<readonly boolean[]>([false, false, false]);
  const [photoErrors, setPhotoErrors] = useState<readonly (string | null)[]>([null, null, null]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingSummary, setBookingSummary] = useState<{
    quotedPrice: number;
    quotedMinutes: number;
    depositAmount: number;
    holdExpiresAt: string;
  } | null>(null);

  const profile = profileFor(detailer.country);

  /**
   * Nom d'une formule tel que le client doit le lire.
   *
   * Le professionnel vend une « Formule Éclat », pas un « Intérieur ». Un
   * client venu d'une publication Instagram qui ne retrouve pas ce nom-là
   * croit s'être trompé de page. Le périmètre technique reste `scope` — il
   * pilote le calcul et n'est jamais remplacé, seulement habillé.
   */
  const scopeLabelFor = (value: Scope) => detailer.scopeLabels[value]?.label || scopeCopy[value].label;
  const scopeHintFor = (value: Scope) =>
    detailer.scopeLabels[value]?.description || scopeCopy[value].hint;
  const formatPrice = (value: number) => formatPriceIn(value, detailer.country);

  const canQuote = vehicleSize !== '' && scope !== '';

  const currentQuote: Quote | null = useMemo(() => {
    if (!canQuote) return null;
    try {
      return quote(
        {
          scope: scope as Scope,
          vehicleSize: vehicleSize as VehicleSize,
          soiling,
          optionKeys: selectedOptions,
          locationMode: locationMode || 'atelier',
          travelKm: effectiveTravelKm,
        },
        quoteConfig,
      );
    } catch {
      return null;
    }
  }, [
    canQuote,
    scope,
    vehicleSize,
    soiling,
    selectedOptions,
    locationMode,
    effectiveTravelKm,
    quoteConfig,
  ]);

  function priceDeltaForOption(key: OptionKey): number {
    if (!canQuote || !currentQuote) return 0;
    const withIt = selectedOptions.includes(key) ? selectedOptions : [...selectedOptions, key];
    const withoutIt = selectedOptions.filter((existing) => existing !== key);
    const base = quote(
      {
        scope: scope as Scope,
        vehicleSize: vehicleSize as VehicleSize,
        soiling,
        optionKeys: withoutIt,
        locationMode: locationMode || 'atelier',
        travelKm: 0,
      },
      quoteConfig,
    );
    const withOption = quote(
      {
        scope: scope as Scope,
        vehicleSize: vehicleSize as VehicleSize,
        soiling,
        optionKeys: withIt,
        locationMode: locationMode || 'atelier',
        travelKm: 0,
      },
      quoteConfig,
    );
    return withOption.totalPrice - base.totalPrice;
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      headingRef.current?.focus({ preventScroll: true });
      workspaceRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [stepIndex, phase]);

  const activeStep = steps[stepIndex] ?? steps[0]!;
  const durationMinutes = currentQuote?.totalMinutes ?? null;

  useEffect(() => {
    if (activeStep.id !== 'creneau' || durationMinutes === null) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setSlotsState('loading');
      setSelectedSlot(null);
    });
    fetch(`/api/detailing/${detailer.slug}/slots?day=${selectedDay}&minutes=${durationMinutes}`)
      .then((response) => response.json())
      .then((data: { slots?: SlotOption[] }) => {
        if (cancelled) return;
        setSlots(data.slots ?? []);
        setSlotsState('idle');
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
        setSlotsState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [activeStep.id, selectedDay, durationMinutes, detailer.slug]);

  function toggleOption(key: OptionKey) {
    setSelectedOptions((current) =>
      current.includes(key) ? current.filter((existing) => existing !== key) : [...current, key],
    );
  }

  function goNext() {
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  function goPrev() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  async function handlePhotoChange(index: number, file: File | undefined) {
    if (!file) return;
    setPhotoUploading((current) => current.map((value, i) => (i === index ? true : value)));
    setPhotoErrors((current) => current.map((value, i) => (i === index ? null : value)));
    const result = await uploadDetailerPhoto(detailer.id, draftId, file);
    setPhotoUploading((current) => current.map((value, i) => (i === index ? false : value)));
    if (result.ok) {
      setPhotos((current) => current.map((value, i) => (i === index ? result.path : value)));
    } else {
      setPhotoErrors((current) => current.map((value, i) => (i === index ? result.message : value)));
    }
  }

  /**
   * Les photos ne conditionnent plus l'envoi.
   *
   * Exiger trois photos avant de pouvoir réserver, c'est demander à quelqu'un
   * d'être devant sa voiture, de jour, avec du réseau. Un client qui prépare sa
   * réservation le soir depuis son canapé n'a alors aucun moyen d'aller au bout
   * — et le professionnel ne perd pas une photo, il perd la réservation.
   *
   * Le risque que les photos couvraient est déjà couvert autrement : le
   * professionnel vérifie le véhicule à son arrivée et peut proposer un montant
   * ajusté, que le client reste libre de refuser (`revisionNotice`).
   */
  const photoCount = photos.filter((path) => path !== null).length;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit() {
    if (!currentQuote || !selectedSlot || !emailValid) return;
    setPhase('submitting');
    setSubmitError(null);
    try {
      const response = await fetch(`/api/detailing/${detailer.slug}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: phone || undefined,
          vehicleSize,
          vehicleModel: vehicleModel || undefined,
          plate: plate || undefined,
          scope,
          soiling,
          optionKeys: selectedOptions,
          locationMode: locationMode || 'atelier',
          postalCode: effectivePostalCode || undefined,
          travelKm: effectiveTravelKm || undefined,
          address: address?.label,
          latitude: address?.lat,
          longitude: address?.lon,
          accessNote: accessNote || undefined,
          photos: photos.filter((path): path is string => path !== null),
          slotStart: selectedSlot.start,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPhase('flow');
        setSubmitError(data.message ?? 'La réservation n’a pas pu être enregistrée.');
        return;
      }
      setBookingSummary(data.booking);
      setPhase('done');
    } catch {
      setPhase('flow');
      setSubmitError('La réservation n’a pas pu être enregistrée. Vérifiez votre connexion.');
    }
  }

  const canProceed: Record<StepId, boolean> = {
    vehicule: vehicleSize !== '',
    formule: scope !== '',
    etat: true,
    options: true,
    // Une adresse retenue suffit : elle porte le code postal et la distance.
    // Sans point de départ chez le professionnel, on exige encore la saisie
    // manuelle, faute de quoi le déplacement serait facturé zéro.
    lieu:
      locationMode === 'atelier' ||
      (locationMode === 'domicile' &&
        address !== null &&
        (detailer.base !== null || travelKm.trim().length > 0) &&
        Boolean(currentQuote?.travelAllowed)),
    creneau: selectedSlot !== null,
    photos: emailValid,
  };

  const locationOptions = [
    ...(detailer.mobileService
      ? [{ value: 'domicile', label: 'À domicile', description: 'Le professionnel se déplace chez vous.' }]
      : []),
    ...(detailer.workshopService
      ? [
          {
            value: 'atelier',
            label: 'À l’atelier',
            description: detailer.workshopAddress ?? 'Vous déposez le véhicule sur place.',
          },
        ]
      : []),
  ];

  if (phase === 'done' && bookingSummary) {
    return (
      <section className={styles.confirmation} data-app="booking" aria-labelledby="booking-confirmation-title">
        <p className={styles.eyebrow}>Demande envoyée</p>
        <h1 ref={headingRef} tabIndex={-1} id="booking-confirmation-title">
          C’est noté. {detailer.name} a bien reçu votre demande.
        </h1>
        <ul className={styles.confirmList}>
          {selectedSlot ? (
            <li>
              <strong>Créneau</strong> {formatSlotLong(selectedSlot.start)}
            </li>
          ) : null}
          <li>
            <strong>Durée</strong> {formatDuration(bookingSummary.quotedMinutes)}
          </li>
          <li>
            <strong>Estimation</strong> {formatPrice(bookingSummary.quotedPrice)}
          </li>
          <li>
            <strong>Confirmation</strong> un e-mail a été envoyé à {email}
          </li>
        </ul>
        {quoteConfig.depositEnabled && bookingSummary.depositAmount > 0 ? (
          <p>
            {detailer.name} vous recontacte pour l’acompte de{' '}
            {formatPrice(bookingSummary.depositAmount)} avant{' '}
            {formatTime(bookingSummary.holdExpiresAt)} — au-delà, le créneau est libéré.
          </p>
        ) : (
          <p>{detailer.name} vous recontacte pour confirmer définitivement ce créneau.</p>
        )}
        <p className={styles.note}>{revisionNotice(detailer.name)}</p>
        <p className={styles.note}>
          Pensez à vérifier vos spams si le message n’apparaît pas dans la boîte de réception.
        </p>
      </section>
    );
  }

  return (
    <div className={styles.flow} data-app="booking">
      <aside className={styles.context} data-surface="inverse">
        <p className={styles.eyebrow}>{detailer.name}</p>
        <p className={styles.contextStep}>
          Étape {stepIndex + 1} sur {steps.length}
        </p>
        <div className={styles.progress} aria-hidden="true">
          <span style={{ inlineSize: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
        <ol className={styles.stepList}>
          {steps.map((step, index) => (
            <li
              key={step.id}
              data-state={index === stepIndex ? 'current' : index < stepIndex ? 'complete' : 'future'}
            >
              {step.title}
            </li>
          ))}
        </ol>

        {currentQuote && stepIndex >= 1 ? (
          <div className={styles.priceCard} role="status">
            <span className={styles.priceLabel}>Estimation</span>
            <span className={styles.priceAmount}>{formatPrice(currentQuote.totalPrice)}</span>
            <span className={styles.priceDuration}>
              {currentQuote.isLongJob
                ? 'Intervention sur deux demi-journées'
                : `Environ ${formatDuration(currentQuote.totalMinutes)}`}
            </span>
            {currentQuote.travelFee > 0 ? (
              <span className={styles.priceLine}>
                dont {formatPrice(currentQuote.travelFee)} de déplacement
              </span>
            ) : null}
          </div>
        ) : null}
      </aside>

      <div className={styles.workspace} ref={workspaceRef}>
        <p className={styles.srOnly} aria-live="polite">
          Étape {stepIndex + 1} sur {steps.length} : {activeStep.title}
        </p>

        <h1 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
          {activeStep.title}
        </h1>
        <p className={styles.stepHelp}>{activeStep.help}</p>

        {activeStep.id === 'vehicule' ? (
          <div className={styles.stepBody}>
            <ChoiceGroup
              id="vehicleSize"
              name="vehicleSize"
              type="radio"
              columns={2}
              options={vehicleSizes.map((size) => ({
                value: size,
                label: vehicleSizeCopy[size].label,
                description: vehicleSizeCopy[size].hint,
              }))}
              selected={vehicleSize ? [vehicleSize] : []}
              onToggle={(value) => setVehicleSize(value as VehicleSize)}
            />
            <Field id="vehicleModel" label="Modèle du véhicule" optional>
              <TextInput
                id="vehicleModel"
                name="vehicleModel"
                value={vehicleModel}
                onChange={setVehicleModel}
                placeholder="Ex. Peugeot 308"
              />
            </Field>
            <Field
              id="plate"
              label="Immatriculation"
              optional
              hint="Utile au professionnel pour préparer son intervention."
            >
              <TextInput
                id="plate"
                name="plate"
                value={plate}
                onChange={setPlate}
                hasHint
                placeholder="AA-123-BB"
              />
            </Field>
          </div>
        ) : null}

        {activeStep.id === 'formule' ? (
          <div className={styles.stepBody}>
            <ChoiceGroup
              id="scope"
              name="scope"
              type="radio"
              options={scopes.map((value) => ({
                value,
                label: scopeLabelFor(value),
                description: scopeHintFor(value),
              }))}
              selected={scope ? [scope] : []}
              onToggle={(value) => setScope(value as Scope)}
            />
          </div>
        ) : null}

        {activeStep.id === 'etat' ? (
          <div className={styles.stepBody}>
            <ChoiceGroup
              id="soiling"
              name="soiling"
              type="radio"
              options={soilingLevels.map((value) => ({
                value,
                label: soilingCopy[value].label,
                description: soilingCopy[value].hint,
              }))}
              selected={[soiling]}
              onToggle={(value) => setSoiling(value as SoilingLevel)}
            />
          </div>
        ) : null}

        {activeStep.id === 'options' ? (
          <div className={styles.stepBody}>
            {quoteConfig.options.length === 0 ? (
              <p>Ce professionnel ne propose pas d’option supplémentaire pour le moment.</p>
            ) : (
              <div className={styles.optionGrid}>
                {quoteConfig.options
                  .filter((option) => allOptionKeys.includes(option.key))
                  .map((option) => {
                    const copy = optionCopy[option.key];
                    const checked = selectedOptions.includes(option.key);
                    const delta = priceDeltaForOption(option.key);
                    return (
                      <label key={option.key} className={styles.optionCard} data-checked={checked}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOption(option.key)}
                        />
                        <span className={styles.optionHead}>
                          <strong>{copy.label}</strong>
                          <span className={styles.optionPrice}>+{formatPrice(delta)}</span>
                        </span>
                        <p>{copy.lines[0]}</p>
                        <p>{copy.lines[1]}</p>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>
        ) : null}

        {activeStep.id === 'lieu' ? (
          <div className={styles.stepBody}>
            <ChoiceGroup
              id="locationMode"
              name="locationMode"
              type="radio"
              options={locationOptions}
              selected={locationMode ? [locationMode] : []}
              onToggle={(value) => setLocationMode(value as LocationMode)}
            />
            {locationMode === 'domicile' ? (
              <>
                <AddressPicker
                  country={detailer.country}
                  base={detailer.base}
                  value={address}
                  onChange={setAddress}
                  accessNote={accessNote}
                  onAccessNoteChange={setAccessNote}
                />
                {detailer.base === null ? (
                  /*
                   * Repli : le professionnel n'a pas renseigné son point de
                   * départ dans son espace, la distance n'est donc pas
                   * calculable. On la demande plutôt que de facturer zéro
                   * kilomètre — mais c'est une mauvaise étape, et l'intitulé le
                   * dit maintenant clairement au lieu de faire croire au client
                   * qu'on attend de lui une estimation qu'il ne peut pas faire.
                   *
                   * Ce champ disparaît dès que l'adresse de base est saisie.
                   */
                  <Field
                    id="travelKm"
                    label="Distance jusqu’au professionnel"
                    hint={`Le calcul automatique n’est pas encore actif chez ce professionnel. Indiquez une distance approximative si vous la connaissez, sinon laissez vide — il ajustera. ${quoteConfig.travelFreeRadiusKm} km offerts, puis ${formatPrice(quoteConfig.travelFeePerKm)} par km.`}
                  >
                    <input
                      id="travelKm"
                      name="travelKm"
                      type="number"
                      min={0}
                      step={1}
                      className={styles.numberInput}
                      value={travelKm}
                      onChange={(event) => setTravelKm(event.target.value)}
                      aria-describedby="travelKm-hint"
                    />
                  </Field>
                ) : null}
                {currentQuote && currentQuote.travelFee > 0 ? (
                  <p className={styles.travelSummary}>
                    Frais de déplacement : {formatPrice(currentQuote.travelFee)} —{' '}
                    {quoteConfig.travelFreeRadiusKm} km offerts, puis{' '}
                    {formatPrice(quoteConfig.travelFeePerKm)} par kilomètre.
                  </p>
                ) : null}
                {currentQuote && !currentQuote.travelAllowed ? (
                  <FieldError id="travelKm">
                    Cette adresse est hors de la zone d’intervention. Vous pouvez déposer le
                    véhicule à l’atelier.
                  </FieldError>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}

        {activeStep.id === 'creneau' ? (
          <div className={styles.stepBody}>
            <Field id="selectedDay" label="Jour souhaité">
              <input
                id="selectedDay"
                name="selectedDay"
                type="date"
                className={styles.dateInput}
                value={selectedDay}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setSelectedDay(event.target.value)}
              />
            </Field>
            <p className={styles.dayLabel}>{formatDayLabel(selectedDay)}</p>

            {slotsState === 'loading' ? <p>Recherche des créneaux…</p> : null}
            {slotsState === 'error' ? <p role="alert">Les créneaux n’ont pas pu être chargés.</p> : null}
            {slotsState === 'idle' && slots.length === 0 ? (
              <p>Aucun créneau disponible ce jour. Essayez un autre jour.</p>
            ) : null}

            <div className={styles.slotGrid}>
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  className={styles.slotButton}
                  data-selected={selectedSlot?.start === slot.start}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {formatTime(slot.start)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {activeStep.id === 'photos' ? (
          <div className={styles.stepBody}>
            <p className={styles.photoIntro}>
              Vous pouvez réserver sans photo. En ajouter permet à {detailer.name} de préparer
              son matériel et de confirmer le montant avant même de vous voir — c’est la
              meilleure façon d’éviter un ajustement de prix sur place.
              {photoCount > 0 ? ` ${photoCount} photo${photoCount > 1 ? 's' : ''} reçue${photoCount > 1 ? 's' : ''}.` : ''}
            </p>
            <div className={styles.photoGrid}>
              {photoLabels.map((label, index) => (
                <div key={label} className={styles.photoSlot}>
                  <label htmlFor={`photo-${index}`}>{label}</label>
                  <input
                    id={`photo-${index}`}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={photoUploading[index]}
                    onChange={(event) => handlePhotoChange(index, event.target.files?.[0])}
                  />
                  {photoUploading[index] ? <p className={styles.photoStatus}>Envoi en cours…</p> : null}
                  {photos[index] ? <p className={styles.photoStatus}>Photo reçue</p> : null}
                  {photoErrors[index] ? (
                    <FieldError id={`photo-${index}`}>{photoErrors[index]}</FieldError>
                  ) : null}
                </div>
              ))}
            </div>

            <Field id="email" label="E-mail">
              <TextInput
                id="email"
                name="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
            </Field>
            <Field id="phone" label="Téléphone" optional>
              <TextInput
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder={profile.phonePlaceholder}
                value={phone}
                onChange={setPhone}
                autoComplete="tel"
              />
            </Field>

            {currentQuote ? (
              <div className={styles.summary}>
                <p>{revisionNotice(detailer.name)}</p>
                {quoteConfig.depositEnabled ? (
                  <p>
                    <strong>
                      Acompte à régler à la confirmation : {formatPrice(currentQuote.depositAmount)}
                    </strong>
                  </p>
                ) : null}
              </div>
            ) : null}

            {submitError ? (
              <p role="alert" className={styles.submitError}>
                {submitError}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className={styles.actions}>
          <div className={styles.actionsPrice}>
            <span className={styles.actionsPriceLabel}>Estimation</span>
            <span className={styles.actionsPriceValue}>
              {currentQuote ? formatPrice(currentQuote.totalPrice) : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {stepIndex > 0 ? (
              <Button type="button" variant="secondary" onClick={goPrev}>
                Retour
              </Button>
            ) : null}
            {activeStep.id === 'photos' ? (
              <Button
                type="button"
                withArrow
                loading={phase === 'submitting'}
                disabled={!canProceed.photos || !selectedSlot}
                onClick={handleSubmit}
              >
                Confirmer
              </Button>
            ) : (
              <Button type="button" withArrow disabled={!canProceed[activeStep.id]} onClick={goNext}>
                Continuer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
