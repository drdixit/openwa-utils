import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as openwaService from './services/openwa';
import * as vcfUtils from './utils/vcf';
import { OpenWAGroup, OpenWAGroupDetail } from './types/openwa';

const mockGroups: OpenWAGroup[] = [
  { id: '123@g.us', name: 'Alpha Traders', linkedParentJID: null },
  { id: '456@g.us', name: 'Beta Community', linkedParentJID: null },
];

const mockDetail: OpenWAGroupDetail = {
  id: '123@g.us',
  name: 'Alpha Traders',
  participants: [
    { id: '919409367178@c.us', number: '919409367178', isAdmin: true, isSuperAdmin: false },
    { id: '14155552671@c.us', number: '14155552671', isAdmin: false, isSuperAdmin: false },
  ],
};

describe('App End-to-End Extraction Workflow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(openwaService, 'fetchGroups').mockResolvedValue(mockGroups);
    vi.spyOn(openwaService, 'fetchGroupDetails').mockResolvedValue(mockDetail);
  });

  it('completes the full flow: loads groups, selects contacts, exports vcf, and returns to home', async () => {
    const downloadSpy = vi.spyOn(vcfUtils, 'downloadVcf').mockImplementation(() => {});

    render(<App />);

    // Step 1: Wait for groups to load
    await waitFor(() => {
      expect(screen.getByText('Alpha Traders')).toBeInTheDocument();
      expect(screen.getByText('Beta Community')).toBeInTheDocument();
    });

    // Step 2: Click group to view contacts
    fireEvent.click(screen.getByText('Alpha Traders'));

    await waitFor(() => {
      expect(screen.getByText('+919409367178')).toBeInTheDocument();
      expect(screen.getByText('+14155552671')).toBeInTheDocument();
      expect(screen.getByText(/2 of 2 selected/i)).toBeInTheDocument();
    });

    // Step 3: Click Next to open export modal
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Export Contacts to \.vcf/i)).toBeInTheDocument();

    // Step 4: Change prefix to 'buyer'
    const prefixInput = screen.getByPlaceholderText(/e\.g\. hello/i);
    fireEvent.change(prefixInput, { target: { value: 'buyer' } });

    // Step 5: Click Download .vcf
    const downloadBtn = screen.getByRole('button', { name: /Download \.vcf File/i });
    fireEvent.click(downloadBtn);

    // Verify downloadVcf was called with correct vCard content
    expect(downloadSpy).toHaveBeenCalledWith(
      expect.stringContaining('Alpha_Traders_buyer.vcf'),
      expect.stringContaining('FN:buyer1\r\nTEL;TYPE=CELL:+919409367178')
    );

    // Step 6: Verify automatic reset back to Home (group list)
    await waitFor(() => {
      expect(screen.getByText(/Select a WhatsApp Group/i)).toBeInTheDocument();
      expect(screen.getByText('Alpha Traders')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /Export Contacts to \.vcf/i })).toBeNull();
      expect(screen.queryByPlaceholderText(/e\.g\. hello/i)).toBeNull();
    });
  });

  it('allows user to edit connection config in top bar and reloads groups', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Traders')).toBeInTheDocument();
    });

    // Initial fetchGroups call was made with default config
    expect(openwaService.fetchGroups).toHaveBeenCalledWith(
      expect.objectContaining({
        apiUrl: 'http://localhost:2785',
        apiKey: 'owa_k1_7a62176801cde43df4e13abff974f8a1efe1771e9777078ae22a92809d87202c',
        sessionId: 'a9a7f860-5961-48e3-908c-66880d8e6197',
      })
    );

    // Click Edit button
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));

    // Change session ID
    const sessionInput = screen.getByLabelText(/Session ID/i);
    fireEvent.change(sessionInput, { target: { value: 'custom-session-uuid-123' } });

    // Click Save button
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    // Verify fetchGroups is called with the new session ID
    await waitFor(() => {
      expect(openwaService.fetchGroups).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'custom-session-uuid-123',
        })
      );
    });
  });
});

