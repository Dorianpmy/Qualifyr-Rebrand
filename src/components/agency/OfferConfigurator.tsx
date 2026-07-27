'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookingButton } from './BookingButton';
import { agencyChannels } from '@/content/agency-channels';
import {
  calculateOffer, commitmentMonths, formatPrice, getRecommendations, monthlyPrice, options,
  setupPrice, type ActivityId, type ObstacleId, type OptionId, type SituationId,
} from '@/lib/offer-configurator';
import styles from './OfferConfigurator.module.css';

const activities: readonly { id: ActivityId; title: string; description: string }[] = [
  { id: 'automobile', title: 'Nettoyage automobile mobile', description: 'Formules, véhicule, zone d’intervention et demande de rendez-vous.' },
  { id: 'detailing', title: 'Detailing à domicile', description: 'Niveau de finition, état du véhicule, préparation et réservation.' },
  { id: 'conciergerie', title: 'Conciergerie', description: 'Besoin, séjour, périmètre de l’accompagnement et prise de contact.' },
  { id: 'autre', title: 'Autre demande de service', description: 'Présentez votre activité. Nous vérifierons d’abord si notre méthode lui correspond.' },
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
  'Vision claire du coût complet',
] as const;

export function OfferConfigurator() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageTitleRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [activity, setActivity] = useState<ActivityId | null>(null);
  const [situation, setSituation] = useState<SituationId | null>(null);
  const [obstacle, setObstacle] = useState<ObstacleId | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<OptionId[]>([]);

  const recommendation = useMemo(
    () => activity && situation && obstacle ? getRecommendations(activity, situation, obstacle, selectedOptions) : [],
    [activity, situation, obstacle, selectedOptions],
  );
  const price = useMemo(() => calculateOffer(selectedOptions), [selectedOptions]);

  useEffect(() => {
    if (step === 0) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rootRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    window.requestAnimationFrame(() => stageTitleRef.current?.focus({ preventScroll: true }));
  }, [step]);

  const selectedActivity = activities.find((item) => item.id === activity);
  const selectedSituation = situations.find((item) => item.id === situation);
  const selectedObstacle = obstacles.find((item) => item.id === obstacle);
  const selectedOptionDetails = options.filter((item) => selectedOptions.includes(item.id));
  const message = [
    'Bonjour, je souhaite discuter de ce parcours avec Qualifyr.', '',
    `Activité : ${selectedActivity?.title ?? ''}`,
    `Situation : ${selectedSituation?.title ?? ''}`,
    `Frein principal : ${selectedObstacle?.title ?? ''}`,
    `Parcours recommandé : ${recommendation.map((item) => item.title).join(', ')}`,
    selectedOptionDetails.length
      ? `Options envisagées : ${selectedOptionDetails.map((item) => `${item.title} (+${formatPrice(item.price)} €)`).join(', ')}`
      : 'Options envisagées : aucune pour le moment',
    `Prix : ${formatPrice(setupPrice)} € de mise en place puis ${monthlyPrice} €/mois pendant ${commitmentMonths} mois`,
    `Total indicatif sur 12 mois : ${formatPrice(price.firstYearTotal)} €`,
  ].join('\n');
  const whatsappHref = agencyChannels.whatsappNumber
    ? `https://wa.me/${agencyChannels.whatsappNumber}?text=${encodeURIComponent(message)}`
    : '/contact';

  const toggleOption = (id: OptionId) => setSelectedOptions((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
  );
  const canContinue = [Boolean(activity), Boolean(situation), Boolean(obstacle), true][step] ?? false;
  const goTo = (nextStep: number) => setStep(Math.max(0, Math.min(4, nextStep)));
  const captureStageTitle = (node: HTMLElement | null) => { stageTitleRef.current = node; };

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
      <div className={styles.intro}>
        <p className={styles.kicker}>Votre parcours en quelques choix</p>
        <h2>Construisons une première recommandation.</h2>
        <p>Trois réponses suffisent pour afficher un parcours adapté et son coût complet.</p>
      </div>
      <div className={styles.shell}>
        <div className={styles.progressBlock} aria-label={`Étape ${step + 1} sur 5`}>
          <div className={styles.progressText}><span>0{step + 1} / 05</span><span>{Math.round(((step + 1) / 5) * 100)} %</span></div>
          <div className={styles.progress} aria-hidden="true"><span style={{ inlineSize: `${((step + 1) / 5) * 100}%` }} /></div>
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
              <legend>Compléments possibles</legend>
              <div className={styles.options}>{options.map((item) => {
                const recommended = obstacle ? (item.recommendedFor as readonly ObstacleId[]).includes(obstacle) : false;
                return <label className={styles.option} data-selected={selectedOptions.includes(item.id)} key={item.id}>
                  <input type="checkbox" checked={selectedOptions.includes(item.id)} onChange={() => toggleOption(item.id)} />
                  <span>{recommended ? <em>Adapté à votre réponse</em> : null}<strong>{item.title}</strong><small>{item.description}</small></span>
                  <b>+{formatPrice(item.price)} €</b>
                </label>;
              })}</div>
            </fieldset>
            <div className={styles.livePrice} aria-live="polite"><span>Estimation actuelle</span><strong>{formatPrice(price.firstYearTotal)} €</strong><small>au total sur 12 mois</small></div>
          </div>}
          {step === 4 && <div className={styles.result}>
            <div className={styles.resultCopy}>
              <p className={styles.kicker}>Votre estimation</p>
              <h3 ref={captureStageTitle} tabIndex={-1}>Un parcours clair, avec un coût lisible.</h3>
              <dl className={styles.summary}>
                <div><dt>Activité</dt><dd>{selectedActivity?.title}</dd></div>
                <div><dt>Situation</dt><dd>{selectedSituation?.title}</dd></div>
                <div><dt>Priorité</dt><dd>{selectedObstacle?.title}</dd></div>
              </dl>
              <ul className={styles.assurances}>{assurances.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <aside className={styles.priceCard} aria-label="Détail de l’estimation">
              <div className={styles.priceLine}><span>Mise en place</span><b>{formatPrice(setupPrice)} €</b></div>
              <div className={styles.priceLine}><span>Accompagnement</span><b>{monthlyPrice} € / mois</b></div>
              <p className={styles.commitment}>Pendant {commitmentMonths} mois</p>
              <div className={styles.selectedOptions}><p>Options ponctuelles</p>
                {selectedOptionDetails.length ? selectedOptionDetails.map((item) => <div className={styles.priceLine} key={item.id}><span>{item.title}</span><b>+{formatPrice(item.price)} €</b></div>) : <span>Aucune option sélectionnée</span>}
              </div>
              <div className={styles.total}><span>Coût total sur 12 mois</span><strong>{formatPrice(price.firstYearTotal)} €</strong></div>
              <a className={styles.cta} href={whatsappHref} target={agencyChannels.whatsappNumber ? '_blank' : undefined} rel={agencyChannels.whatsappNumber ? 'noopener noreferrer' : undefined}>Discuter de ce parcours sur WhatsApp</a>
              <BookingButton variant="inverseSecondary">Réserver un échange</BookingButton>
              <button type="button" className={styles.modify} onClick={() => goTo(0)}>Modifier mes réponses</button>
              <small>Cette estimation doit être confirmée après cadrage. Seuls le devis et le contrat fixent le périmètre, les taxes et les conditions.</small>
            </aside>
          </div>}
        </div>
        {step < 4 && <div className={styles.navigation}>
          {step > 0 ? <button type="button" className={styles.back} onClick={() => goTo(step - 1)}>Retour</button> : <span />}
          <button type="button" className={styles.next} disabled={!canContinue} onClick={() => goTo(step + 1)}>{step === 3 ? 'Voir le prix complet' : 'Continuer'} <span aria-hidden="true">→</span></button>
        </div>}
      </div>
    </div>
  );
}
