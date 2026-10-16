import { useState, useMemo } from 'react';
import { OpenWAGroup } from '../types/openwa';
import { Search, RefreshCw, Users, AlertCircle, ArrowRight, Network, Megaphone } from 'lucide-react';

export type GroupFilterCategory = 'all' | 'with-contacts' | 'parents';

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
  const [filterCategory, setFilterCategory] = useState<GroupFilterCategory>('all');

  // Build parent lookup structures to identify WhatsApp Community parents vs subgroups
  const { parentIdSet, parentNameMap } = useMemo(() => {
    const parentSet = new Set<string>();
    const nameMap = new Map<string, string>();

    for (const g of groups) {
      nameMap.set(g.id, g.name || 'Community');
      if (g.linkedParentJID) {
        parentSet.add(g.linkedParentJID);
      }
    }
    return { parentIdSet: parentSet, parentNameMap: nameMap };
  }, [groups]);

  const counts = useMemo(() => {
    let parents = 0;
    let withContacts = 0;
    for (const g of groups) {
      if (parentIdSet.has(g.id)) {
        parents++;
      } else {
        withContacts++;
      }
    }
    return { all: groups.length, withContacts, parents };
  }, [groups, parentIdSet]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const isParent = parentIdSet.has(g.id);

      if (filterCategory === 'with-contacts' && isParent) {
        return false;
      }
      if (filterCategory === 'parents' && !isParent) {
        return false;
      }

      const query = search.toLowerCase();
      const nameMatch = (g.name || 'Unnamed Group').toLowerCase().includes(query);
      const parentName = g.linkedParentJID ? (parentNameMap.get(g.linkedParentJID) || '').toLowerCase() : '';
      return nameMatch || parentName.includes(query) || g.id.toLowerCase().includes(query);
    });
  }, [groups, parentIdSet, parentNameMap, filterCategory, search]);

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

      {/* Search Input and Filter Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups by name or parent community..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        {!loading && groups.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Groups ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('with-contacts')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filterCategory === 'with-contacts'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              With Contacts ({counts.withContacts})
            </button>
            {counts.parents > 0 && (
              <button
                type="button"
                onClick={() => setFilterCategory('parents')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  filterCategory === 'parents'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                Community Parents ({counts.parents})
              </button>
            )}
          </div>
        )}
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
            {search
              ? 'Try adjusting your search query or filter selection.'
              : 'No WhatsApp groups found in this category.'}
          </p>
        </div>
      )}

      {/* Group Grid */}
      {!loading && !error && filteredGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredGroups.map((group) => {
            const isParent = parentIdSet.has(group.id);
            const isSubgroup = Boolean(group.linkedParentJID);
            const parentName = group.linkedParentJID ? parentNameMap.get(group.linkedParentJID) : null;

            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className={`group text-left p-4 bg-white border rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  isParent
                    ? 'border-amber-200/80 hover:border-amber-400 hover:shadow-md'
                    : 'border-slate-200 hover:border-emerald-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-2">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border group-hover:scale-105 transition-transform ${
                      isParent
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : isSubgroup
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}
                  >
                    {isParent ? (
                      <Network className="w-5 h-5 text-amber-600" />
                    ) : isSubgroup ? (
                      <Megaphone className="w-5 h-5 text-blue-600" />
                    ) : (
                      (group.name || 'G').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 text-sm truncate group-hover:text-emerald-700 transition-colors">
                        {group.name || 'Unnamed Group'}
                      </h3>
                      {isParent ? (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Community Parent (Admins Only)
                        </span>
                      ) : isSubgroup ? (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Subgroup
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {isSubgroup && parentName ? (
                        <span className="text-slate-500 font-medium">Part of {parentName} • </span>
                      ) : null}
                      {group.id}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
