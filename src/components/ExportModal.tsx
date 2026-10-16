import { useState, useMemo } from 'react';
import { OpenWAParticipant } from '../types/openwa';
import { formatInternationalPhone } from '../utils/phone';
import { generateVcf, downloadVcf, VcfContact } from '../utils/vcf';
import { Download, X, Eye, FileSpreadsheet } from 'lucide-react';

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
    const filename = `${sanitizedGroup}_${cleanPrefix}.vcf`;

    downloadVcf(filename, vcfContent);
    onExportComplete();
  };

  const previewItems = contactsToExport.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Export Contacts to .vcf</h3>
              <p className="text-xs text-slate-400">
                {selectedParticipants.length} contacts selected from &quot;{groupName}&quot;
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prefix Input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Contact Name Prefix
          </label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. hello"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
            autoFocus
          />
          <p className="text-xs text-slate-400">
            Contacts will be saved sequentially as <span className="font-mono text-slate-600">{prefix.trim() || 'contact'}1</span>, <span className="font-mono text-slate-600">{prefix.trim() || 'contact'}2</span>, etc.
          </p>
        </div>

        {/* Live Preview */}
        <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Preview ({selectedParticipants.length} total)
            </span>
            <span className="text-emerald-700 font-medium">Standard vCard 3.0</span>
          </div>

          <div className="space-y-1.5 mt-2">
            {previewItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2.5 bg-white rounded-lg border border-slate-100 font-mono"
              >
                <span className="font-semibold text-slate-700">{item.name}</span>
                <span className="text-slate-500">{item.phone}</span>
              </div>
            ))}
            {selectedParticipants.length > 4 && (
              <p className="text-[11px] text-center text-slate-400 pt-1">
                ...and {selectedParticipants.length - 4} more contacts
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={selectedParticipants.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download .vcf File
          </button>
        </div>
      </div>
    </div>
  );
}
