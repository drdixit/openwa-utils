/**
 * Formats a raw phone number or WhatsApp JID into international E.164 format with a leading '+'.
 *
 * Examples:
 *   - '919409367178@c.us' -> '+919409367178'
 *   - '14155552671@c.us' -> '+14155552671'
 *   - '+919409367178' -> '+919409367178'
 *   - '+1 (555) 123-4567' -> '+15551234567'
 */
export function formatInternationalPhone(raw: string): string {
  if (!raw) return '';

  // If input contains '@', take only the user portion before '@', and strip any device suffix (e.g. :1)
  const atPart = raw.includes('@') ? raw.split('@')[0] : raw;
  const userPart = atPart.split(':')[0];

  // Extract digits only
  const digits = userPart.replace(/\D/g, '');
  if (!digits) return '';

  return `+${digits}`;
}
