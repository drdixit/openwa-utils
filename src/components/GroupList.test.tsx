import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupList } from './GroupList';
import { OpenWAGroup } from '../types/openwa';

const mockGroups: OpenWAGroup[] = [
  { id: '123@g.us', name: 'Alpha Traders', linkedParentJID: null },
  { id: '456@g.us', name: 'Beta Community', linkedParentJID: null },
  { id: '789@g.us', name: 'Gamma Network', linkedParentJID: null },
];

describe('GroupList component', () => {
  it('renders group items with their names', () => {
    render(
      <GroupList
        groups={mockGroups}
        loading={false}
        error={null}
        onSelectGroup={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Alpha Traders')).toBeInTheDocument();
    expect(screen.getByText('Beta Community')).toBeInTheDocument();
    expect(screen.getByText('Gamma Network')).toBeInTheDocument();
  });

  it('filters groups based on search query', () => {
    render(
      <GroupList
        groups={mockGroups}
        loading={false}
        error={null}
        onSelectGroup={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search groups/i);
    fireEvent.change(searchInput, { target: { value: 'Beta' } });

    expect(screen.queryByText('Alpha Traders')).not.toBeInTheDocument();
    expect(screen.getByText('Beta Community')).toBeInTheDocument();
  });

  it('calls onSelectGroup when a group card is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <GroupList
        groups={mockGroups}
        loading={false}
        error={null}
        onSelectGroup={handleSelect}
        onRefresh={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Alpha Traders'));
    expect(handleSelect).toHaveBeenCalledWith(mockGroups[0]);
  });

  it('renders loading state when loading is true', () => {
    render(
      <GroupList
        groups={[]}
        loading={true}
        error={null}
        onSelectGroup={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText(/Loading groups/i)).toBeInTheDocument();
  });

  it('renders error message when error is provided', () => {
    render(
      <GroupList
        groups={[]}
        loading={false}
        error="Network connection failed"
        onSelectGroup={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText(/Network connection failed/i)).toBeInTheDocument();
  });

  it('renders empty state when no groups are found', () => {
    render(
      <GroupList
        groups={[]}
        loading={false}
        error={null}
        onSelectGroup={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText(/No groups found/i)).toBeInTheDocument();
  });

  it('identifies community parents and subgroups and renders appropriate badges', () => {
    const communityGroups: OpenWAGroup[] = [
      { id: 'parent@g.us', name: 'Krpriyaboutique 5', linkedParentJID: null },
      { id: 'child1@g.us', name: 'Krpriyaboutique 5', linkedParentJID: 'parent@g.us' },
      { id: 'child2@g.us', name: 'KRPRIYA Offers', linkedParentJID: 'parent@g.us' },
      { id: 'solo@g.us', name: 'Standalone Chat', linkedParentJID: null },
    ];

    render(
      <GroupList
        groups={communityGroups}
        loading={false}
        error={null}
        onSelectGroup={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    // Parent container badge
    expect(screen.getByText(/Community Parent \(Admins Only\)/i)).toBeInTheDocument();
    // Subgroup badges
    expect(screen.getAllByText('Subgroup')).toHaveLength(2);
    // Parent attribution
    expect(screen.getAllByText(/Part of Krpriyaboutique 5/i)).toHaveLength(2);
  });

  it('filters groups using filter category pills', () => {
    const communityGroups: OpenWAGroup[] = [
      { id: 'parent@g.us', name: 'Parent Community', linkedParentJID: null },
      { id: 'child@g.us', name: 'Child Announcements', linkedParentJID: 'parent@g.us' },
      { id: 'solo@g.us', name: 'Solo Group', linkedParentJID: null },
    ];

    render(
      <GroupList
        groups={communityGroups}
        loading={false}
        error={null}
        onSelectGroup={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    // Filter pill buttons exist
    const withContactsPill = screen.getByRole('button', { name: /With Contacts \(2\)/i });
    const parentsPill = screen.getByRole('button', { name: /Community Parents \(1\)/i });

    // Click "With Contacts"
    fireEvent.click(withContactsPill);
    expect(screen.queryByText('Parent Community')).not.toBeInTheDocument();
    expect(screen.getByText('Child Announcements')).toBeInTheDocument();
    expect(screen.getByText('Solo Group')).toBeInTheDocument();

    // Click "Community Parents"
    fireEvent.click(parentsPill);
    expect(screen.getByText('Parent Community')).toBeInTheDocument();
    expect(screen.queryByText('Child Announcements')).not.toBeInTheDocument();
    expect(screen.queryByText('Solo Group')).not.toBeInTheDocument();
  });
});

