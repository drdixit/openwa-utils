import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGroups, fetchGroupDetails, getEnvConfig } from './openwa';

describe('openwa service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides environment configuration', () => {
    const config = getEnvConfig();
    expect(config).toBeDefined();
    expect(typeof config.apiKey).toBe('string');
    expect(typeof config.sessionId).toBe('string');
  });

  it('fetches groups using GET and passes X-API-Key header', async () => {
    const mockGroups = [{ id: '123@g.us', name: 'Test Group', linkedParentJID: null }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGroups,
    });

    const groups = await fetchGroups();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'X-API-Key': expect.any(String) }),
      })
    );
    expect(groups).toEqual(mockGroups);
  });

  it('fetches group details with participants using GET', async () => {
    const mockDetail = {
      id: '123@g.us',
      name: 'Test Group',
      participants: [{ id: '919409367178@c.us', number: '919409367178', isAdmin: false, isSuperAdmin: false }],
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDetail,
    });

    const detail = await fetchGroupDetails('123@g.us');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/groups/123@g.us'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(detail.participants).toHaveLength(1);
  });

  it('throws descriptive error when API returns non-200 status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchGroups()).rejects.toThrow('Failed to fetch groups');
  });
});
