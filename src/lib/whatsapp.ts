export type ProspectRequest = {
  activity: string;
  situation: string;
  need: string;
  objective: string;
  timing: string;
  firstName: string;
  company: string;
  website?: string;
  detail?: string;
};

export function buildWhatsAppMessage(request: ProspectRequest) {
  const lines = [
    'Bonjour, je souhaite discuter de mon projet avec Qualifyr.',
    '',
    `Activité : ${request.activity}`,
    `Situation actuelle : ${request.situation}`,
    `Besoin principal : ${request.need}`,
    `Objectif : ${request.objective}`,
    `Démarrage souhaité : ${request.timing}`,
    `Entreprise : ${request.company}`,
    `Prénom : ${request.firstName}`,
  ];

  if (request.website?.trim()) lines.push(`Site actuel : ${request.website.trim()}`);
  if (request.detail?.trim()) lines.push(`Précision : ${request.detail.trim()}`);

  return lines.join('\n');
}
