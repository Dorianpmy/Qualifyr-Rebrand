'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookingButton } from './BookingButton';
import { agencyChannels } from '@/content/agency-channels';
import {
  calculateMonthlyEquivalent, calculateOffer, commitmentMonths, formatMoney, getOptionPrice,
  getRecommendations, options, pricingByRegion, type ActivityId, type ObstacleId, type OptionId,
  type PricingRegion, type SituationId,
} from '@/lib/offer-configurator';
import { useSaleFunnel } from '@/lib/ui/useSaleFunnel';
import styles from './OfferConfigurator.module.css';
import { trackEvent } from '@/lib/analytics';

type PaymentMode = 'spread' | 'standard';

const activities: readonly { id: ActivityId; title: string; description: string }[] = [
  { id: 'automobile', title: 'Nettoyage automobile mobile', description: 'Formules, véhicule, zone d’intervention et demande de rendez-vous.' },
  { id: 'detailing', title: 'Lavage premium à domicile', description: 'Niveau de finition, état du véhicule, préparation et réservation.' },
  { id: 'autre', title: 'Autre activité liée au véhicule', description: 'Detailing, esthétique auto ou nettoyage professionnel. Nous vérifierons d’abord si notre méthode lui correspond.' },
];

const situations: readonly { id: SituationId; title: string; description: string }[] = [
  { id: 'lancement', title: 'Je lance mon activité', description: 'L’offre, les contenus et le parcours restent à poser clairement.' },
  { id: 'recommandation', title: 'Mon activité fonctionne surtout par recommandation', description: 'Le bouche-à-oreille apporte des demandes, mais il explique difficilement toute votre offre.' },
  { id: 'site', title: 'J’ai déjà un site, mais il génère peu de demandes', description: 'Il présente votre activité sans guider suffisamment vers le prochain geste.' },
  { id: 'multicanal', title: 'Mes demandes arrivent par plusieurs canaux', description: 'Appels, messages et formulaires dispersent les informations importantes.' },
  { id: 'croissance', title: 'Je veux structurer une activité qui grandit', description: 'Le fonctionnement actuel doit rester simple lorsque les demandes augmentent.' },
];

const obstacles: readonly { id: ObstacleId; title: string; description: string }[] = [
  { id: 'comparaison', title: 'Mes prestations sont difficiles à comparer', description: 'Le client hésite entre les formules ou doit vous écrire pour comprendre la différence.' },
  { id: 'incompletes', title: 'Les premières demandes sont souvent incomplètes', description: 'Vous devez redemander le lieu, le besoin, les dates ou les informations utiles.' },
  { id: 'echanges', title: 'La réservation nécessite trop d’échanges', description: 'Plusieurs messages sont nécessaires avant de confirmer la prestation et le créneau.' },
  { id: 'image', title: 'Mon site ne reflète pas la qualité de mon travail', description: 'Votre savoir-faire rassure une fois expliqué, mais sa présentation ne le montre pas encore.' },
  { id: 'retour', title: 'Le suivi s’arrête après la prestation', description: 'Les avis et les nouvelles réservations dépendent encore d’une relance irrégulière.' },
];

const assurances = [
  'Estimation transparente avant l’échange',
  'Aucun engagement avant validation du devis',
  'Parcours adapté à votre fonctionnement',
  'Même coût total, quel que soit le rythme choisi',
  '14 jours d’essai gratuit inclus par défaut',
  'Support dédié pendant la phase de démarrage',
] as const;

export function OfferConfigurator({ showIntro = true }: { showIntro?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageTitleRef = useRef<HTMLElement>(null);
  const {
    step,
    setStep,
    started: _funnelStarted,
    completed: _funnelCompleted,
    progress,
  } = useSaleFunnel({
    showIntro,
    onEvent: (event, payload) => {
      if (event === 'started') {
        trackEvent('estimation_started', { pagePath: '/estimation', ctaId: 'estimation_start', vertical: payload?.step !== undefined ? undefined : undefined });
      } else if (event === 'completed') {
        trackEvent('estimation_completed', { pagePath: '/estimation', vertical: undefined });
      }
    },
  });
  const [activity, setActivity] = useState<ActivityId | null>(null);
  const [situation, setSituation] = useState<SituationId | null>(null);
  const [obstacle, setObstacle] = useState<ObstacleId | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<OptionId[]>([]);
  const [pricingRegion, setPricingRegion] = useState<PricingRegion>('euro');
  const [pricingReady, setPricingReady] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('spread');

  const recommendation = useMemo(
    () => activity && situation && obstacle ? getRecommendations(activity, situation, obstacle, selectedOptions) : [],
    [activity, situation, obstacle, selectedOptions],
  );
  const price = useMemo(() => calculateOffer(selectedOptions, pricingRegion), [selectedOptions, pricingRegion]);
  const pricing = pricingByRegion[pricingRegion];
  const monthlyEquivalent = calculateMonthlyEquivalent(price.firstYearTotal);
  const initialPayment = pricing.setupPrice + price.optionTotal;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function detectPricingRegion() {
      try {
        const response = await fetch('/api/pricing-region', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (
          active
          && typeof data === 'object'
          && data !== null
          && 'region' in data
          && (data.region === 'euro' || data.region === 'switzerland')
        ) {
          setPricingRegion(data.region);
        }
      } catch {
        // L'euro reste le repli sûr lorsque la détection de l'hébergeur est indisponible.
      } finally {
        if (active) setPricingReady(true);
      }
    }

    void detectPricingRegion();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (step === 0) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rootRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    window.requestAnimationFrame(() => stageTitleRef.current?.focus({ preventScroll: true }));
  }, [step]);

  const selectedActivity = activities.find((item) => item.id === activity);
  const selectedSituation = situations.find((item) => item.id === situation);
  const selectedObstacle = obstacles.find((item) => item.id === obstacle);
  const selectedOptionDetails = options
    .filter((item) => selectedOptions.includes(item.id))
    .map((item) => ({ ...item, regionalPrice: getOptionPrice(item.id, pricingRegion) }));
  const paymentPreference = paymentMode === 'spread'
    ? `${formatMoney(monthlyEquivalent, pricingRegion, 2)}/mois pendant ${commitmentMonths} mois`
    : `${formatMoney(initialPayment, pricingRegion)} au démarrage puis ${formatMoney(pricing.monthlyPrice, pricingRegion)}/mois pendant ${commitmentMonths} mois`;
  const message = [
    'Bonjour, je souhaite discuter de ce parcours avec Qualifyr.', '',
    `Activité : ${selectedActivity?.title ?? ''}`,
    `Situation : ${selectedSituation?.title ?? ''}`,
    `Frein principal : ${selectedObstacle?.title ?? ''}`,
    `Parcours recommandé : ${recommendation.map((item) => item.title).join(', ')}`,
    `Grille tarifaire : ${pricing.label}`,
    selectedOptionDetails.length
      ? `Options envisagées : ${selectedOptionDetails.map((item) => `${item.title} (+${formatMoney(item.regionalPrice, pricingRegion)})`).join(', ')}`
      : 'Options envisagées : aucune pour le moment',
    `Prix : ${formatMoney(pricing.setupPrice, pricingRegion)} de mise en place puis ${formatMoney(pricing.monthlyPrice, pricingRegion)}/mois pendant ${commitmentMonths} mois`,
    `Préférence de paiement : ${paymentPreference}`,
    `Total indicatif sur 12 mois : ${formatMoney(price.firstYearTotal, pricingRegion)}`,
  ].filter(Boolean).join('\n');
  const whatsappHref = agencyChannels.whatsappNumber
    ? `https://wa.me/${agencyChannels.whatsappNumber}?text=${encodeURIComponent(message)}`
    : '/contact';

  const toggleOption = (id: OptionId) => setSelectedOptions((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
  );
  const canContinue = [Boolean(activity), Boolean(situation), Boolean(obstacle), true][step] ?? false;
  const goTo = (nextStep: number) => {
    setStep(Math.max(0, Math.min(4, nextStep)));
  };
  const captureStageTitle = (node: HTMLElement | null) => { stageTitleRef.current = node; };

  const regionalPricingNotice = (
    <div className={styles.currencyNote} aria-live="polite" aria-busy={!pricingReady}>
      <span>{pricingReady ? `Tarifs affichés en ${pricing.currency === 'CHF' ? 'francs suisses' : 'euros'}` : 'Ajustement de la devise…'}</span>
      <small>La devise est adaptée automatiquement à votre zone.</small>
    </div>
  );

  const paymentChoice = (
    <fieldset className={styles.paymentChoice}>
      <legend>Rythme de paiement</legend>
      <div>
        <label data-selected={paymentMode === 'spread'}>
          <input type="radio" name="payment-mode" checked={paymentMode === 'spread'} onChange={() => setPaymentMode('spread')} />
          <span><strong>Mensualisé sur 12 mois</strong><small>Création et suivi réunis dans 12 mensualités.</small></span>
        </label>
        <label data-selected={paymentMode === 'standard'}>
          <input type="radio" name="payment-mode" checked={paymentMode === 'standard'} onChange={() => setPaymentMode('standard')} />
          <span><strong>Mise en place + suivi</strong><small>La création au démarrage, puis le suivi mensuel.</small></span>
        </label>
      </div>
    </fieldset>
  );

  const choiceCards = <T extends string,>(name: string, items: readonly { id: T; title: string; description: string }[], value: T | null, choose: (id: T) => void) => (
    <div className={styles.choiceGrid}>
      {items.map((item, index) => (
        <label className={styles.choice} data-selected={value === item.id} key={item.id}>
          <input type="radio" name={name} checked={value === item.id} onChange={() => choose(item.id)} />
          <span className={styles.choiceNumber}>0{index + 1}</span>
          <strong>{item.title}</strong>
          <small>{item.description}</small>
        </label>
      ))}
    </div>
  );

  return (
    <div className={styles.configurator} ref={rootRef}>
      {showIntro ? (
        <div className={styles.intro}>
          <p className={styles.kicker}>Votre parcours en quelques choix</p>
          <h2>Construisons une première recommandation.</h2>
          <p>Trois réponses suffisent pour obtenir une recommandation et une estimation complète, adaptée à votre zone de facturation.</p>
        </div>
      ) : null}
      <div className={styles.shell}>
        <div className={styles.progressBlock} aria-label={`Étape ${step + 1} sur 5`}>
          <div className={styles.progressText}><span>0{step + 1} / 05</span><span>{progress} %</span></div>
          <div className={styles.progress} aria-hidden="true"><span style={{ inlineSize: `${progress}%` }} /></div>
        </div>
        <div className={styles.stage} aria-live="polite">
          {step === 0 && <fieldset className={styles.step}>
            <legend ref={captureStageTitle}>Quelle activité souhaitez-vous développer&nbsp;?</legend>
            <p>Nous adapterons les informations demandées à votre métier.</p>
            {choiceCards('activity', activities, activity, setActivity)}
          </fieldset>}
          {step === 1 && <fieldset className={styles.step}>
            <legend ref={captureStageTitle} tabIndex={-1}>Où en êtes-vous aujourd’hui&nbsp;?</legend>
            <p>Choisissez la situation qui ressemble le plus à votre fonctionnement actuel.</p>
            {choiceCards('situation', situations, situation, setSituation)}
          </fieldset>}
          {step === 2 && <fieldset className={styles.step}>
            <legend ref={captureStageTitle} tabIndex={-1}>Qu’est-ce qui vous fait perdre le plus d’occasions aujourd’hui&nbsp;?</legend>
            <p>Retenez le point qui crée le plus d’hésitations ou d’échanges inutiles.</p>
            {choiceCards('obstacle', obstacles, obstacle, setObstacle)}
          </fieldset>}
          {step === 3 && <div className={styles.recommendation}>
            <div className={styles.recommendationHeading}>
              <p className={styles.kicker}>Parcours recommandé</p>
              <h3 ref={captureStageTitle} tabIndex={-1}>Voici ce qui répond à votre situation.</h3>
              <p>Le socle est ajusté à vos réponses. Ajoutez seulement les compléments utiles à votre fonctionnement.</p>
            </div>
            <ol className={styles.recommendationList}>{recommendation.map((item, index) =>
              <li key={item.id}><span>0{index + 1}</span><div><strong>{item.title}</strong><p>{item.description}</p></div></li>,
            )}</ol>
            <fieldset className={styles.optionFieldset}>
              <legend>Compléments facultatifs</legend>
              <p>Ajoutez uniquement ce qui vous serait utile. L’estimation se met à jour immédiatement.</p>
              <div className={styles.options}>{options.map((item) => {
                const recommended = obstacle ? (item.recommendedFor as readonly ObstacleId[]).includes(obstacle) : false;
                return <label className={styles.option} data-selected={selectedOptions.includes(item.id)} key={item.id}>
                  <input type="checkbox" checked={selectedOptions.includes(item.id)} onChange={() => toggleOption(item.id)} />
                  <span>{recommended ? <em>Recommandé pour votre situation</em> : null}<strong>{item.title}</strong><small>{item.description}</small></span>
                  <b>{pricingReady ? `+${formatMoney(getOptionPrice(item.id, pricingRegion), pricingRegion)}` : '—'}</b>
                </label>;
              })}</div>
            </fieldset>
            <div className={styles.livePrice} aria-live="polite" aria-busy={!pricingReady}>
              {regionalPricingNotice}
              <p className={styles.priceKicker}>Formule mensualisée</p>
              <div className={styles.monthlyPrice}>
                <strong>{pricingReady ? formatMoney(monthlyEquivalent, pricingRegion, 2) : '—'}</strong>
                <span>par mois</span>
              </div>
              <p className={styles.monthlyCaption}>{commitmentMonths} mensualités, création et suivi inclus.</p>
              <div className={styles.compactBreakdown}>
                <span><b>Autre possibilité</b>{pricingReady ? formatMoney(initialPayment, pricingRegion) : '—'} au démarrage, puis {pricingReady ? formatMoney(pricing.monthlyPrice, pricingRegion) : '—'}/mois.</span>
                <small>Total indicatif : {pricingReady ? formatMoney(price.firstYearTotal, pricingRegion) : '—'}</small>
              </div>
            </div>
          </div>}
          {step === 4 && <div className={styles.result}>
            <div className={styles.resultCopy}>
              <p className={styles.kicker}>Votre estimation</p>
              <h3 ref={captureStageTitle} tabIndex={-1}>Une estimation claire, sans prix caché.</h3>
              <dl className={styles.summary}>
                <div><dt>Activité</dt><dd>{selectedActivity?.title}</dd></div>
                <div><dt>Situation</dt><dd>{selectedSituation?.title}</dd></div>
                <div><dt>Priorité</dt><dd>{selectedObstacle?.title}</dd></div>
              </dl>
              <ul className={styles.assurances}>{assurances.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <aside className={styles.priceCard} aria-label={`Détail de l’estimation — ${pricing.label}`}>
              {regionalPricingNotice}
              {paymentChoice}
              <div className={styles.paymentSummary} aria-live="polite" aria-busy={!pricingReady}>
                <p>{paymentMode === 'spread' ? 'Mensualité estimée' : 'À régler au démarrage'}</p>
                <strong>{pricingReady
                  ? paymentMode === 'spread'
                    ? formatMoney(monthlyEquivalent, pricingRegion, 2)
                    : formatMoney(initialPayment, pricingRegion)
                  : '—'}</strong>
                <span>{paymentMode === 'spread'
                  ? `${commitmentMonths} mensualités · création et suivi inclus`
                  : `puis ${pricingReady ? formatMoney(pricing.monthlyPrice, pricingRegion) : '—'} par mois pendant ${commitmentMonths} mois`}</span>
              </div>
              <div className={styles.selectedOptions}><p>Options ponctuelles</p>
                {selectedOptionDetails.length ? selectedOptionDetails.map((item) => <div className={styles.priceLine} key={item.id}><span>{item.title}</span><b>+{formatMoney(item.regionalPrice, pricingRegion)}</b></div>) : <span>Aucune option sélectionnée</span>}
              </div>
              <div className={styles.total}><span>Coût total indicatif sur 12 mois</span><strong>{pricingReady ? formatMoney(price.firstYearTotal, pricingRegion) : '—'}</strong><small>Le rythme choisi ne change pas ce total.</small></div>
              <a className={styles.cta} href={whatsappHref} target={agencyChannels.whatsappNumber ? '_blank' : undefined} rel={agencyChannels.whatsappNumber ? 'noopener noreferrer' : undefined} data-analytics-event={agencyChannels.whatsappNumber ? 'whatsapp_direct_opened' : undefined} data-analytics-cta-id="estimation_whatsapp" data-analytics-destination={agencyChannels.whatsappNumber ? 'whatsapp' : 'contact'}>{agencyChannels.whatsappNumber ? 'Discuter de ce parcours sur WhatsApp' : 'Demander mon audit de parcours'}</a>
              <BookingButton ctaId="estimation_booking" variant="inverseSecondary">Réserver une analyse de parcours</BookingButton>
              <div className={styles.trialBadge}>
                <span className={styles.trialIcon} aria-hidden="true">✓</span>
                <span className={styles.trialText}>
                  <strong>14 jours d’essai gratuit</strong>
                  <small>Inclut le support dédié et l’accès complet au tunnel.</small>
                </span>
              </div>
              <button type="button" className={styles.modify} onClick={() => goTo(0)}>Modifier mes réponses</button>
              <small>Cette estimation doit être confirmée après cadrage. Seuls le devis et le contrat fixent le périmètre, les taxes et les conditions.</small>
            </aside>
          </div>}
        </div>
        {step < 4 && <div className={styles.navigation}>
          {step > 0 ? <button type="button" className={styles.back} onClick={() => goTo(step - 1)}>Retour</button> : <span />}
          <button type="button" className={styles.next} disabled={!canContinue || (step === 3 && !pricingReady)} onClick={() => goTo(step + 1)}>{step === 3 ? 'Voir mon estimation' : 'Continuer'} <span aria-hidden="true">→</span></button>
        </div>}
      </div>
    </div>
  );
}
