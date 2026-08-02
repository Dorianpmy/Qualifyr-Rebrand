export function buildDirectWhatsAppMessage() {
  return 'Bonjour, je souhaite discuter de mon projet avec Qualifyr.';
}

export type DiagnosticWhatsAppSummary = {
  activity: string;
  activityDetails?: string;
  company: string;
  website?: string;
  siteSituation: string;
  demandSources: readonly string[];
  situationNote?: string;
  priorities: readonly string[];
  desiredResult?: string;
  timing: string;
  budget?: string;
  constraints?: string;
  firstName: string;
  preferredContact: string;
};

function optionalLine(label: string, value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? `${label} : ${cleaned}` : null;
}

/** Message lisible destiné à Qualifyr, sans valeur vide ni identifiant interne. */
export function buildDiagnosticWhatsAppMessage(request: DiagnosticWhatsAppSummary) {
  return [
    'Bonjour, voici ma demande de diagnostic Qualifyr.',
    '',
    optionalLine('Entreprise', request.company),
    optionalLine('Activité', request.activity),
    optionalLine('Précision', request.activityDetails),
    optionalLine('Site', request.website),
    optionalLine('Situation', request.siteSituation),
    optionalLine('Canaux actuels', request.demandSources.join(', ')),
    optionalLine('Frein principal', request.situationNote),
    optionalLine('Priorités', request.priorities.join(', ')),
    optionalLine('Résultat recherché', request.desiredResult),
    optionalLine('Démarrage', request.timing),
    optionalLine('Budget', request.budget),
    optionalLine('Précision projet', request.constraints),
    '',
    optionalLine('Prénom', request.firstName),
    optionalLine('Moyen de contact préféré', request.preferredContact),
  ]
    .filter((item, index, array): item is string => {
      if (item === null) return false;
      if (item !== '') return true;
      return index > 0 && array[index - 1] !== '';
    })
    .join('\n')
    .trim();
}

/** Retourne `null` lorsque le numéro public n'est pas exploitable. */
export function buildWhatsAppUrl(number: string | null | undefined, message: string) {
  const digits = number?.replace(/\D/g, '') ?? '';
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
