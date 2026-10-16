import { useState } from 'react';
import { OpenWAGroup } from '../types/openwa';
import { Search, RefreshCw, Users, AlertCircle, ArrowRight } from 'lucide-react';

export interface GroupListProps {
  groups: OpenWAGroup[];
  loading: boolean;
  error: string | null;
  onSelectGroup: (group: OpenWAGroup) => void;
  onRefresh: () => void;
}

export function GroupList({
  groups,
  loading,
  error,
  onSelectGroup,
  onRefresh,
}: GroupListProps) {
  const [search, setSearch] = useState('');

  const filteredGroups = groups.filter((g) =>
    (g.name || 'Unnamed Group').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Select a WhatsApp Group</h2>
          <p className="text-sm text-slate-500">
            Pick a group to view participants and export contacts to .vcf
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          Refresh Groups
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups by name..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load groups</p>
            <p className="text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs font-semibold underline hover:text-red-900 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Loading groups from OpenWA...</p>
        </div>
      )}

      {/* Empty States */}
      {!loading && !error && filteredGroups.length === 0 && (
        <div className="py-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl p-8">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No groups found</h3>
          <p className="text-sm text-slate-400 mt-1">
            {search ? 'Try adjusting your search query.' : 'No WhatsApp groups found on this session.'}
          </p>
        </div>
      )}

      {/* Group Grid */}
      {!loading && !error && filteredGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className="group text-left p-4 bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md rounded-xl transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-sm border border-emerald-100 group-hover:scale-105 transition-transform">
                  {(group.name || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm truncate group-hover:text-emerald-700 transition-colors">
                    {group.name || 'Unnamed Group'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {group.id}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
