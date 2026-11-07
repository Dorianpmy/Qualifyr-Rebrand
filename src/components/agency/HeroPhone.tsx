import type { CSSProperties, ReactNode } from "react";
import {
  optionCopy,
  scopeCopy,
  vehicleSizeCopy,
} from "@/components/detailing/content";
import { DEMO_QUOTE_CONFIG } from "@/lib/detailing/demo";
import { formatMoney, profileFor } from "@/lib/detailing/locale";
import { quote } from "@/lib/detailing/quote";
import type { VehicleSize } from "@/lib/detailing/types";
import styles from "./HeroPhone.module.css";

/**
 * Maquette de téléphone du hero de l'accueil — `docs/05-composants.md`,
 * « Hero de l'accueil en deux colonnes » (7 novembre 2026).
 *
 * Composant serveur, sans JavaScript côté client : le cadre est en CSS pur et
 * le flottement des cartes est une animation CSS, coupée sous
 * `prefers-reduced-motion`.
 *
 * **Les montants de l'écran ne sont pas inventés.** Ils sortent du vrai moteur
 * de devis (`quote()`) appliqué à la configuration de démonstration
 * (`DEMO_QUOTE_CONFIG`), celle de `/embed/demo` : ce que le visiteur voit ici
 * est ce qu'il obtiendrait en essayant la démo avec les mêmes choix.
 *
 * **Deux éléments par carte, comme `MessageBubble`.** L'externe porte la
 * position et l'animation et ne peint rien ; l'interne porte le fond, le rayon
 * et l'ombre sans aucune transformation. Peindre et transformer le même
 * élément fait apparaître un rectangle opaque derrière la carte sur WebKit.
 */

const DEMO_SIZE: VehicleSize = "suv";
const DEMO_SIZES: readonly VehicleSize[] = [
  "citadine",
  "berline",
  "suv",
  "prestige",
];

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${String(rest).padStart(2, "0")}`;
}

/* Icônes au trait, monochromes, `currentColor` — jamais d'emoji sur le site
   vitrine (`docs/03-direction-artistique.md` §7). */
function Icon({ children }: { readonly children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={styles.icon}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const icons = {
  card: (
    <Icon>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M7 15h3" />
    </Icon>
  ),
  pen: (
    <Icon>
      <path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
      <path d="M13.5 7.5l3 3" />
    </Icon>
  ),
  calendar: (
    <Icon>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  ),
  car: (
    <Icon>
      <path d="M4 15.5v-3l2-5h12l2 5v3" />
      <path d="M3 15.5h18v2.5H3z" />
      <circle cx="7.5" cy="18" r="1.5" />
      <circle cx="16.5" cy="18" r="1.5" />
    </Icon>
  ),
} as const;

type Card =
  | { readonly kind: "message"; readonly text: string; readonly slot: string }
  | {
      readonly kind: "card";
      readonly label: string;
      readonly text: string;
      readonly icon: ReactNode;
      readonly slot: string;
    };

const cards: readonly Card[] = [
  {
    kind: "message",
    text: "C’est combien pour un polissage sur une Golf ?",
    slot: styles.slotA ?? "",
  },
  {
    kind: "card",
    label: "Paiement",
    text: "Acompte de 50 € encaissé sur Stripe",
    icon: icons.card,
    slot: styles.slotB ?? "",
  },
  {
    kind: "card",
    label: "Votre soirée",
    text: "Fini les devis écrits le soir à 21 h",
    icon: icons.pen,
    slot: styles.slotC ?? "",
  },
  {
    kind: "card",
    label: "Nouveau RDV",
    text: "Céramique SUV, mardi 14 h",
    icon: icons.calendar,
    slot: styles.slotD ?? "",
  },
  {
    kind: "card",
    label: "Devis",
    text: "Tarif calculé selon le gabarit du véhicule",
    icon: icons.car,
    slot: styles.slotE ?? "",
  },
];

export function HeroPhone() {
  const profile = profileFor("FR");
  const demo = quote(
    {
      scope: "exterieur",
      vehicleSize: DEMO_SIZE,
      soiling: "normal",
      optionKeys: ["ceramique"],
      locationMode: "atelier",
    },
    DEMO_QUOTE_CONFIG,
  );

  return (
    <div
      className={styles.stage}
      role="img"
      aria-label="Aperçu du formulaire de réservation Qualifyr sur un téléphone : le client choisit son véhicule, voit un prix ferme et règle l’acompte."
    >
      <div className={styles.phone}>
        <span className={styles.buttonLeft} aria-hidden="true" />
        <span className={styles.buttonRight} aria-hidden="true" />
        <div className={styles.screen}>
          <span className={styles.island} aria-hidden="true" />

          <div className={styles.statusBar}>
            <span>9:41</span>
            <span className={styles.statusIcons} aria-hidden="true">
              <span className={styles.signal} />
              <span className={styles.battery} />
            </span>
          </div>

          <div className={styles.app}>
            <p className={styles.appEyebrow}>Réservation en ligne</p>
            <p className={styles.appTitle}>Votre véhicule</p>

            <div className={styles.sizes}>
              {DEMO_SIZES.map((size) => (
                <span
                  key={size}
                  className={
                    size === DEMO_SIZE ? styles.sizeActive : styles.size
                  }
                >
                  {vehicleSizeCopy[size].label}
                </span>
              ))}
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>{scopeCopy.exterieur.label}</span>
                <span>{formatMoney(demo.basePrice, profile)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>{optionCopy.ceramique.label}</span>
                <span>{formatMoney(demo.optionsPrice, profile)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Durée</span>
                <span>{formatDuration(demo.totalMinutes)}</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Prix ferme</span>
                <span>{formatMoney(demo.totalPrice, profile)}</span>
              </div>
            </div>

            <span className={styles.payButton}>
              Payer l’acompte de {formatMoney(demo.depositAmount, profile)}
            </span>
            <p className={styles.appNote}>Créneau confirmé dès le paiement</p>
          </div>
        </div>
      </div>

      {cards.map((card, index) => (
        <div
          key={card.text}
          className={`${styles.float} ${card.slot}`}
          style={
            { ["--float-delay" as string]: `${index * -1.2}s` } as CSSProperties
          }
        >
          {card.kind === "message" ? (
            <span className={styles.message}>{card.text}</span>
          ) : (
            <span className={styles.card}>
              <span className={styles.cardIcon}>{card.icon}</span>
              <span className={styles.cardBody}>
                <span className={styles.cardLabel}>{card.label}</span>
                <span className={styles.cardText}>{card.text}</span>
              </span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
