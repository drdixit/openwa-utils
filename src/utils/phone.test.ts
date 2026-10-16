import { describe, it, expect } from 'vitest';
import { formatInternationalPhone } from './phone';

describe('formatInternationalPhone', () => {
  it('formats raw Indian WhatsApp JID to E.164 with +', () => {
    expect(formatInternationalPhone('919409367178@c.us')).toBe('+919409367178');
  });

  it('formats US WhatsApp JID to E.164 with +', () => {
    expect(formatInternationalPhone('14155552671@c.us')).toBe('+14155552671');
  });

  it('formats UK number with country code', () => {
    expect(formatInternationalPhone('447911123456@c.us')).toBe('+447911123456');
  });

  it('handles already-prefixed + without duplicate', () => {
    expect(formatInternationalPhone('+919409367178')).toBe('+919409367178');
  });

  it('strips non-digit formatting characters', () => {
    expect(formatInternationalPhone('+1 (555) 123-4567')).toBe('+15551234567');
  });

  it('handles JIDs with other domains like @lid or @s.whatsapp.net', () => {
    expect(formatInternationalPhone('919409367178@s.whatsapp.net')).toBe('+919409367178');
  });

  it('strips multi-device colon suffix from JID', () => {
    expect(formatInternationalPhone('919409367178:1@c.us')).toBe('+919409367178');
    expect(formatInternationalPhone('14155552671:2@s.whatsapp.net')).toBe('+14155552671');
  });
});
