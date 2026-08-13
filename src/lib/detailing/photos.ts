import { getPublicSupabaseClient } from './supabase-browser';

/**
 * Dépôt d'une photo dans le bucket privé `detailer-photos`, avant paiement
 * (§0.2). Le chemin `{detailerId}/{draftId}/…` correspond à la policy RLS
 * posée en migration : un visiteur ne peut déposer que sous l'identifiant
 * d'un professionnel dont la page est publiée.
 */

export type PhotoUploadResult =
  | { readonly ok: true; readonly path: string }
  | { readonly ok: false; readonly message: string };

export async function uploadDetailerPhoto(
  detailerId: string,
  draftId: string,
  file: File,
): Promise<PhotoUploadResult> {
  const client = getPublicSupabaseClient();
  if (!client) {
    return { ok: false, message: 'Le dépôt de photo n’est pas disponible pour le moment.' };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${detailerId}/${draftId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await client.storage.from('detailer-photos').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });

  if (error) return { ok: false, message: 'Cette photo n’a pas pu être envoyée. Réessayez.' };
  return { ok: true, path };
}
