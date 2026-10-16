export interface VcfContact {
  name: string;
  phone: string;
}

/**
 * Generates standard vCard 3.0 content with CRLF line endings.
 */
export function generateVcf(contacts: VcfContact[]): string {
  if (!contacts || contacts.length === 0) {
    return '';
  }

  const vcardEntries = contacts.map((contact) => {
    // Sanitize any newlines or CRLF from name/phone
    const cleanName = contact.name.replace(/[\r\n]/g, '').trim();
    const cleanPhone = contact.phone.replace(/[\r\n]/g, '').trim();

    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${cleanName}`,
      `TEL;TYPE=CELL:${cleanPhone}`,
      'END:VCARD',
      '',
    ].join('\r\n');
  });

  return vcardEntries.join('');
}

/**
 * Triggers an immediate browser download of the generated vCard content.
 */
export function downloadVcf(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', filename.endsWith('.vcf') ? filename : `${filename}.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
