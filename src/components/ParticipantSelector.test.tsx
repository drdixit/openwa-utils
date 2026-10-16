import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParticipantSelector } from './ParticipantSelector';
import { OpenWAGroup, OpenWAParticipant } from '../types/openwa';

const mockGroup: OpenWAGroup = {
  id: '123@g.us',
  name: 'Retail Traders',
  linkedParentJID: null,
};

const mockParticipants: OpenWAParticipant[] = [
  { id: '919409367178@c.us', number: '919409367178', isAdmin: true, isSuperAdmin: false },
  { id: '14155552671@c.us', number: '14155552671', isAdmin: false, isSuperAdmin: false },
  { id: '447911123456@c.us', number: '447911123456', isAdmin: false, isSuperAdmin: false },
];

describe('ParticipantSelector component', () => {
  it('renders all participants with formatted international numbers', () => {
    render(
      <ParticipantSelector
        group={mockGroup}
        participants={mockParticipants}
        loading={false}
        error={null}
        onBack={vi.fn()}
        onProceed={vi.fn()}
      />
    );

    expect(screen.getByText('+919409367178')).toBeInTheDocument();
    expect(screen.getByText('+14155552671')).toBeInTheDocument();
    expect(screen.getByText('+447911123456')).toBeInTheDocument();
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });

  it('selects and deselects all participants using Select All toggle', () => {
    render(
      <ParticipantSelector
        group={mockGroup}
        participants={mockParticipants}
        loading={false}
        error={null}
        onBack={vi.fn()}
        onProceed={vi.fn()}
      />
    );

    // Initial state: all selected (3 of 3)
    expect(screen.getByText(/3 of 3 selected/i)).toBeInTheDocument();

    const selectAllBtn = screen.getByText(/Deselect All/i);
    fireEvent.click(selectAllBtn);
    expect(screen.getByText(/0 of 3 selected/i)).toBeInTheDocument();

    const selectAllAgain = screen.getByText(/Select All/i);
    fireEvent.click(selectAllAgain);
    expect(screen.getByText(/3 of 3 selected/i)).toBeInTheDocument();
  });

  it('toggles individual participant checkboxes and updates selected count', () => {
    render(
      <ParticipantSelector
        group={mockGroup}
        participants={mockParticipants}
        loading={false}
        error={null}
        onBack={vi.fn()}
        onProceed={vi.fn()}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox in list is participant 1 (skip select all button)
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText(/2 of 3 selected/i)).toBeInTheDocument();
  });

  it('disables Next button when 0 participants selected', () => {
    render(
      <ParticipantSelector
        group={mockGroup}
        participants={mockParticipants}
        loading={false}
        error={null}
        onBack={vi.fn()}
        onProceed={vi.fn()}
      />
    );

    const deselectBtn = screen.getByText(/Deselect All/i);
    fireEvent.click(deselectBtn);

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    expect(nextBtn).toBeDisabled();
  });

  it('invokes onProceed with selected participants when Next is clicked', () => {
    const handleProceed = vi.fn();
    render(
      <ParticipantSelector
        group={mockGroup}
        participants={mockParticipants}
        loading={false}
        error={null}
        onBack={vi.fn()}
        onProceed={handleProceed}
      />
    );

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    expect(handleProceed).toHaveBeenCalledWith(mockParticipants);
  });

  it('invokes onBack when Back button is clicked', () => {
    const handleBack = vi.fn();
    render(
      <ParticipantSelector
        group={mockGroup}
        participants={mockParticipants}
        loading={false}
        error={null}
        onBack={handleBack}
        onProceed={vi.fn()}
      />
    );

    const backBtn = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalled();
  });
});
