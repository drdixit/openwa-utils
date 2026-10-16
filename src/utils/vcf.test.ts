import { describe, it, expect, vi } from 'vitest';
import { generateVcf, downloadVcf } from './vcf';

describe('generateVcf', () => {
  it('generates compliant vCard 3.0 entries with CRLF line endings', () => {
    const contacts = [
      { name: 'client1', phone: '+919409367178' },
      { name: 'client2', phone: '+14155552671' },
    ];
    const vcf = generateVcf(contacts);
    expect(vcf).toContain('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:client1\r\nTEL;TYPE=CELL:+919409367178\r\nEND:VCARD\r\n');
    expect(vcf).toContain('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:client2\r\nTEL;TYPE=CELL:+14155552671\r\nEND:VCARD\r\n');
  });

  it('returns empty string when contacts array is empty', () => {
    expect(generateVcf([])).toBe('');
  });

  it('preserves order of contacts provided', () => {
    const contacts = [
      { name: 'hello1', phone: '+919409367178' },
      { name: 'hello2', phone: '+14155552671' },
      { name: 'hello3', phone: '+447911123456' },
    ];
    const vcf = generateVcf(contacts);
    const pos1 = vcf.indexOf('FN:hello1');
    const pos2 = vcf.indexOf('FN:hello2');
    const pos3 = vcf.indexOf('FN:hello3');
    expect(pos1).toBeLessThan(pos2);
    expect(pos2).toBeLessThan(pos3);
  });
});

describe('downloadVcf', () => {
  it('creates an anchor element and triggers download', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    downloadVcf('contacts.vcf', 'BEGIN:VCARD...');
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });
});
