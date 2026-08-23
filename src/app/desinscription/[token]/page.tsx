import type { Metadata } from 'next';
import Link from 'next/link';

import { Section } from '@/components/agency/Section';
import { DarkPageShell } from '@/components/editorial/DarkPageShell';
import { EditorialHeader } from '@/components/editorial/EditorialHeader';
import { unsubscribeByToken } from '@/lib/agent/outreach';

/**
 * Désinscription en un clic.
 *
 * **Cette page conditionne tout le reste.** Tant qu'elle n'existe pas, aucun
 * message de prospection ne doit partir : le lien de désinscription figurerait
 * dans le pied de page de chaque envoi et mènerait à une erreur. Une opposition
 * impossible à exercer transforme une prospection licite en manquement, et un
 * destinataire qui ne trouve pas comment se désinscrire clique sur « signaler
 * comme indésirable » — ce qui coûte bien plus cher qu'une désinscription.
 *
 * **Aucune confirmation demandée, aucun formulaire.** Ouvrir le lien suffit.
 * Un écran « êtes-vous sûr ? » fait perdre les gens qui lisent leurs messages
 * sur un téléphone, et l'obligation est de rendre l'opposition *simple*.
 *
 * **Le traitement a lieu pendant le rendu, et c'est délibéré** malgré la règle
 * habituelle qui veut qu'un GET ne modifie rien. Les clients de messagerie
 * pré-chargent les liens, mais l'effet ici est idempotent et va dans le sens
 * protecteur : au pire, une adresse est désinscrite sans que son propriétaire
 * ait cliqué. C'est très exactement le sens dans lequel on préfère se tromper.
 *
 * `dynamic` forcé : le jeton est unique par destinataire, rien ne doit être
 * mis en cache ni pré-rendu.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Désinscription',
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  readonly params: Promise<{ token: string }>;
};

export default async function DesinscriptionPage({ params }: PageProps) {
  const { token } = await params;
  const result = await unsubscribeByToken(token);

  return (
    <DarkPageShell breadcrumb="Désinscription">
      {result.ok ? (
        <>
          <EditorialHeader
            eyebrow="C’est fait"
            title="Vous ne recevrez plus de message."
            lead={
              result.businessName
                ? `L’adresse liée à ${result.businessName} a été retirée. Aucun professionnel utilisant Qualifyr ne pourra plus la contacter.`
                : 'Cette adresse a été retirée. Aucun professionnel utilisant Qualifyr ne pourra plus la contacter.'
            }
          />

          <Section className="pb-24">
            <div className="max-w-[38rem]">
              {/* Le point important, et celui que le destinataire ne peut pas
                  deviner : la portée est globale, pas limitée à l'expéditeur
                  du message qu'il vient de recevoir. Le dire évite qu'il
                  s'inquiète de recevoir la même chose d'un autre compte. */}
              <p className="mb-3.5 text-[0.9375rem] leading-[1.75] text-muted">
                Le retrait vaut pour l’ensemble du service, pas seulement pour la personne qui
                vous a écrit.
              </p>

              <p className="mb-3.5 text-[0.9375rem] leading-[1.75] text-muted">
                Votre adresse a été trouvée sur votre site, et votre établissement au répertoire
                public des entreprises. Nous ne conservons rien d’autre vous concernant.
              </p>

              <p className="text-[0.9375rem] leading-[1.75] text-muted">
                Pour demander la suppression complète de vos données, ou pour toute question,{' '}
                <Link
                  href="/contact"
                  className="!text-muted underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:!text-primary"
                >
                  écrivez-nous
                </Link>
                .
              </p>
            </div>
          </Section>
        </>
      ) : (
        <>
          <EditorialHeader
            eyebrow="Lien non reconnu"
            title="Nous n’avons pas pu traiter cette demande."
            lead="Ce lien de désinscription est incomplet ou n’existe pas. C’est un problème de notre côté, pas du vôtre."
          />

          <Section className="pb-24">
            <div className="max-w-[38rem]">
              {/* On ne laisse jamais quelqu'un dans l'impasse : s'il n'arrive
                  pas à se désinscrire par le lien, il doit avoir un second
                  moyen immédiat, sans quoi il signalera le message comme
                  indésirable — et ce signalement porte sur le domaine. */}
              <p className="mb-3.5 text-[0.9375rem] leading-[1.75] text-muted">
                Vérifiez que l’adresse a bien été copiée en entier : certains logiciels de
                messagerie coupent les liens longs.
              </p>

              <p className="text-[0.9375rem] leading-[1.75] text-muted">
                Sinon,{' '}
                <Link
                  href="/contact"
                  className="!text-muted underline decoration-white/20 underline-offset-4 transition-colors duration-150 hover:!text-primary"
                >
                  écrivez-nous
                </Link>{' '}
                : nous retirons votre adresse manuellement, sans autre formalité.
              </p>
            </div>
          </Section>
        </>
      )}
    </DarkPageShell>
  );
}
