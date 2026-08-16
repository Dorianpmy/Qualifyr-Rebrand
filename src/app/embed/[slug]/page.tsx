import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookingFlow } from '@/components/detailing/BookingFlow';
import { EmbedAutoHeight } from '@/components/detailing/EmbedAutoHeight';
import { loadDetailerBySlug } from '@/lib/detailing/config';

/**
 * Tunnel de réservation embarqué sur le site du professionnel.
 *
 * **Pourquoi une route distincte de `/reservation/[slug]`.** La page publique
 * porte un en-tête qui vend la prestation : promesse, prix d'appel, preuve
 * avant/après. Rejoué dans une page qui contient déjà tout ça, il fait doublon
 * et donne l'impression d'un service collé de travers. L'embarqué ne contient
 * donc que le formulaire — la vente est déjà faite par le site d'accueil.
 *
 * La page reste indexable à `noindex` : deux URL servant le même tunnel se
 * cannibaliseraient dans les résultats de recherche.
 */

type EmbedPageProps = {
  readonly params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { slug } = await params;
  const detailer = await loadDetailerBySlug(slug);

  /*
   * Cas particulier : `slug === 'demo'`.
   *
   * Cette route sert deux publics différents. Un vrai client d'un detailer
   * avec un slug erroné doit voir un vrai 404 — sa page n'existe pas, point.
   * Mais `demo` n'est pas le slug d'un client : c'est celui que `DemoSection`
   * charge dans l'iframe du tunnel, sur la page d'accueil elle-même. Si la
   * fiche « demo » manque (jamais seedée sur cet environnement, ou dépubliée),
   * `notFound()` fait remonter la 404 globale du site — habillage clair et
   * bouton vert de l'ancienne charte — à l'intérieur du cadre de téléphone
   * sombre de la page d'accueil. Ça ne ressemble pas à une page qui manque,
   * ça ressemble au site qui casse pendant la démonstration : le pire moment
   * possible pour ça. On affiche donc ici un message qui reste dans le
   * registre sombre de la page qui l'héberge, plutôt que de laisser
   * apparaître l'accident visuel.
   */
  if (!detailer) {
    if (slug === 'demo') {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            minHeight: '38rem',
            padding: '2rem',
            textAlign: 'center',
            background: '#0e0e0f',
            color: '#f5f4f2',
          }}
        >
          <p style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Démo momentanément indisponible.</p>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'rgba(245,244,242,0.65)', maxWidth: '22rem' }}>
            Le tunnel de réservation fonctionne bien chez nos clients — cette démonstration en
            particulier est en maintenance. Écrivez-nous et nous vous montrons le vrai parcours.
          </p>
        </div>
      );
    }
    notFound();
  }

  return (
    <>
      <EmbedAutoHeight />
      <BookingFlow
        detailer={{
          id: detailer.id,
          slug: detailer.slug,
          name: detailer.name,
          city: detailer.city,
          country: detailer.country,
          scopeLabels: detailer.scopeLabels,
          base: detailer.base,
          mobileService: detailer.mobileService,
          workshopService: detailer.workshopService,
          workshopAddress: detailer.workshopAddress,
        }}
        quoteConfig={detailer.quoteConfig}
      />
    </>
  );
}
