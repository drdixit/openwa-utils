import { useState, useMemo } from 'react';
import { OpenWAGroup } from '../types/openwa';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';

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
    })
    // Community Parents always appear at the bottom
    .sort((a, b) => {
      const aIsParent = parentIdSet.has(a.id) ? 1 : 0;
      const bIsParent = parentIdSet.has(b.id) ? 1 : 0;
      return aIsParent - bIsParent;
    });
  }, [groups, parentIdSet, parentNameMap, filterCategory, search]);

  return (
    <div className="space-y-4">
      {/* Excel Sheet Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Select a WhatsApp Group</h2>
          <p className="text-xs text-slate-500">
            Select a row to inspect contacts and export to .vcf
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-700' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Spreadsheet Toolbar: Search & View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-100 p-2 border border-slate-300">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups by name or parent community..."
            className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 focus:outline-hidden focus:border-slate-600 font-sans"
          />
        </div>

        {/* View Tabs */}
        {!loading && groups.length > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 font-semibold'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              All Groups ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('with-contacts')}
              className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                filterCategory === 'with-contacts'
                  ? 'bg-slate-800 text-white border-slate-800 font-semibold'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              With Contacts ({counts.withContacts})
            </button>
            {counts.parents > 0 && (
              <button
                type="button"
                onClick={() => setFilterCategory('parents')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                  filterCategory === 'parents'
                    ? 'bg-slate-800 text-white border-slate-800 font-semibold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Community Parents ({counts.parents})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-300 flex items-start gap-2.5 text-red-800 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error loading groups:</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            onClick={onRefresh}
            className="underline font-semibold hover:text-red-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-12 border border-slate-300 bg-white flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-600" />
          <p>Loading groups from OpenWA...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredGroups.length === 0 && (
        <div className="py-12 border border-slate-300 bg-white text-center p-6 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">No groups found</p>
          <p className="mt-1">
            {search
              ? 'No matching records found for this search filter.'
              : 'No WhatsApp groups found in this category.'}
          </p>
        </div>
      )}

      {/* Excel Spreadsheet Table */}
      {!loading && !error && filteredGroups.length > 0 && (
        <div className="border border-slate-300 bg-white overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold select-none">
              <tr>
                <th className="py-2 px-3 border-r border-slate-200 w-12 text-center font-mono">#</th>
                <th className="py-2 px-3 border-r border-slate-200">Group Name</th>
                <th className="py-2 px-3 border-r border-slate-200 w-52">Type</th>
                <th className="py-2 px-3 border-r border-slate-200">Community Parent</th>
                <th className="py-2 px-3 border-r border-slate-200 font-mono">WhatsApp ID</th>
                <th className="py-2 px-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredGroups.map((group, idx) => {
                const isParent = parentIdSet.has(group.id);
                const isSubgroup = Boolean(group.linkedParentJID);
                const parentName = group.linkedParentJID ? parentNameMap.get(group.linkedParentJID) : null;

                return (
                  <tr
                    key={group.id}
                    onClick={() => onSelectGroup(group)}
                    className={`hover:bg-sky-50 cursor-pointer transition-colors ${
                      isParent ? 'bg-amber-50/30' : idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-900">
                      <h3 className="font-semibold text-slate-900 inline">
                        {group.name || 'Unnamed Group'}
                      </h3>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      {isParent ? (
                        <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[11px]">
                          Community Parent (Admins Only)
                        </span>
                      ) : isSubgroup ? (
                        <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 font-medium text-[11px]">
                          Subgroup
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium">Group</span>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                      {isSubgroup && parentName ? (
                        <span>Part of {parentName}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-500">
                      {group.id}
                    </td>
                    <td className="py-1 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGroup(group);
                        }}
                        className="px-2.5 py-0.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        Select &rarr;
                      </button>
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
