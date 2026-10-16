import { OpenWAGroup, OpenWAGroupDetail } from '../types/openwa';

export interface OpenWAConfig {
  apiUrl: string;
  apiKey: string;
  sessionId: string;
}

export const DEFAULT_OPENWA_CONFIG: OpenWAConfig = {
  apiUrl: 'http://localhost:2785',
  apiKey: 'owa_k1_7a62176801cde43df4e13abff974f8a1efe1771e9777078ae22a92809d87202c',
  sessionId: 'a9a7f860-5961-48e3-908c-66880d8e6197',
};

export function getEnvConfig(): OpenWAConfig {
  const apiUrl = (import.meta.env.VITE_OPENWA_URL as string) || DEFAULT_OPENWA_CONFIG.apiUrl;
  const apiKey = (import.meta.env.VITE_OPENWA_API_KEY as string) || DEFAULT_OPENWA_CONFIG.apiKey;
  const sessionId = (import.meta.env.VITE_OPENWA_SESSION_ID as string) || DEFAULT_OPENWA_CONFIG.sessionId;

  return { apiUrl, apiKey, sessionId };
}

/**
 * Resolves the API base path. In browser environment when using the default/relative host,
 * uses the '/api' dev proxy; otherwise uses the configured apiUrl.
 */
function getApiBasePath(apiUrl?: string): string {
  if (!apiUrl) {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return '/api';
    }
    const env = getEnvConfig();
    return `${env.apiUrl.replace(/\/+$/, '')}/api`;
  }

  const clean = apiUrl.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

/**
 * Purely read-only GET request to list WhatsApp groups for the configured session.
 */
export async function fetchGroups(config?: OpenWAConfig): Promise<OpenWAGroup[]> {
  const activeConfig = config || getEnvConfig();
  const basePath = getApiBasePath(config?.apiUrl);
  const url = `${basePath}/sessions/${activeConfig.sessionId}/groups`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': activeConfig.apiKey,
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
export async function fetchGroupDetails(groupId: string, config?: OpenWAConfig): Promise<OpenWAGroupDetail> {
  const activeConfig = config || getEnvConfig();
  const basePath = getApiBasePath(config?.apiUrl);
  const url = `${basePath}/sessions/${activeConfig.sessionId}/groups/${groupId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': activeConfig.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch group details for ${groupId}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as OpenWAGroupDetail;
}

