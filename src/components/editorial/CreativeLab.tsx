'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { BookingButton } from '@/components/agency/BookingButton';
import { WhatsAppDiagnosticButton } from '@/components/agency/WhatsAppDiagnostic';
import { creativeLab, type CreativeLabItem } from '@/content/creative-lab';
import styles from './CreativeLab.module.css';

const curatedPalettes = [
  { name: 'Terre', colors: ['#171513', '#30231e', '#8b452f', '#d9cbb8', '#f5f0e7'] },
  { name: 'Minéral', colors: ['#201f1d', '#55504a', '#8d8277', '#d8d1c8', '#f7f4ee'] },
  { name: 'Éditorial', colors: ['#151515', '#3b302a', '#a9573f', '#c9aa7a', '#fbf7ef'] },
] as const;

const conciergeScenarios = {
  sejour: { label: 'Préparer un séjour', eyebrow: 'Votre séjour', title: 'Chaque détail au bon moment', steps: ['Découvrir', 'Préciser', 'Confirmer'] },
  service: { label: 'Organiser un service', eyebrow: 'Votre demande', title: 'Un besoin clairement cadré', steps: ['Comprendre', 'Organiser', 'Coordonner'] },
  accompagnement: { label: 'Être accompagné', eyebrow: 'Votre situation', title: 'Un accompagnement plus lisible', steps: ['Écouter', 'Préparer', 'Accompagner'] },
} as const;

function ConceptVisual({ type, palette, conciergeScenario = 'sejour' }: { type: CreativeLabItem['visual']; palette?: readonly string[]; conciergeScenario?: keyof typeof conciergeScenarios }) {
  if (type === 'conciergerie') {
    const scenario = conciergeScenarios[conciergeScenario];
    return (
      <div className={`${styles.conceptVisual} ${styles.conciergeVisual}`} aria-hidden="true">
        <span className={styles.conciergeMark}>C</span>
        <div className={styles.conciergeCard}><small>{scenario.eyebrow}</small><strong>{scenario.title}</strong><i /></div>
        <ol>{scenario.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      </div>
    );
  }
  if (type === 'identity') {
    const colors = palette ?? curatedPalettes[0].colors;
    const paletteStyle = { '--palette-dark': colors[0], '--palette-paper': colors[4] } as CSSProperties;
    return (
      <div className={`${styles.conceptVisual} ${styles.identityVisual}`} style={paletteStyle} aria-hidden="true">
        <div className={styles.identityType}>Aa</div>
        <div className={styles.identityCard}><span>Nom de marque</span><b>Une signature cohérente.</b></div>
        <div className={styles.swatches}>{colors.map((color) => <i style={{ backgroundColor: color }} key={color} />)}</div>
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
  const titleId = useId();
  const [activeItem, setActiveItem] = useState<CreativeLabItem | null>(null);
  const [palette, setPalette] = useState<string[]>([...curatedPalettes[0].colors]);
  const [conciergeScenario, setConciergeScenario] = useState<keyof typeof conciergeScenarios>('sejour');

  useEffect(() => {
    if (!activeItem) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dialogRef.current?.close();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [activeItem]);

  const openConcept = (item: CreativeLabItem) => {
    setActiveItem(item);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };

  return (
    <>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>{creativeLab.eyebrow}</p>
          <h2>{creativeLab.title}</h2>
        </div>
        <p>{creativeLab.subtitle}</p>
      </div>
      <p className={styles.disclaimer}>{creativeLab.disclaimer}</p>

      <div className={styles.grid}>
        {creativeLab.items.map((item) => {
          const content = (
            <>
              <div className={styles.media}>
                {item.image ? (
                  <Image src={item.image.src} alt={item.image.alt} width={item.image.width} height={item.image.height} sizes="(min-width: 62rem) 66vw, 100vw" unoptimized />
                ) : <ConceptVisual type={item.visual} />}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.meta}><span data-status={item.status}>{item.statusLabel}</span><small>{item.subtitle}</small></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className={styles.cardAction}>{item.href ? 'Découvrir le projet' : 'Explorer le concept'} <b aria-hidden="true">→</b></span>
              </div>
            </>
          );
          return item.href ? (
            <Link href={item.href} className={`${styles.card} ${item.featured ? styles.featured : ''}`} key={item.id}>{content}</Link>
          ) : (
            <button type="button" className={styles.card} onClick={() => openConcept(item)} key={item.id}>{content}</button>
          );
        })}
      </div>

      <div className={styles.sectionCta}>
        <div><h3>Votre activité mérite une présentation qui lui ressemble.</h3><p>Parlons de votre offre, de votre image et du parcours le plus adapté à vos prospects.</p></div>
        <div className={styles.actions}><BookingButton withArrow>Réserver un échange</BookingButton><WhatsAppDiagnosticButton variant="secondary">Faire le diagnostic WhatsApp</WhatsAppDiagnosticButton></div>
      </div>

      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onClose={() => setActiveItem(null)}>
        {activeItem && (
          <div className={styles.dialogShell}>
            <header><div><p>{activeItem.statusLabel}</p><h2 id={titleId}>{activeItem.title}</h2></div><button type="button" aria-label="Fermer le concept" onClick={() => dialogRef.current?.close()}>×</button></header>
            <ConceptVisual
              type={activeItem.visual}
              conciergeScenario={conciergeScenario}
              {...(activeItem.visual === 'identity' ? { palette } : {})}
            />
            {activeItem.visual === 'identity' && (
              <section className={styles.workshop} aria-labelledby={`${titleId}-palette`}>
                <div><p>Atelier palette</p><h3 id={`${titleId}-palette`}>Trouvez une harmonie qui vous ressemble.</h3></div>
                <div className={styles.paletteChoices}>
                  {curatedPalettes.map((choice) => (
                    <button type="button" onClick={() => setPalette([...choice.colors])} key={choice.name}>
                      <span>{choice.colors.map((color) => <i style={{ backgroundColor: color }} key={color} />)}</span>
                      <b>{choice.name}</b>
                    </button>
                  ))}
                </div>
                <fieldset className={styles.customPalette}>
                  <legend>Ou composez votre palette</legend>
                  {palette.map((color, index) => (
                    <label key={`${index}-${color}`}><span>Couleur {index + 1}</span><input type="color" value={color} onChange={(event) => setPalette((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>
                  ))}
                </fieldset>
              </section>
            )}
            {activeItem.visual === 'conciergerie' && (
              <section className={styles.workshop} aria-labelledby={`${titleId}-scenario`}>
                <div><p>Parcours interactif</p><h3 id={`${titleId}-scenario`}>Quel besoin souhaitez-vous mettre en scène ?</h3></div>
                <div className={styles.scenarioChoices}>
                  {Object.entries(conciergeScenarios).map(([id, scenario]) => (
                    <button type="button" data-selected={conciergeScenario === id} onClick={() => setConciergeScenario(id as keyof typeof conciergeScenarios)} key={id}>{scenario.label}</button>
                  ))}
                </div>
              </section>
            )}
            <div className={styles.dialogCopy}>
              <div><p>{activeItem.modalContent}</p><small>{activeItem.status === 'coming-soon' ? 'Concept créatif en cours de développement.' : creativeLab.disclaimer}</small></div>
              <div><h3>Ce que ce concept explore</h3><ul>{activeItem.explores?.map((point) => <li key={point}>{point}</li>)}</ul></div>
            </div>
            <footer><WhatsAppDiagnosticButton onClick={() => dialogRef.current?.close()}>Parler de mon projet</WhatsAppDiagnosticButton></footer>
          </div>
        )}
      </dialog>
    </>
  );
}
