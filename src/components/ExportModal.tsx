import { useState, useMemo } from 'react';
import { OpenWAParticipant } from '../types/openwa';
import { formatInternationalPhone } from '../utils/phone';
import { generateVcf, downloadVcf, VcfContact } from '../utils/vcf';

export interface ExportModalProps {
  isOpen: boolean;
  selectedParticipants: OpenWAParticipant[];
  groupName: string;
  onCancel: () => void;
  onExportComplete: () => void;
}

export function ExportModal({
  isOpen,
  selectedParticipants,
  groupName,
  onCancel,
  onExportComplete,
}: ExportModalProps) {
  const [prefix, setPrefix] = useState('hello');

  const contactsToExport: VcfContact[] = useMemo(() => {
    const cleanPrefix = prefix.trim() || 'contact';
    return selectedParticipants.map((p, index) => ({
      name: `${cleanPrefix}${index + 1}`,
      phone: formatInternationalPhone(p.number || p.id),
    }));
  }, [selectedParticipants, prefix]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const vcfContent = generateVcf(contactsToExport);
    const sanitizedGroup = (groupName || 'whatsapp')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const cleanPrefix = prefix.trim() || 'contact';
    const safePrefix = cleanPrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedGroup}_${safePrefix}.vcf`;

    downloadVcf(filename, vcfContent);
    onExportComplete();
  };

  const previewItems = contactsToExport.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#282828]/60 backdrop-blur-xs">
      <div className="bg-[#fbf1c7] border border-[#d5c4a1] rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Dialog Title Bar */}
        <div className="px-5 py-4 bg-[#ebdbb2] border-b border-[#d5c4a1] flex items-center justify-between select-none">
          <div>
            <h3 className="font-semibold text-[#282828] text-sm">Export Contacts to .vcf</h3>
            <p className="text-xs text-[#7c6f64] mt-0.5">
              {selectedParticipants.length} contacts selected from &quot;{groupName}&quot;
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-6 h-6 flex items-center justify-center rounded-full text-[#7c6f64] hover:text-[#282828] hover:bg-[#d5c4a1] transition-colors cursor-pointer text-xs"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Prefix Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#3c3836]">
              Contact Name Prefix:
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. hello"
              className="w-full px-3 py-1.5 bg-[#f9f5d7] border border-[#d5c4a1] rounded-md text-xs font-mono text-[#282828] placeholder-[#928374] focus:bg-white focus:outline-hidden focus:border-[#7c6f64] transition-colors"
              autoFocus
            />
            <p className="text-xs text-[#7c6f64]">
              Generated names: <span className="font-mono text-[#282828] font-semibold">{prefix.trim() || 'contact'}1</span>, <span className="font-mono text-[#282828] font-semibold">{prefix.trim() || 'contact'}2</span>, etc.
            </p>
          </div>

          {/* Mini Spreadsheet Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#7c6f64] font-medium">
              <span>Preview ({selectedParticipants.length} total)</span>
              <span className="font-mono text-[#928374]">Standard vCard 3.0</span>
            </div>

            <div className="border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#ebdbb2] border-b border-[#d5c4a1] text-[#7c6f64] font-medium">
                  <tr>
                    <th className="py-1.5 px-3 border-r border-[#d5c4a1]/70 w-10 text-center font-mono">#</th>
                    <th className="py-1.5 px-3 border-r border-[#d5c4a1]/70">Contact Name</th>
                    <th className="py-1.5 px-3 font-mono">Phone Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdbb2] font-mono text-xs">
                  {previewItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f2e5bc]">
                      <td className="py-1.5 px-3 border-r border-[#ebdbb2] text-center text-[#928374]">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-3 border-r border-[#ebdbb2] font-semibold text-[#282828]">
                        {item.name}
                      </td>
                      <td className="py-1.5 px-3 text-[#3c3836]">
                        {item.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedParticipants.length > 4 && (
                <div className="p-2 text-xs text-center text-[#7c6f64] bg-[#ebdbb2]/50 border-t border-[#d5c4a1] font-mono">
                  ...and {selectedParticipants.length - 4} more contacts
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#d5c4a1]">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 text-xs font-medium text-[#3c3836] bg-[#ebdbb2] hover:bg-[#d5c4a1] border border-[#d5c4a1] rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={selectedParticipants.length === 0}
              className="px-4 py-1.5 text-xs font-medium text-[#fbf1c7] bg-[#3c3836] hover:bg-[#282828] rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              Download .vcf File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
