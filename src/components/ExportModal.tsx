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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="bg-white border border-slate-400 max-w-md w-full shadow-lg">
        {/* Dialog Title Bar */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 flex items-center justify-between select-none">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Export Contacts to .vcf</h3>
            <p className="text-[11px] text-slate-500">
              {selectedParticipants.length} contacts selected from &quot;{groupName}&quot;
            </p>
          </div>
          <button
            onClick={onCancel}
            className="px-1.5 py-0.5 text-xs text-slate-500 hover:text-black border border-transparent hover:border-slate-300 hover:bg-slate-200 cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {/* Prefix Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Contact Name Prefix:
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. hello"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 text-xs font-mono focus:outline-hidden focus:border-slate-600"
              autoFocus
            />
            <p className="text-[11px] text-slate-500">
              Generated names: <span className="font-mono text-slate-800 font-semibold">{prefix.trim() || 'contact'}1</span>, <span className="font-mono text-slate-800 font-semibold">{prefix.trim() || 'contact'}2</span>, etc.
            </p>
          </div>

          {/* Mini Spreadsheet Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
              <span>Preview ({selectedParticipants.length} total)</span>
              <span className="font-mono text-slate-500">Standard vCard 3.0</span>
            </div>

            <div className="border border-slate-300 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-1 px-2 border-r border-slate-200 w-10 text-center font-mono">#</th>
                    <th className="py-1 px-2 border-r border-slate-200">Contact Name</th>
                    <th className="py-1 px-2 font-mono">Phone Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {previewItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1 px-2 border-r border-slate-200 text-center text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-200 font-semibold text-slate-800">
                        {item.name}
                      </td>
                      <td className="py-1 px-2 text-slate-700">
                        {item.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedParticipants.length > 4 && (
                <div className="p-1.5 text-[11px] text-center text-slate-500 bg-slate-50 border-t border-slate-200 font-mono">
                  ...and {selectedParticipants.length - 4} more contacts
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={selectedParticipants.length === 0}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              Download .vcf File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
