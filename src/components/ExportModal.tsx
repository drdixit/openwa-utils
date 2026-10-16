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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#282828]/60 backdrop-blur-xs">
      <div className="bg-[#fbf1c7] border-t sm:border border-[#d5c4a1] rounded-t-2xl sm:rounded-xl max-w-md w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Dialog Title Bar */}
        <div className="px-5 py-4 bg-[#ebdbb2] border-b border-[#d5c4a1] flex items-center justify-between select-none shrink-0">
          <div>
            <h3 className="font-bold text-[#282828] text-base sm:text-sm">Export Contacts to .vcf</h3>
            <p className="text-xs text-[#3c3836] font-semibold mt-0.5">
              {selectedParticipants.length} contacts selected from &quot;{groupName}&quot;
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#504945] hover:text-[#282828] hover:bg-[#d5c4a1] active:scale-95 transition-all duration-150 cursor-pointer text-sm font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Prefix Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#282828]">
              Contact Name Prefix:
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. hello"
              className="w-full px-3 py-2 sm:py-1.5 bg-[#f9f5d7] border border-[#d5c4a1] rounded-md text-base sm:text-xs font-mono font-medium text-[#282828] placeholder-[#7c6f64] focus:bg-[#fbf1c7] focus:border-[#458588] focus:ring-2 focus:ring-[#458588]/40 focus:outline-hidden transition-all duration-150 caret-[#d65d0e]"
              autoFocus
            />
            <p className="text-xs text-[#3c3836] font-medium">
              Generated names: <span className="font-mono text-[#282828] font-bold">{prefix.trim() || 'contact'}1</span>, <span className="font-mono text-[#282828] font-bold">{prefix.trim() || 'contact'}2</span>, etc.
            </p>
          </div>

          {/* Mini Spreadsheet Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#3c3836] font-bold">
              <span>Preview ({selectedParticipants.length} total)</span>
              <span className="font-mono text-[#504945] font-semibold">Standard vCard 3.0</span>
            </div>

            <div className="border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#ebdbb2] border-b-2 border-[#d5c4a1] text-[#282828] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2 px-3 border-r border-[#d5c4a1] w-10 text-center font-mono">#</th>
                    <th className="py-2 px-3 border-r border-[#d5c4a1]">Contact Name</th>
                    <th className="py-2 px-3 font-mono">Phone Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebdbb2] font-mono text-xs">
                  {previewItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f2e5bc]">
                      <td className="py-2 px-3 border-r border-[#ebdbb2] text-center font-bold text-[#504945]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-[#ebdbb2] font-bold text-[#282828]">
                        {item.name}
                      </td>
                      <td className="py-2 px-3 text-[#3c3836] font-bold">
                        {item.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedParticipants.length > 4 && (
                <div className="p-2 text-xs text-center text-[#3c3836] font-bold bg-[#ebdbb2]/60 border-t border-[#d5c4a1] font-mono">
                  ...and {selectedParticipants.length - 4} more contacts
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 pt-3 border-t border-[#d5c4a1]">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto py-2.5 sm:py-1.5 px-4 text-xs font-bold text-[#282828] bg-[#ebdbb2] hover:bg-[#d5c4a1] active:scale-[0.98] border border-[#d5c4a1] rounded-md transition-all duration-150 cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={selectedParticipants.length === 0}
              className="w-full sm:w-auto py-2.5 sm:py-1.5 px-4 text-xs font-bold text-[#fbf1c7] bg-[#3c3836] hover:bg-[#282828] active:scale-[0.98] rounded-md transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-xs text-center"
            >
              Download .vcf File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
