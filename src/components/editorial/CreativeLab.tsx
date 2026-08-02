'use client';

import { useId, useRef, useState } from 'react';
import { BookingButton } from '@/components/agency/BookingButton';
import { creativeLab, type CreativeLabItem } from '@/content/creative-lab';
import styles from './CreativeLab.module.css';

const identityColors = ['#171513', '#30231e', '#8b452f', '#d9cbb8', '#f5f0e7'] as const;

function ConceptVisual({ type }: { type: CreativeLabItem['visual'] }) {
  if (type === 'conciergerie') {
    return (
      <div className={`${styles.conceptVisual} ${styles.conciergeVisual}`} aria-hidden="true">
        <span className={styles.conciergeMark}>C</span>
        <div className={styles.conciergeCard}>
          <small>Votre demande</small>
          <strong>Chaque détail au bon moment</strong>
          <i />
        </div>
        <ol><li>Comprendre</li><li>Préciser</li><li>Confirmer</li></ol>
      </div>
    );
  }

  if (type === 'identity') {
    return (
      <div className={`${styles.conceptVisual} ${styles.identityVisual}`} aria-hidden="true">
        <div className={styles.identityType}>Aa</div>
        <div className={styles.identityCard}>
          <span>Nom de marque</span>
          <b>Une signature cohérente.</b>
        </div>
        <div className={styles.swatches}>
          {identityColors.map((color) => <i style={{ backgroundColor: color }} key={color} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.conceptVisual} ${styles.motionVisual}`} aria-hidden="true">
      <div className={styles.motionFrame}><span>01</span><strong>Comprendre</strong><i /></div>
      <div className={styles.motionFrame}><span>02</span><strong>Choisir</strong><i /></div>
      <div className={styles.motionLine} />
    </div>
  );
}

export function CreativeLab() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [activeItem, setActiveItem] = useState<CreativeLabItem | null>(null);

  function openConcept(item: CreativeLabItem, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setActiveItem(item);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  }

  function closeConcept() {
    dialogRef.current?.close();
  }

  function restoreFocus() {
    setActiveItem(null);
    lastTriggerRef.current?.focus();
  }

  return (
    <>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>{creativeLab.eyebrow}</p>
          <h2>{creativeLab.title}</h2>
        </div>
        <div className={styles.headingCopy}>
          <p>{creativeLab.subtitle}</p>
          <small>{creativeLab.disclaimer}</small>
        </div>
      </div>

      <div className={styles.grid}>
        {creativeLab.items.map((item, index) => (
          <article
            className={`${styles.card} ${item.visual === 'conciergerie' ? styles.primary : styles.secondary}`}
            data-visual={item.visual}
            key={item.id}
          >
            <div className={styles.media}>
              <ConceptVisual type={item.visual} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.meta}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <b data-status={item.status}>{item.statusLabel}</b>
              </div>
              <small className={styles.category}>{item.subtitle}</small>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.explores ? (
                <ul className={styles.axes} aria-label="Axes explorés">
                  {item.explores.slice(0, 3).map((point) => <li key={point}>{point}</li>)}
                </ul>
              ) : null}
              <span className={styles.cardAction}>Explorer le concept <b aria-hidden="true">→</b></span>
            </div>
            <button
              type="button"
              className={styles.clickTarget}
              aria-label={`Explorer le concept ${item.title}`}
              onClick={(event) => openConcept(item, event.currentTarget)}
            />
          </article>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        onClose={restoreFocus}
      >
        {activeItem ? (
          <div className={styles.dialogShell}>
            <div className={styles.dialogHeader}>
              <div>
                <p>{activeItem.statusLabel}</p>
                <h2 id={titleId}>{activeItem.title}</h2>
              </div>
              <button type="button" aria-label="Fermer le concept" onClick={closeConcept}>×</button>
            </div>
            <ConceptVisual type={activeItem.visual} />
            <div className={styles.dialogCopy}>
              <div>
                <p>{activeItem.modalContent}</p>
                <small>{activeItem.status === 'coming-soon' ? 'Exploration créative en préparation.' : creativeLab.disclaimer}</small>
              </div>
              <div>
                <h3>Axes explorés</h3>
                <ul>{activeItem.explores?.slice(0, 3).map((point) => <li key={point}>{point}</li>)}</ul>
              </div>
            </div>
            <div className={styles.dialogFooter}>
              <BookingButton ctaId="laboratoire_booking" onClick={closeConcept}>
                Parler de mon projet
              </BookingButton>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
