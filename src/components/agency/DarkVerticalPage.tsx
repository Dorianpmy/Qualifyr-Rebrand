import Link from 'next/link';
import type { ReactNode } from 'react';
import { Section } from './Section';
import { StepLoadingBar } from './StepLoadingBar';

/**
 * Blocs de page métier, à la charte sombre.
 *
 * **Pourquoi des composants ici et pas dans la page.** La page métier
 * automobile est la première d'une série — il y en aura une par vertical. Si
 * la mise en page vit dans le fichier de la page, la deuxième sera un
 * copier-coller de la première, et les deux divergeront au premier
 * ajustement.
 *
 * **Aucun de ces blocs n'invente de chiffre.** Le contenu vient de
 * `content/verticals.ts` ; ces composants ne font que le mettre en forme.
 */

/** En-tête de section : sur-titre, titre, chapô. Toujours centré. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  id,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead?: string;
  readonly id?: string;
}) {
  return (
    <header className="mx-auto mb-12 max-w-[46rem] text-center">
      <p className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
        {eyebrow}
      </p>
      <h2
        {...(id ? { id } : {})}
        className="mb-5 text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold leading-[1.16] tracking-[-0.025em] text-primary"
      >
        {title}
      </h2>
      {lead ? (
        <p className="mx-auto max-w-[36rem] text-[1.0625rem] leading-[1.65] text-muted">{lead}</p>
      ) : null}
    </header>
  );
}

/**
 * Carte numérotée.
 *
 * Le numéro est en filigrane derrière le titre plutôt qu'en pastille colorée :
 * une pastille par carte multiplierait les points de couleur, et la charte
 * n'en autorise qu'un par écran.
 */
export function NumberedCard({
  number,
  title,
  body,
  highlight = false,
}: {
  readonly number: string;
  readonly title: string;
  readonly body: string;
  /** Contour dégradé. Réservé à la colonne « ce qu'on construit ». */
  readonly highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-[1.25rem] p-6 ${highlight ? 'border border-transparent' : ''}`}
      style={
        highlight
          ? {
              background:
                'linear-gradient(#111112, #111112) padding-box, linear-gradient(140deg, var(--accent-1), transparent 50%, var(--accent-2)) border-box',
            }
          : { background: '#0f0f10', border: '1px solid rgba(255,255,255,0.07)' }
      }
    >
      <p
        className="mb-4 text-[0.75rem] font-bold tabular-nums tracking-[0.1em]"
        style={{ color: highlight ? 'var(--accent-1)' : 'rgba(255,255,255,0.25)' }}
      >
        {number}
      </p>
      <h3 className="mb-2.5 text-[1.0625rem] font-semibold leading-[1.3] tracking-[-0.01em] text-primary">
        {title}
      </h3>
      <p className="text-[0.9375rem] leading-[1.6] text-muted">{body}</p>
    </div>
  );
}

/** Section de cartes numérotées — problèmes, réponses, résultats. */
export function CardsSection({
  eyebrow,
  title,
  lead,
  items,
  id,
  highlight = false,
  className = '',
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead?: string;
  readonly items: readonly { number: string; title: string; body: string }[];
  readonly id?: string;
  readonly highlight?: boolean;
  readonly className?: string;
}) {
  return (
    <Section {...(id ? { labelledBy: id } : {})} className={`py-24 ${className}`}>
      <SectionHead
        eyebrow={eyebrow}
        title={title}
        {...(lead ? { lead } : {})}
        {...(id ? { id } : {})}
      />
      <div className="mx-auto grid max-w-[68rem] items-stretch gap-4 md:grid-cols-3">
        {items.map((item) => (
          <NumberedCard
            key={item.number}
            number={item.number}
            title={item.title}
            body={item.body}
            highlight={highlight}
          />
        ))}
      </div>
    </Section>
  );
}

/**
 * Le parcours, en rail horizontal.
 *
 * **Le trait qui relie les étapes est décoratif et le reste.** Il vit dans un
 * pseudo-élément hors flux : s'il était un vrai élément entre les cartes, un
 * lecteur d'écran annoncerait quatre séparateurs vides au milieu des étapes.
 */
export function JourneySection({
  eyebrow,
  title,
  lead,
  steps,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead?: string;
  readonly steps: readonly { number: string; title: string; body: string }[];
}) {
  return (
    <Section labelledBy="journey-title" className="border-y border-hairline py-24">
      <SectionHead
        eyebrow={eyebrow}
        title={title}
        {...(lead ? { lead } : {})}
        id="journey-title"
      />

      <ol className="relative mx-auto grid max-w-[68rem] gap-4 md:grid-cols-4">
        {/* Le rail passe derrière les cartes, à hauteur des numéros. Il
            s'arrête aux extrémités des colonnes intérieures pour ne pas
            dépasser dans le vide de chaque côté. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[3.1rem] hidden h-px md:block"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--accent-1), var(--accent-2), transparent)',
            opacity: 0.4,
          }}
        />

        {steps.map((step, index) => (
          <li
            key={step.number}
            className="relative flex flex-col rounded-[1.25rem] p-6"
            style={{ background: '#0f0f10', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span
              className="mb-4 flex size-9 items-center justify-center rounded-full text-[0.8125rem] font-bold tabular-nums text-ink"
              style={{ background: 'linear-gradient(145deg, #f2d5b3, #b8cfe4)' }}
            >
              {step.number}
            </span>
            <h3 className="mb-2 text-[1.0625rem] font-semibold tracking-[-0.01em] text-primary">
              {step.title}
            </h3>
            <p className="text-[0.9375rem] leading-[1.55] text-muted">{step.body}</p>
            <StepLoadingBar index={index} />
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** Arguments longs, en deux colonnes. Pas de numéros : ce ne sont pas des étapes. */
export function WhyUsSection({
  eyebrow,
  title,
  lead,
  items,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead?: string;
  readonly items: readonly { title: string; body: string }[];
}) {
  return (
    <Section labelledBy="why-title" className="py-24">
      <SectionHead eyebrow={eyebrow} title={title} {...(lead ? { lead } : {})} id="why-title" />
      <div className="mx-auto grid max-w-[60rem] gap-x-12 gap-y-10 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="border-t border-hairline pt-6">
            <h3 className="mb-2.5 text-[1.0625rem] font-semibold leading-[1.35] tracking-[-0.01em] text-primary">
              {item.title}
            </h3>
            <p className="text-[0.9375rem] leading-[1.65] text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/**
 * FAQ.
 *
 * `<details>` natif plutôt qu'un accordéon en JavaScript : il fonctionne au
 * clavier, s'ouvre à la recherche dans la page (Cmd+F trouve une réponse
 * repliée sur les navigateurs récents) et ne coûte aucun script.
 */
export function FaqSection({
  items,
}: {
  readonly items: readonly { question: string; answer: string }[];
}) {
  return (
    <Section labelledBy="faq-title" className="border-t border-hairline py-24">
      <SectionHead eyebrow="Questions fréquentes" title="Ce qu’on nous demande avant de se lancer." id="faq-title" />
      <div className="mx-auto grid max-w-[46rem] gap-2.5">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-[1rem] px-5 py-1"
            style={{ background: '#0f0f10', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[1rem] font-medium leading-[1.4] text-primary [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden="true"
                className="grid size-6 shrink-0 place-items-center rounded-full border border-white/10 text-[1rem] leading-none text-faint transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="pb-5 pr-10 text-[0.9375rem] leading-[1.65] text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/** Bandeau de relance, avant le pied de page. */
export function CtaSection({
  eyebrow,
  title,
  body,
  primary,
  secondary,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly primary: { href: string; label: string };
  readonly secondary?: { href: string; label: string };
}) {
  return (
    <Section labelledBy="cta-title" glow="bottom" className="py-24">
      <div
        className="mx-auto flex max-w-[52rem] flex-col items-center rounded-[1.75rem] border border-transparent px-6 py-14 text-center sm:px-12"
        style={{
          background:
            'linear-gradient(#111112, #111112) padding-box, linear-gradient(140deg, var(--accent-1), transparent 50%, var(--accent-2)) border-box',
        }}
      >
        <p className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-faint">
          {eyebrow}
        </p>
        <h2
          id="cta-title"
          className="mb-4 max-w-[32rem] text-[clamp(1.6rem,3.2vw,2.3rem)] font-bold leading-[1.16] tracking-[-0.025em] text-primary"
        >
          {title}
        </h2>
        <p className="mb-8 max-w-[34rem] text-[1.0625rem] leading-[1.65] text-muted">{body}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <CtaLink href={primary.href} label={primary.label} solid />
          {secondary ? <CtaLink href={secondary.href} label={secondary.label} /> : null}
        </div>
      </div>
    </Section>
  );
}

function CtaLink({
  href,
  label,
  solid = false,
}: {
  readonly href: string;
  readonly label: string;
  readonly solid?: boolean;
}): ReactNode {
  return (
    <Link
      href={href}
      className={
        solid
          ? 'cta-solid cta-beam accent-glow inline-flex min-h-[48px] items-center rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-white/90'
          : 'inline-flex min-h-[48px] items-center rounded-full px-6 text-[0.9375rem] font-semibold !text-primary no-underline transition-colors duration-150 hover:bg-white/[0.06]'
      }
      style={solid ? undefined : { border: '1px solid rgba(255,255,255,0.15)' }}
    >
      {label}
    </Link>
  );
}
