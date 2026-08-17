/**
 * Message pré-rempli, adapté à la page consultée.
 *
 * Un message générique oblige le visiteur à formuler sa demande lui-même —
 * c'est précisément l'effort qui le fait renoncer. En arrivant déjà rédigé et
 * contextualisé, le message se contente d'être envoyé : la première phrase est
 * franchie pour lui.
 *
 * Le texte reste **à la première personne et modifiable** : on écrit ce que le
 * visiteur dirait, jamais une formule commerciale qu'il n'assumerait pas.
 */
const contextualMessages: Readonly<Record<string, string>> = {
  '/nettoyage-automobile':
    'Bonjour, je suis laveur auto à domicile et je regarde votre offre de site. J’aimerais savoir ce que ça donnerait pour mon activité.',
  '/conciergerie':
    'Bonjour, je gère une conciergerie et je cherche à obtenir plus de demandes de propriétaires. J’aimerais en discuter.',
  '/outil-conciergerie':
    'Bonjour, je suis intéressé par votre outil d’acquisition pour conciergerie à 79 €/mois. J’ai quelques questions avant de tester.',
  '/simulateur-revenus-locatifs':
    'Bonjour, je viens d’essayer votre simulateur de revenus. J’aimerais savoir comment le proposer à mes propriétaires.',
  '/tarifs':
    'Bonjour, je regarde vos tarifs et j’aimerais savoir dans quelle formule se situe mon projet.',
  '/estimation':
    'Bonjour, j’ai commencé une estimation sur votre site et j’aimerais valider quelques points avec vous.',
  '/creation-site-web':
    'Bonjour, j’ai un projet de site pour mon activité de services et j’aimerais en parler.',
  '/blog':
    'Bonjour, j’ai lu un de vos articles et j’aimerais échanger sur ma situation.',
  '/a-propos':
    'Bonjour, je découvre Qualifyr et j’aimerais savoir si vous pourriez m’accompagner.',
  '/methode':
    'Bonjour, votre méthode m’intéresse. J’aimerais savoir comment elle s’appliquerait à mon activité.',
  '/contact': 'Bonjour, j’aimerais échanger avec vous au sujet de mon projet.',
};

/** Villes : le message reprend la ville pour que l'échange démarre situé. */
function localMessage(pathname: string): string | null {
  // Le groupe capturant est extrait explicitement : l'accès indexé seul est
  // considéré comme potentiellement indéfini par le compilateur.
  const slug = /^\/conciergerie\/([a-z-]+)$/.exec(pathname)?.[1];
  if (!slug) return null;

  const city = slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');

  return `Bonjour, je gère une conciergerie à ${city} et je cherche à signer plus de mandats. J’aimerais en discuter.`;
}

export function buildDirectWhatsAppMessage(pathname?: string | null) {
  if (!pathname) return 'Bonjour, je souhaite discuter de mon projet avec Qualifyr.';

  const local = localMessage(pathname);
  if (local) return local;

  if (pathname.startsWith('/blog/')) {
    return 'Bonjour, je viens de lire un de vos articles et j’aimerais échanger sur ma situation.';
  }

  return (
    contextualMessages[pathname] ?? 'Bonjour, je souhaite discuter de mon projet avec Qualifyr.'
  );
}

/** Retourne `null` lorsque le numéro public n'est pas exploitable. */
export function buildWhatsAppUrl(number: string | null | undefined, message: string) {
  const digits = number?.replace(/\D/g, '') ?? '';
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
