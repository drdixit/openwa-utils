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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d5c4a1] pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-2 sm:py-1.5 text-xs font-bold bg-[#ebdbb2] hover:bg-[#d5c4a1] active:scale-[0.98] text-[#282828] border border-[#d5c4a1] rounded-md transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            aria-label="Back to groups"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Groups
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#282828] truncate max-w-lg leading-tight tracking-tight">
              {group.name || 'WhatsApp Group'}
            </h2>
            <p className="text-xs text-[#504945] font-mono font-semibold mt-0.5">
              {group.id}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            disabled={loading || visibleParticipants.length === 0}
            className="flex-1 sm:flex-initial py-2 sm:py-1.5 px-3.5 text-xs font-bold text-[#282828] bg-[#ebdbb2] hover:bg-[#d5c4a1] active:scale-[0.98] border border-[#d5c4a1] rounded-md transition-all duration-150 disabled:opacity-50 cursor-pointer text-center shadow-2xs"
          >
            {allVisibleSelected ? 'Deselect All' : 'Select All'}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={loading || isNoneSelected}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 text-xs font-bold text-[#fbf1c7] bg-[#3c3836] hover:bg-[#282828] active:scale-[0.98] rounded-md transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs text-center"
          >
            Next ({selectedIds.size})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#665c54]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone number..."
            className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-base sm:text-xs bg-[#f9f5d7] border border-[#d5c4a1] rounded-md text-[#282828] font-medium placeholder-[#7c6f64] focus:bg-[#fbf1c7] focus:border-[#458588] focus:ring-2 focus:ring-[#458588]/40 focus:outline-hidden transition-all duration-150 font-sans caret-[#d65d0e]"
          />
        </div>
        <div className="text-xs text-[#3c3836] font-medium px-1 shrink-0">
          <span className="font-bold text-[#282828] text-xs">
            {selectedIds.size} of {participants.length} selected
          </span>
        </div>
      </div>

      {/* Community Parent Notice */}
      {!loading && !error && participants.length > 0 && participants.every((p) => p.isAdmin) && (
        <div className="p-3.5 bg-[#d79921]/15 border border-[#d79921]/45 rounded-lg flex items-start gap-2.5 text-[#282828] text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#7a4800]" />
          <div className="flex-1">
            <p className="font-bold text-sm sm:text-xs text-[#7a4800]">Community Parent Notice</p>
            <p className="mt-0.5 text-[#282828] font-medium leading-relaxed">
              All {participants.length} participants shown here are Community Admins. In WhatsApp Communities, regular members belong to announcement or discussion subgroups. To extract all contacts, go back and select the corresponding subgroup.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold underline text-[#7a4800] hover:text-[#d65d0e] cursor-pointer shrink-0"
          >
            Choose Subgroup
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3.5 bg-[#cc241d]/15 border border-[#cc241d]/40 rounded-lg flex items-center justify-between gap-3 text-[#9d0006] text-xs font-mono font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#cc241d]" />
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold underline text-[#cc241d] hover:text-[#79241f] cursor-pointer shrink-0"
          >
            Back to Groups
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-16 border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] flex flex-col items-center justify-center gap-2 text-[#3c3836] text-xs font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin text-[#d65d0e]" />
          <p>Loading group participants...</p>
        </div>
      )}

      {/* Empty search results */}
      {!loading && !error && filteredParticipants.length === 0 && participants.length > 0 && (
        <div className="py-12 border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] text-center p-6 text-xs text-[#3c3836]">
          <p className="font-bold text-[#282828]">
            No participants matching &quot;{search}&quot;
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-xs font-bold text-[#458588] hover:text-[#075968] underline mt-1.5 cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Empty participants in group */}
      {!loading && !error && participants.length === 0 && (
        <div className="py-16 border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] text-center p-8 text-xs text-[#3c3836]">
          <p className="font-bold text-[#282828] text-sm">No participants found</p>
          <p className="mt-1 mb-3 text-[#504945] font-medium">This group does not have any member numbers.</p>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 sm:py-1.5 text-xs font-bold bg-[#ebdbb2] hover:bg-[#d5c4a1] active:scale-[0.98] border border-[#d5c4a1] rounded-md text-[#282828] cursor-pointer transition-all duration-150 shadow-2xs"
          >
            Back to Groups
          </button>
        </div>
      )}

      {/* Participant Table */}
      {!loading && !error && filteredParticipants.length > 0 && (
        <div className="border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] overflow-x-auto max-h-[550px] overflow-y-auto shadow-xs">
          <table className="w-full text-left text-xs border-collapse min-w-[500px]">
            <thead className="bg-[#ebdbb2] border-b-2 border-[#d5c4a1] text-[#282828] font-bold text-xs uppercase tracking-wider select-none sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1] w-12 text-center text-[11px]">
                  Pick
                </th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1] w-12 text-center font-mono">#</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]">Phone Number (E.164)</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1] w-28">Role</th>
                <th className="py-2.5 px-3 font-mono">WhatsApp ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebdbb2] font-sans">
              {filteredParticipants.map((p, idx) => {
                const isChecked = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    onClick={() => handleToggleParticipant(p.id)}
                    className={`hover:bg-[#f2e5bc] active:bg-[#ebdbb2] cursor-pointer transition-colors ${
                      isChecked ? 'bg-[#ebdbb2]/35 font-medium' : ''
                    }`}
                  >
                    <td
                      className="py-3 px-3 border-r border-[#ebdbb2] text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleParticipant(p.id)}
                        className="w-4 h-4 sm:w-3.5 sm:h-3.5 accent-[#d65d0e] rounded cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 border-r border-[#ebdbb2] text-center font-mono font-bold text-[#504945]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 border-r border-[#ebdbb2] font-mono text-sm sm:text-xs font-bold text-[#282828]">
                      {p.formattedPhone}
                    </td>
                    <td className="py-3 px-3 border-r border-[#ebdbb2]">
                      {p.isAdmin ? (
                        <span className="inline-block px-2.5 py-1 bg-[#98971a]/20 text-[#545207] border border-[#98971a]/45 rounded text-xs font-bold whitespace-nowrap">
                          Admin
                        </span>
                      ) : (
                        <span className="text-[#504945] font-semibold text-xs">Member</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs font-semibold text-[#504945] break-all sm:break-normal">
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
