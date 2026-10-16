import { useState, useMemo, useEffect } from 'react';
import { OpenWAGroup, OpenWAParticipant } from '../types/openwa';
import { formatInternationalPhone } from '../utils/phone';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  RefreshCw,
  AlertCircle,
  Info,
} from 'lucide-react';

export interface ParticipantSelectorProps {
  group: OpenWAGroup;
  participants: OpenWAParticipant[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onProceed: (selected: OpenWAParticipant[]) => void;
}

export function ParticipantSelector({
  group,
  participants,
  loading,
  error,
  onBack,
  onProceed,
}: ParticipantSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    new Set(participants.map((p) => p.id))
  );
  const [search, setSearch] = useState('');

  // Sync selection when participants are loaded asynchronously
  useEffect(() => {
    setSelectedIds(new Set(participants.map((p) => p.id)));
  }, [participants]);

  // Keep selection synced if participants load later
  const currentParticipants = useMemo(() => {
    return participants.map((p) => ({
      ...p,
      formattedPhone: formatInternationalPhone(p.number || p.id),
    }));
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    if (!search.trim()) return currentParticipants;
    const term = search.toLowerCase();
    return currentParticipants.filter(
      (p) =>
        p.formattedPhone.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
    );
  }, [currentParticipants, search]);

  const visibleParticipants = filteredParticipants;
  const allVisibleSelected =
    visibleParticipants.length > 0 &&
    visibleParticipants.every((p) => selectedIds.has(p.id));

  const isNoneSelected = selectedIds.size === 0;

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const p of visibleParticipants) {
          next.delete(p.id);
        }
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const p of visibleParticipants) {
          next.add(p.id);
        }
        return next;
      });
    }
  };

  const handleToggleParticipant = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNext = () => {
    const selected = participants.filter((p) => selectedIds.has(p.id));
    onProceed(selected);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
            aria-label="Back to groups"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Groups
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 truncate max-w-lg leading-tight">
              {group.name || 'WhatsApp Group'}
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              {group.id}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            disabled={loading || visibleParticipants.length === 0}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {allVisibleSelected ? 'Deselect All' : 'Select All'}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={loading || isNoneSelected}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next ({selectedIds.size})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Spreadsheet Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-100 p-2 border border-slate-300 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone number..."
            className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 focus:outline-hidden focus:border-slate-600 font-sans"
          />
        </div>
        <div className="text-xs font-medium text-slate-700 font-mono px-1 shrink-0">
          <span className="font-bold text-slate-900">
            {selectedIds.size} of {participants.length} selected
          </span>
        </div>
      </div>

      {/* Community Parent Notice */}
      {!loading && !error && participants.length > 0 && participants.every((p) => p.isAdmin) && (
        <div className="p-3 bg-amber-50 border border-amber-300 flex items-start gap-2.5 text-amber-900 text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
          <div className="flex-1">
            <p className="font-bold">Community Parent Notice</p>
            <p className="mt-0.5 text-amber-800">
              All {participants.length} participants shown here are Community Admins. In WhatsApp Communities, regular members belong to announcement or discussion subgroups. To extract all contacts, go back and select the corresponding subgroup.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold underline text-amber-950 hover:text-black cursor-pointer shrink-0"
          >
            Choose Subgroup
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-300 flex items-center justify-between gap-3 text-red-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold underline hover:text-red-950 cursor-pointer shrink-0"
          >
            Back to Groups
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-12 border border-slate-300 bg-white flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
          <p>Loading group participants...</p>
        </div>
      )}

      {/* Empty search results */}
      {!loading && !error && filteredParticipants.length === 0 && participants.length > 0 && (
        <div className="py-8 border border-slate-300 bg-white text-center p-6 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">
            No participants matching &quot;{search}&quot;
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-xs font-semibold text-blue-700 hover:underline mt-1.5 cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Empty participants in group */}
      {!loading && !error && participants.length === 0 && (
        <div className="py-12 border border-slate-300 bg-white text-center p-8 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 text-sm">No participants found</p>
          <p className="mt-1 mb-3">This group does not have any member numbers.</p>
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 cursor-pointer"
          >
            Back to Groups
          </button>
        </div>
      )}

      {/* Participant Spreadsheet Table */}
      {!loading && !error && filteredParticipants.length > 0 && (
        <div className="border border-slate-300 bg-white overflow-x-auto max-h-[550px] overflow-y-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold select-none sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3 border-r border-slate-200 w-12 text-center text-[11px]">
                  Pick
                </th>
                <th className="py-2 px-3 border-r border-slate-200 w-12 text-center font-mono">#</th>
                <th className="py-2 px-3 border-r border-slate-200">Phone Number (E.164)</th>
                <th className="py-2 px-3 border-r border-slate-200 w-28">Role</th>
                <th className="py-2 px-3 font-mono">WhatsApp ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {filteredParticipants.map((p, idx) => {
                const isChecked = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    onClick={() => handleToggleParticipant(p.id)}
                    className={`hover:bg-sky-50 cursor-pointer transition-colors ${
                      isChecked ? 'bg-sky-50/60 font-medium' : idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    <td
                      className="py-1.5 px-3 border-r border-slate-200 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleParticipant(p.id)}
                        className="w-3.5 h-3.5 rounded-none cursor-pointer"
                      />
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200 font-mono text-xs font-semibold text-slate-900">
                      {p.formattedPhone}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200">
                      {p.isAdmin ? (
                        <span className="inline-block px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold text-[11px]">
                          Admin
                        </span>
                      ) : (
                        <span className="text-slate-500">Member</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[11px] text-slate-500">
                      {p.id}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
