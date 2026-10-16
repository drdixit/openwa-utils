import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportModal } from './ExportModal';
import { OpenWAParticipant } from '../types/openwa';
import * as vcfUtils from '../utils/vcf';

const mockSelected: OpenWAParticipant[] = [
  { id: '919409367178@c.us', number: '919409367178', isAdmin: false, isSuperAdmin: false },
  { id: '14155552671@c.us', number: '14155552671', isAdmin: false, isSuperAdmin: false },
  { id: '447911123456@c.us', number: '447911123456', isAdmin: false, isSuperAdmin: false },
];

describe('ExportModal component', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ExportModal
        isOpen={false}
        selectedParticipants={mockSelected}
        groupName="Test Group"
        onCancel={vi.fn()}
        onExportComplete={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders input for prefix with initial value and shows total count', () => {
    render(
      <ExportModal
        isOpen={true}
        selectedParticipants={mockSelected}
        groupName="Test Group"
        onCancel={vi.fn()}
        onExportComplete={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/e\.g\. hello/i)).toBeInTheDocument();
    expect(screen.getByText(/3 contacts selected/i)).toBeInTheDocument();
  });

  it('updates live preview when prefix changes', () => {
    render(
      <ExportModal
        isOpen={true}
        selectedParticipants={mockSelected}
        groupName="Test Group"
        onCancel={vi.fn()}
        onExportComplete={vi.fn()}
      />
    );

    const prefixInput = screen.getByPlaceholderText(/e\.g\. hello/i);
    fireEvent.change(prefixInput, { target: { value: 'client' } });

    expect(screen.getAllByText(/client1/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/client2/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/client3/i).length).toBeGreaterThanOrEqual(1);
  });

  it('calls downloadVcf and onExportComplete when Download is clicked', () => {
    const downloadSpy = vi.spyOn(vcfUtils, 'downloadVcf').mockImplementation(() => {});
    const handleComplete = vi.fn();

    render(
      <ExportModal
        isOpen={true}
        selectedParticipants={mockSelected}
        groupName="Retail Buyers"
        onCancel={vi.fn()}
        onExportComplete={handleComplete}
      />
    );

    const prefixInput = screen.getByPlaceholderText(/e\.g\. hello/i);
    fireEvent.change(prefixInput, { target: { value: 'hello' } });

    const downloadBtn = screen.getByRole('button', { name: /Download \.vcf/i });
    fireEvent.click(downloadBtn);

    expect(downloadSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Retail_Buyers.*\.vcf/),
      expect.stringContaining('FN:hello1\r\nTEL;TYPE=CELL:+919409367178')
    );
    expect(handleComplete).toHaveBeenCalled();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(
      <ExportModal
        isOpen={true}
        selectedParticipants={mockSelected}
        groupName="Test Group"
        onCancel={handleCancel}
        onExportComplete={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalled();
  });
});
