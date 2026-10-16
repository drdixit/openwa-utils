import { OpenWAGroup, OpenWAGroupDetail } from '../types/openwa';

export interface OpenWAConfig {
  apiUrl: string;
  apiKey: string;
  sessionId: string;
}

export function getEnvConfig(): OpenWAConfig {
  const apiUrl = (import.meta.env.VITE_OPENWA_URL as string) || 'http://localhost:2785';
  const apiKey = (import.meta.env.VITE_OPENWA_API_KEY as string) || '';
  const sessionId = (import.meta.env.VITE_OPENWA_SESSION_ID as string) || '';

  return { apiUrl, apiKey, sessionId };
}

/**
 * Resolves the API base path. In browser environment, uses the '/api' dev proxy
 * to prevent CORS restrictions; in other environments falls back to `${apiUrl}/api`.
 */
function getApiBasePath(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return '/api';
  }
  const { apiUrl } = getEnvConfig();
  return `${apiUrl.replace(/\/+$/, '')}/api`;
}

/**
 * Purely read-only GET request to list WhatsApp groups for the configured session.
 */
export async function fetchGroups(): Promise<OpenWAGroup[]> {
  const { apiKey, sessionId } = getEnvConfig();
  const basePath = getApiBasePath();
  const url = `${basePath}/sessions/${sessionId}/groups`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as OpenWAGroup[];
}

/**
 * Purely read-only GET request to fetch group details and participants for a specific group.
 */
export async function fetchGroupDetails(groupId: string): Promise<OpenWAGroupDetail> {
  const { apiKey, sessionId } = getEnvConfig();
  const basePath = getApiBasePath();
  const url = `${basePath}/sessions/${sessionId}/groups/${groupId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch group details for ${groupId}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as OpenWAGroupDetail;
}
