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
});
