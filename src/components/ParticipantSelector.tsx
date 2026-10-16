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
            className="px-2.5 py-1.5 text-xs font-medium bg-[#ebdbb2] hover:bg-[#d5c4a1] text-[#3c3836] border border-[#d5c4a1] rounded-md transition-colors cursor-pointer flex items-center gap-1"
            aria-label="Back to groups"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Groups
          </button>
          <div>
            <h2 className="text-xl font-semibold text-[#282828] truncate max-w-lg leading-tight tracking-tight">
              {group.name || 'WhatsApp Group'}
            </h2>
            <p className="text-xs text-[#928374] font-mono mt-0.5">
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
            className="px-3.5 py-1.5 text-xs font-medium text-[#3c3836] bg-[#ebdbb2] hover:bg-[#d5c4a1] border border-[#d5c4a1] rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {allVisibleSelected ? 'Deselect All' : 'Select All'}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={loading || isNoneSelected}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-[#fbf1c7] bg-[#3c3836] hover:bg-[#282828] rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next ({selectedIds.size})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#928374]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone number..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f9f5d7] border border-[#d5c4a1] rounded-md text-[#282828] placeholder-[#928374] focus:bg-white focus:outline-hidden focus:border-[#7c6f64] transition-colors font-sans"
          />
        </div>
        <div className="text-xs text-[#7c6f64] font-medium px-1 shrink-0">
          <span className="font-semibold text-[#282828]">
            {selectedIds.size} of {participants.length} selected
          </span>
        </div>
      </div>

      {/* Community Parent Notice */}
      {!loading && !error && participants.length > 0 && participants.every((p) => p.isAdmin) && (
        <div className="p-3 bg-[#d79921]/10 border border-[#d79921]/30 rounded-lg flex items-start gap-2.5 text-[#3c3836] text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#b57614]" />
          <div className="flex-1">
            <p className="font-semibold text-[#b57614]">Community Parent Notice</p>
            <p className="mt-0.5 text-[#7c6f64]">
              All {participants.length} participants shown here are Community Admins. In WhatsApp Communities, regular members belong to announcement or discussion subgroups. To extract all contacts, go back and select the corresponding subgroup.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium underline text-[#b57614] hover:text-[#79740e] cursor-pointer shrink-0"
          >
            Choose Subgroup
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-[#cc241d]/10 border border-[#cc241d]/30 rounded-lg flex items-center justify-between gap-3 text-[#9d0006] text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#cc241d]" />
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium underline text-[#9d0006] hover:text-[#282828] cursor-pointer shrink-0"
          >
            Back to Groups
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-16 border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] flex flex-col items-center justify-center gap-2 text-[#7c6f64] text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-[#928374]" />
          <p>Loading group participants...</p>
        </div>
      )}

      {/* Empty search results */}
      {!loading && !error && filteredParticipants.length === 0 && participants.length > 0 && (
        <div className="py-12 border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] text-center p-6 text-xs text-[#7c6f64]">
          <p className="font-semibold text-[#282828]">
            No participants matching &quot;{search}&quot;
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-xs font-medium text-[#076678] underline hover:text-[#458588] mt-1.5 cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Empty participants in group */}
      {!loading && !error && participants.length === 0 && (
        <div className="py-16 border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] text-center p-8 text-xs text-[#7c6f64]">
          <p className="font-semibold text-[#282828] text-sm">No participants found</p>
          <p className="mt-1 mb-3 text-[#928374]">This group does not have any member numbers.</p>
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 text-xs font-medium bg-[#ebdbb2] hover:bg-[#d5c4a1] border border-[#d5c4a1] rounded-md text-[#3c3836] cursor-pointer transition-colors"
          >
            Back to Groups
          </button>
        </div>
      )}

      {/* Participant Table */}
      {!loading && !error && filteredParticipants.length > 0 && (
        <div className="border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] overflow-x-auto max-h-[550px] overflow-y-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#ebdbb2] border-b border-[#d5c4a1] text-[#7c6f64] font-medium select-none sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]/70 w-12 text-center text-[11px]">
                  Pick
                </th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]/70 w-12 text-center font-mono">#</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]/70">Phone Number (E.164)</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]/70 w-28">Role</th>
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
                    className={`hover:bg-[#f2e5bc] cursor-pointer transition-colors ${
                      isChecked ? 'bg-[#ebdbb2]/30 font-medium' : ''
                    }`}
                  >
                    <td
                      className="py-2 px-3 border-r border-[#ebdbb2] text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleParticipant(p.id)}
                        className="w-3.5 h-3.5 accent-[#d65d0e] rounded cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3 border-r border-[#ebdbb2] text-center font-mono text-[#928374]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-[#ebdbb2] font-mono text-xs font-semibold text-[#282828]">
                      {p.formattedPhone}
                    </td>
                    <td className="py-2 px-3 border-r border-[#ebdbb2]">
                      {p.isAdmin ? (
                        <span className="inline-block px-2 py-0.5 bg-[#98971a]/15 text-[#79740e] border border-[#98971a]/30 rounded text-[11px] font-medium">
                          Admin
                        </span>
                      ) : (
                        <span className="text-[#928374] font-normal">Member</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[#928374]">
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
