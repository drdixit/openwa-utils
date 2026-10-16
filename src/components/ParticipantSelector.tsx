import { useState, useMemo, useEffect } from 'react';
import { OpenWAGroup, OpenWAParticipant } from '../types/openwa';
import { formatInternationalPhone } from '../utils/phone';
import {
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  Square,
  Search,
  ShieldAlert,
  Users,
  RefreshCw,
  AlertCircle,
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

  const allSelected =
    participants.length > 0 && selectedIds.size === participants.length;
  const isNoneSelected = selectedIds.size === 0;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(participants.map((p) => p.id)));
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
    <div className="space-y-6">
      {/* Top Navigation & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Back to groups"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 truncate max-w-md">
                {group.name || 'WhatsApp Group'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select contacts to extract and export
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            disabled={loading || participants.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {allSelected ? (
              <>
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-slate-400" />
                Select All
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={loading || isNoneSelected}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            Next ({selectedIds.size})
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone number..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
        <div className="text-xs font-medium text-slate-600 px-2 shrink-0">
          <span className="font-bold text-slate-900">
            {selectedIds.size} of {participants.length} selected
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Loading group participants...</p>
        </div>
      )}

      {/* Empty participants */}
      {!loading && !error && participants.length === 0 && (
        <div className="py-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl p-8">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No participants found</h3>
          <p className="text-sm text-slate-400 mt-1">This group does not have any member numbers.</p>
        </div>
      )}

      {/* Participant List */}
      {!loading && !error && filteredParticipants.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-xs max-h-[500px] overflow-y-auto">
          {filteredParticipants.map((p) => {
            const isChecked = selectedIds.has(p.id);
            return (
              <label
                key={p.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                  isChecked ? 'bg-emerald-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleParticipant(p.id)}
                    className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-slate-800">
                      {p.formattedPhone}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{p.id}</p>
                  </div>
                </div>

                {p.isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <ShieldAlert className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
