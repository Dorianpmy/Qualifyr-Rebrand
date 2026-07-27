function safeHttpsUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeWhatsAppNumber(value: string | undefined) {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** Canaux commerciaux publics. Aucune valeur de contact n'est inventée. */
export const agencyChannels = {
  bookingUrl: safeHttpsUrl(process.env.NEXT_PUBLIC_QUALIFYR_BOOKING_URL),
  whatsappNumber: safeWhatsAppNumber(process.env.NEXT_PUBLIC_QUALIFYR_WHATSAPP_NUMBER),
} as const;
