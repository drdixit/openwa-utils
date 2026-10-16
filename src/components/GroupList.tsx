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
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d5c4a1] pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#282828] tracking-tight">Select a WhatsApp Group</h2>
          <p className="text-xs sm:text-sm font-semibold text-[#3c3836] mt-0.5">
            Pick a group to view participants and export contacts to .vcf
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 text-xs font-bold text-[#282828] bg-[#ebdbb2] hover:bg-[#d5c4a1] active:scale-[0.98] border border-[#d5c4a1] rounded-md transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3c3836]' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Toolbar: Search & Segmented View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#665c54]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups by name..."
            className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-base sm:text-xs bg-[#f9f5d7] border border-[#d5c4a1] rounded-md text-[#282828] font-medium placeholder-[#7c6f64] focus:bg-[#fbf1c7] focus:border-[#458588] focus:ring-2 focus:ring-[#458588]/40 focus:outline-hidden transition-all duration-150 font-sans caret-[#d65d0e]"
          />
        </div>

        {/* Gruvbox Segmented View Tabs */}
        {!loading && groups.length > 0 && (
          <div className="flex flex-wrap sm:inline-flex p-0.5 bg-[#ebdbb2] border border-[#d5c4a1] rounded-lg text-xs w-full sm:w-auto gap-0.5 sm:gap-0">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`flex-1 sm:flex-initial py-2 sm:py-1 px-3 rounded-[6px] transition-all cursor-pointer font-bold text-center ${
                filterCategory === 'all'
                  ? 'bg-[#fbf1c7] text-[#282828] shadow-xs'
                  : 'text-[#504945] hover:text-[#282828]'
              }`}
            >
              All Groups ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('with-contacts')}
              className={`flex-1 sm:flex-initial py-2 sm:py-1 px-3 rounded-[6px] transition-all cursor-pointer font-bold text-center ${
                filterCategory === 'with-contacts'
                  ? 'bg-[#fbf1c7] text-[#282828] shadow-xs'
                  : 'text-[#504945] hover:text-[#282828]'
              }`}
            >
              With Contacts ({counts.withContacts})
            </button>
            {counts.parents > 0 && (
              <button
                type="button"
                onClick={() => setFilterCategory('parents')}
                className={`flex-1 sm:flex-initial py-2 sm:py-1 px-3 rounded-[6px] transition-all cursor-pointer font-bold text-center ${
                  filterCategory === 'parents'
                    ? 'bg-[#fbf1c7] text-[#282828] shadow-xs'
                    : 'text-[#504945] hover:text-[#282828]'
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
        <div className="p-3.5 bg-[#cc241d]/15 border border-[#cc241d]/40 rounded-lg flex items-start gap-2.5 text-[#9d0006] text-xs font-mono font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#cc241d] mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm sm:text-xs">Unable to load groups:</p>
            <p className="mt-0.5 text-[#79241f]">{error}</p>
          </div>
          <button
            onClick={onRefresh}
            className="underline font-bold text-[#cc241d] hover:text-[#79241f] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-16 border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] flex flex-col items-center justify-center gap-2 text-[#3c3836] text-xs font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin text-[#d65d0e]" />
          <p>Loading groups from OpenWA...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredGroups.length === 0 && (
        <div className="py-16 border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] text-center p-6 text-xs text-[#3c3836]">
          <p className="font-bold text-[#282828] text-sm">No groups found</p>
          <p className="mt-1 text-[#504945] font-medium">
            {search
              ? 'No matching records found for this query.'
              : 'No WhatsApp groups found in this category.'}
          </p>
        </div>
      )}

      {/* Gruvbox Table */}
      {!loading && !error && filteredGroups.length > 0 && (
        <div className="border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs border-collapse min-w-[640px]">
            <thead className="bg-[#ebdbb2] border-b-2 border-[#d5c4a1] text-[#282828] font-bold text-xs uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1] w-12 text-center font-mono">#</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]">Group Name</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1] w-56">Type</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]">Community Parent</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1] font-mono">WhatsApp ID</th>
                <th className="py-2.5 px-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebdbb2]">
              {filteredGroups.map((group, idx) => {
                const isParent = parentIdSet.has(group.id);
                const isSubgroup = Boolean(group.linkedParentJID);
                const parentName = group.linkedParentJID ? parentNameMap.get(group.linkedParentJID) : null;

                return (
                  <tr
                    key={group.id}
                    onClick={() => onSelectGroup(group)}
                    className="hover:bg-[#f2e5bc] active:bg-[#ebdbb2] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 border-r border-[#ebdbb2] text-center font-mono font-bold text-[#504945]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 border-r border-[#ebdbb2] font-medium text-[#282828]">
                      <h3 className="font-bold text-[#282828] text-sm inline leading-snug">
                        {group.name || 'Unnamed Group'}
                      </h3>
                    </td>
                    <td className="py-3 px-3 border-r border-[#ebdbb2]">
                      {isParent ? (
                        <span className="inline-block px-2.5 py-1 bg-[#d79921]/20 text-[#7a4800] border border-[#d79921]/45 rounded text-xs font-bold whitespace-nowrap">
                          Community Parent (Admins Only)
                        </span>
                      ) : isSubgroup ? (
                        <span className="inline-block px-2.5 py-1 bg-[#458588]/20 text-[#075968] border border-[#458588]/45 rounded text-xs font-bold whitespace-nowrap">
                          Subgroup
                        </span>
                      ) : (
                        <span className="text-[#504945] font-semibold text-xs">Group</span>
                      )}
                    </td>
                    <td className="py-3 px-3 border-r border-[#ebdbb2] text-xs font-semibold text-[#3c3836]">
                      {isSubgroup && parentName ? (
                        <span>Part of {parentName}</span>
                      ) : (
                        <span className="text-[#bdae93]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 border-r border-[#ebdbb2] font-mono text-xs font-semibold text-[#504945] break-all sm:break-normal">
                      {group.id}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGroup(group);
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold text-[#fbf1c7] bg-[#3c3836] hover:bg-[#282828] active:scale-[0.98] rounded transition-all duration-150 cursor-pointer shadow-xs whitespace-nowrap"
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
