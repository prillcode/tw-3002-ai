/**
 * Cloud API client for TW 3002 AI.
 * Thin wrapper around fetch() for the Cloudflare Worker REST API.
 */

const API_BASE = process.env.TW3002_API_URL || 'https://tw3002-api.prilldev.workers.dev';

export interface CloudAuth {
  token: string;
  email: string;
}

let _auth: CloudAuth | null = null;

export function setAuth(auth: CloudAuth | null): void {
  _auth = auth;
}

export function getAuth(): CloudAuth | null {
  return _auth;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_auth) {
    h['Authorization'] = `Bearer ${_auth.token}`;
  }
  return h;
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers || {}) },
  });

  const data = await res.json().catch(() => ({ error: 'Invalid JSON' })) as Record<string, any>;

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data as T;
}

// ─── Auth ──────────────────────────────────────────────────

export async function cloudRegister(email: string): Promise<CloudAuth> {
  const data = await api<{ token: string; email: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return { token: data.token, email: data.email };
}

export async function cloudVerify(token: string): Promise<{ valid: boolean; playerId: number; email: string }> {
  return api('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// ─── Galaxy ────────────────────────────────────────────────

export async function cloudListGalaxies(): Promise<{ galaxies: Array<{ id: number; name: string; slug: string; sector_count: number }> }> {
  return api('/api/galaxy');
}

export async function cloudGetGalaxy(id: number): Promise<{ galaxy: any; playerCount: number }> {
  return api(`/api/galaxy/${id}`);
}

export async function cloudGetSectors(galaxyId: number): Promise<{ sectors: Array<any> }> {
  return api(`/api/galaxy/${galaxyId}/sectors`);
}

export async function cloudGetSector(galaxyId: number, sectorId: number): Promise<{ sector: any; npcs: Array<any> }> {
  return api(`/api/galaxy/${galaxyId}/sector?id=${sectorId}`);
}

// ─── Player ────────────────────────────────────────────────

export async function cloudGetPlayer(): Promise<{ player: any }> {
  return api('/api/player');
}

export async function cloudGetShip(galaxyId: number): Promise<{ ship: any }> {
  return api(`/api/player/ship?galaxyId=${galaxyId}`);
}

export async function cloudCreateShip(galaxyId: number, shipName: string, classId: string): Promise<{ ship: any }> {
  return api('/api/player/ship', {
    method: 'POST',
    body: JSON.stringify({ galaxyId, shipName, classId }),
  });
}

export async function cloudMoveShip(galaxyId: number, sectorId: number): Promise<{ ship: any; moved: boolean }> {
  return api('/api/player/ship/move', {
    method: 'POST',
    body: JSON.stringify({ galaxyId, sectorId }),
  });
}

// ─── Actions ───────────────────────────────────────────────

export async function cloudTrade(
  galaxyId: number,
  sectorId: number,
  commodity: string,
  quantity: number,
  action: 'buy' | 'sell'
): Promise<any> {
  return api('/api/action/trade', {
    method: 'POST',
    body: JSON.stringify({ galaxyId, sectorId, commodity, quantity, action }),
  });
}

export async function cloudCombat(
  galaxyId: number,
  sectorId: number,
  enemyNpcId: string,
  playerAction: 'attack' | 'flee' | 'bribe'
): Promise<{ result: any; narrative?: string }> {
  return api('/api/action/combat', {
    method: 'POST',
    body: JSON.stringify({ galaxyId, sectorId, enemyNpcId, playerAction }),
  });
}

export async function cloudUpgrade(
  galaxyId: number,
  sectorId: number,
  upgradeId: string
): Promise<any> {
  return api('/api/action/upgrade', {
    method: 'POST',
    body: JSON.stringify({ galaxyId, sectorId, upgradeId }),
  });
}

// ─── News / Leaderboard ────────────────────────────────────

export async function cloudGetNews(galaxyId: number, limit?: number): Promise<{ news: Array<any> }> {
  return api(`/api/news?galaxyId=${galaxyId}${limit ? `&limit=${limit}` : ''}`);
}

export async function cloudGetLeaderboard(galaxyId: number, limit?: number): Promise<{ leaderboard: Array<any> }> {
  return api(`/api/leaderboard?galaxyId=${galaxyId}${limit ? `&limit=${limit}` : ''}`);
}
