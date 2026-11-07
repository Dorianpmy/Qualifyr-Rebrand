import type { CSSProperties, ReactNode } from 'react';
import { vehicleSizeCopy } from '@/components/detailing/content';
import type { VehicleSize } from '@/lib/detailing/types';
import styles from './HeroPhone.module.css';

/**
 * Maquette de téléphone du hero de l'accueil — `docs/05-composants.md`,
 * « Hero de l'accueil en deux colonnes » (version 2, 7 novembre 2026), et
 * l'exception de couleurs `docs/03-direction-artistique.md` §7.2.
 *
 * Composant serveur, sans JavaScript côté client : téléphone, fond d'écran et
 * cartes en CSS pur ; le flottement est une animation CSS coupée sous
 * `prefers-reduced-motion` (Framer Motion n'est pas une dépendance du projet).
 *
 * **Toutes les dimensions sont en `em`.** La scène prend la taille de police
 * `min(16px, largeur de la colonne / 34)` : tout le visuel se réduit d'un bloc
 * avec sa colonne, sans recalculer chaque position par point de rupture, et
 * sans jamais déborder horizontalement.
 *
 * **Règle WebKit.** Tout ce qui est transformé (inclinaison du téléphone,
 * rotation et flottement des cartes) est un élément externe qui ne peint rien ;
 * fond, rayon et ombre sont portés par un élément interne sans
 * transformation. Peindre et transformer le même élément fait apparaître un
 * rectangle opaque sur WebKit.
 *
 * **Aucun logo ni icône d'application reproduits** (§7.2) : pictogrammes
 * génériques sur tuiles de couleur, Stripe nommé en texte.
 */

const SIZES: readonly VehicleSize[] = ['citadine', 'berline', 'suv'];
const ACTIVE_SIZE: VehicleSize = 'suv';

/* ---------- Pictogrammes génériques ---------- */

function Glyph({ children, filled = false }: { readonly children: ReactNode; readonly filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={styles.glyph}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const glyphs = {
  handset: (
    <Glyph filled>
      <path d="M6.6 3.5c.5-.4 1.2-.3 1.6.2l2 2.6c.4.5.3 1.2-.1 1.6l-1.3 1.2c.9 1.9 2.4 3.5 4.3 4.4l1.3-1.3c.4-.4 1.1-.5 1.6-.1l2.6 2c.5.4.6 1.1.2 1.6l-1.4 1.8c-.6.8-1.7 1.1-2.6.8-5-1.6-8.9-5.5-10.5-10.5-.3-.9 0-2 .8-2.6l1.5-1.7Z" />
    </Glyph>
  ),
  bubble: (
    <Glyph filled>
      <path d="M12 3.5c4.7 0 8.5 3.3 8.5 7.6s-3.8 7.6-8.5 7.6c-1 0-2-.1-2.9-.4L5 20l1-3.4c-1.6-1.4-2.5-3.3-2.5-5.5 0-4.3 3.8-7.6 8.5-7.6Z" />
    </Glyph>
  ),
  compass: (
    <Glyph>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" />
    </Glyph>
  ),
  picture: (
    <Glyph>
      <rect x="3.5" y="5" width="17" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4.5 17 4.5-4 3.5 3 3-2.5 4 3.5" />
    </Glyph>
  ),
  calendar: (
    <Glyph>
      <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
      <path d="M4 10h16M8.5 3.5v3M15.5 3.5v3" />
    </Glyph>
  ),
  clock: (
    <Glyph>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Glyph>
  ),
  pin: (
    <Glyph>
      <path d="M12 20.5s6-5.4 6-10.2a6 6 0 0 0-12 0c0 4.8 6 10.2 6 10.2Z" />
      <circle cx="12" cy="10.3" r="2.2" />
    </Glyph>
  ),
  camera: (
    <Glyph>
      <path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z" />
      <circle cx="12" cy="12.5" r="3.3" />
    </Glyph>
  ),
  note: (
    <Glyph>
      <path d="M6.5 4h11A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-13A1.5 1.5 0 0 1 6.5 4Z" />
      <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
    </Glyph>
  ),
  sun: (
    <Glyph>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </Glyph>
  ),
  music: (
    <Glyph>
      <path d="M9 17.5V6l10-2v11.5" />
      <circle cx="6.8" cy="17.5" r="2.3" />
      <circle cx="16.8" cy="15.5" r="2.3" />
    </Glyph>
  ),
  gear: (
    <Glyph>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" />
    </Glyph>
  ),
  check: (
    <Glyph>
      <path d="m6 12.5 4 4 8-9" />
    </Glyph>
  ),
} as const;

type Tile = { readonly glyph: ReactNode; readonly tone: string; readonly label: string };

const homeApps: readonly Tile[] = [
  { glyph: glyphs.calendar, tone: styles.toneWhite ?? '', label: 'Calendrier' },
  { glyph: glyphs.clock, tone: styles.toneInk ?? '', label: 'Horloge' },
  { glyph: glyphs.pin, tone: styles.toneSky ?? '', label: 'Plans' },
  { glyph: glyphs.camera, tone: styles.toneGrey ?? '', label: 'Appareil photo' },
  { glyph: glyphs.note, tone: styles.toneSun ?? '', label: 'Notes' },
  { glyph: glyphs.sun, tone: styles.toneBlue ?? '', label: 'Météo' },
  { glyph: glyphs.music, tone: styles.toneCoral ?? '', label: 'Musique' },
  { glyph: glyphs.gear, tone: styles.toneSteel ?? '', label: 'Réglages' },
];

const dockApps: readonly Tile[] = [
  { glyph: glyphs.handset, tone: styles.tonePhone ?? '', label: 'Téléphone' },
  { glyph: glyphs.bubble, tone: styles.toneWhatsapp ?? '', label: 'WhatsApp' },
  { glyph: glyphs.compass, tone: styles.toneSafari ?? '', label: 'Safari' },
  { glyph: glyphs.picture, tone: styles.tonePhotos ?? '', label: 'Photos' },
];

function AppTile({ tile }: { readonly tile: Tile }) {
  return (
    <span className={`${styles.tile} ${tile.tone}`} title={tile.label}>
      {tile.glyph}
    </span>
  );
}

/* Silhouette générique de SUV sombre, de profil. */
function CarSilhouette() {
  return (
    <svg viewBox="0 0 220 84" aria-hidden="true" className={styles.car}>
      <defs>
        <linearGradient id="hero-car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3b40" />
          <stop offset="0.55" stopColor="#1a1b1e" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <linearGradient id="hero-car-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b6170" />
          <stop offset="1" stopColor="#15171c" />
        </linearGradient>
        <radialGradient id="hero-car-floor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.7" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="74" rx="100" ry="7" fill="url(#hero-car-floor)" />
      <path
        d="M12 62c0-9 5-14 16-16l30-5c11-12 26-20 46-21h30c17 0 30 8 42 20l24 6c8 2 11 7 11 16H12Z"
        fill="url(#hero-car-body)"
      />
      <path d="M66 42c9-9 22-16 38-16h12v16H66Z" fill="url(#hero-car-glass)" />
      <path d="M122 26h12c13 0 24 6 33 16h-45V26Z" fill="url(#hero-car-glass)" />
      <path
        d="M30 47l28-5c11-12 26-20 46-21h30c17 0 30 8 42 20"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="1.2"
      />
      <path d="M190 52h12" stroke="#f5f2ec" strokeOpacity="0.8" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 54h8" stroke="#c4553a" strokeOpacity="0.9" strokeWidth="2.4" strokeLinecap="round" />
      {[52, 166].map((x) => (
        <g key={x}>
          <circle cx={x} cy="63" r="14" fill="#08080a" />
          <circle cx={x} cy="63" r="8" fill="#26272b" stroke="#55575e" strokeWidth="1" />
          <circle cx={x} cy="63" r="2.5" fill="#8a8c93" />
        </g>
      ))}
    </svg>
  );
}

/* Une carte = trois niveaux (règle WebKit) : position + flottement, rotation
   fixe, puis la carte qui peint. */
function FloatingCard({
  slot,
  delay,
  children,
}: {
  readonly slot: string | undefined;
  readonly delay: number;
  readonly children: ReactNode;
}) {
  return (
    <div className={`${styles.float} ${slot ?? ''}`} style={{ '--float-delay': `${delay}s` } as CSSProperties}>
      <div className={styles.lean}>{children}</div>
    </div>
  );
}

export function HeroPhone() {
  return (
    <div className={styles.frame}>
      <div
        className={styles.stage}
        role="img"
        aria-label="Aperçu de Qualifyr sur un téléphone : un client demande un créneau sur WhatsApp, choisit son véhicule dans le formulaire de réservation, reçoit un tarif calculé et règle un acompte de 50 € par Stripe."
      >
        <span className={styles.haloBlue} aria-hidden="true" />
        <span className={styles.haloViolet} aria-hidden="true" />

        <div className={styles.tilt}>
          <div className={styles.phone}>
            <span className={styles.buttonLeft} aria-hidden="true" />
            <span className={styles.buttonRight} aria-hidden="true" />
            <div className={styles.screen}>
              <div className={styles.statusBar}>
                <span>9:41</span>
                <span className={styles.island} aria-hidden="true" />
                <span className={styles.statusIcons} aria-hidden="true">
                  <span className={styles.signal} />
                  <span className={styles.battery} />
                </span>
              </div>

              <div className={styles.apps}>
                {homeApps.map((tile) => (
                  <AppTile key={tile.label} tile={tile} />
                ))}
              </div>

              <div className={styles.widget}>
                <div className={styles.widgetHead}>
                  <span className={styles.widgetDot} aria-hidden="true" />
                  <span>Car detailing booking</span>
                </div>
                <div className={styles.carPanel}>
                  <CarSilhouette />
                </div>
                <p className={styles.widgetLabel}>Votre véhicule</p>
                <div className={styles.sizes}>
                  {SIZES.map((size) => (
                    <span key={size} className={size === ACTIVE_SIZE ? styles.sizeActive : styles.size}>
                      {vehicleSizeCopy[size].label}
                    </span>
                  ))}
                </div>
                <span className={styles.widgetButton}>Continuer</span>
              </div>

              <div className={styles.dock}>
                {dockApps.map((tile) => (
                  <AppTile key={tile.label} tile={tile} />
                ))}
              </div>
              <span className={styles.homeBar} aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* 1. Notification WhatsApp, à cheval sur le haut de l'écran. */}
        <FloatingCard slot={styles.slotNotif} delay={0}>
          <div className={styles.notif}>
            <span className={`${styles.notifIcon} ${styles.toneWhatsapp}`}>{glyphs.bubble}</span>
            <span className={styles.notifBody}>
              <span className={styles.notifHead}>
                <strong>Client WhatsApp</strong>
                <span>maintenant</span>
              </span>
              <span className={styles.notifText}>
                Salut, dispo ce samedi pour un traitement céramique ?
              </span>
            </span>
          </div>
        </FloatingCard>

        {/* 2. Conversation, débordant à gauche. */}
        <FloatingCard slot={styles.slotChat} delay={-2}>
          <div className={styles.chat}>
            <span className={styles.bubbleIn}>attends… c’est vraiment combien ?</span>
            <span className={styles.bubbleOut}>Tarif calculé : 280 € • Acompte 50 € versé 💳</span>
          </div>
        </FloatingCard>

        {/* 3. Paiement, débordant à droite. */}
        <FloatingCard slot={styles.slotPay} delay={-4}>
          <div className={styles.pay}>
            <span className={styles.payHead}>
              <span className={styles.payLabel}>Paiement</span>
              <span className={styles.payStatus}>
                {glyphs.check}
                Réussi
              </span>
            </span>
            <span className={styles.payText}>Acompte de 50 € encaissé sur Stripe</span>
            <span className={styles.payAmount}>50,00 €</span>
            <span className={styles.payVia}>via Stripe</span>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}
