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
          <h2 className="text-xl font-semibold text-[#282828] tracking-tight">Select a WhatsApp Group</h2>
          <p className="text-xs text-[#7c6f64] mt-0.5">
            Pick a group to view participants and export contacts to .vcf
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#3c3836] bg-[#ebdbb2] hover:bg-[#d5c4a1] border border-[#d5c4a1] rounded-md transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#7c6f64]' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Toolbar: Search & Segmented View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#928374]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups by name..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f9f5d7] border border-[#d5c4a1] rounded-md text-[#282828] placeholder-[#928374] focus:bg-white focus:outline-hidden focus:border-[#7c6f64] transition-colors font-sans"
          />
        </div>

        {/* Gruvbox Segmented View Tabs */}
        {!loading && groups.length > 0 && (
          <div className="inline-flex p-0.5 bg-[#ebdbb2] border border-[#d5c4a1] rounded-lg text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer font-medium ${
                filterCategory === 'all'
                  ? 'bg-[#fbf1c7] text-[#282828] shadow-2xs font-semibold'
                  : 'text-[#7c6f64] hover:text-[#282828]'
              }`}
            >
              All Groups ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('with-contacts')}
              className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer font-medium ${
                filterCategory === 'with-contacts'
                  ? 'bg-[#fbf1c7] text-[#282828] shadow-2xs font-semibold'
                  : 'text-[#7c6f64] hover:text-[#282828]'
              }`}
            >
              With Contacts ({counts.withContacts})
            </button>
            {counts.parents > 0 && (
              <button
                type="button"
                onClick={() => setFilterCategory('parents')}
                className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer font-medium ${
                  filterCategory === 'parents'
                    ? 'bg-[#fbf1c7] text-[#282828] shadow-2xs font-semibold'
                    : 'text-[#7c6f64] hover:text-[#282828]'
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
        <div className="p-3 bg-[#cc241d]/10 border border-[#cc241d]/30 rounded-lg flex items-start gap-2.5 text-[#9d0006] text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#cc241d] mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load groups:</p>
            <p className="mt-0.5 text-[#7c6f64]">{error}</p>
          </div>
          <button
            onClick={onRefresh}
            className="underline font-semibold hover:text-[#282828] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-16 border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] flex flex-col items-center justify-center gap-2 text-[#7c6f64] text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-[#928374]" />
          <p>Loading groups from OpenWA...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredGroups.length === 0 && (
        <div className="py-16 border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] text-center p-6 text-xs text-[#7c6f64]">
          <p className="font-semibold text-[#282828]">No groups found</p>
          <p className="mt-1 text-[#928374]">
            {search
              ? 'No matching records found for this query.'
              : 'No WhatsApp groups found in this category.'}
          </p>
        </div>
      )}

      {/* Gruvbox Table */}
      {!loading && !error && filteredGroups.length > 0 && (
        <div className="border border-[#d5c4a1] rounded-lg bg-[#f9f5d7] overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#ebdbb2] border-b border-[#d5c4a1] text-[#7c6f64] font-medium select-none">
              <tr>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]/70 w-12 text-center font-mono">#</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]/70">Group Name</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]/70 w-52">Type</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]/70">Community Parent</th>
                <th className="py-2.5 px-3 border-r border-[#d5c4a1]/70 font-mono">WhatsApp ID</th>
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
                    className="hover:bg-[#f2e5bc] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 border-r border-[#ebdbb2] text-center font-mono text-[#928374]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#ebdbb2] font-medium text-[#282828]">
                      <h3 className="font-semibold text-[#282828] inline">
                        {group.name || 'Unnamed Group'}
                      </h3>
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#ebdbb2]">
                      {isParent ? (
                        <span className="inline-block px-2 py-0.5 bg-[#d79921]/15 text-[#b57614] border border-[#d79921]/30 rounded text-[11px] font-medium">
                          Community Parent (Admins Only)
                        </span>
                      ) : isSubgroup ? (
                        <span className="inline-block px-2 py-0.5 bg-[#458588]/15 text-[#076678] border border-[#458588]/30 rounded text-[11px] font-medium">
                          Subgroup
                        </span>
                      ) : (
                        <span className="text-[#928374] font-normal">Group</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#ebdbb2] text-[#7c6f64]">
                      {isSubgroup && parentName ? (
                        <span>Part of {parentName}</span>
                      ) : (
                        <span className="text-[#bdae93]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-r border-[#ebdbb2] font-mono text-[11px] text-[#928374]">
                      {group.id}
                    </td>
                    <td className="py-1 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGroup(group);
                        }}
                        className="px-3 py-1 text-xs font-medium text-[#fbf1c7] bg-[#3c3836] hover:bg-[#282828] rounded transition-colors cursor-pointer"
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
