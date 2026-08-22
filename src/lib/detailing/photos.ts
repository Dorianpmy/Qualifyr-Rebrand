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

/**
 * Garde-fous ajoutés le 22/08/2026 (audit sécurité) : avant cette date, ni le
 * champ (`accept="image/*"` dans `BookingFlow.tsx`) ni cette fonction ne
 * vérifiaient réellement ce qui partait vers le bucket — `accept` n'est
 * qu'une suggestion du navigateur, pas une barrière, et un visiteur pouvait
 * envoyer n'importe quel fichier, de n'importe quelle taille, vers le
 * Storage Supabase. La policy RLS limite déjà *où* (sous l'identifiant d'un
 * professionnel publié) mais pas *quoi*.
 */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export async function uploadDetailerPhoto(
  detailerId: string,
  draftId: string,
  file: File,
): Promise<PhotoUploadResult> {
  if (file.type && !ALLOWED_PHOTO_TYPES.has(file.type)) {
    return { ok: false, message: 'Format non pris en charge. Utilisez une photo JPEG, PNG, WebP ou HEIC.' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, message: 'Photo trop lourde (8 Mo maximum).' };
  }

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
