import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.playtradewars.net';

export interface Sector {
  id: number;
  name: string;
  danger: 'safe' | 'caution' | 'dangerous';
  hasPort: boolean;
  portClass?: number;
  portName?: string;
  connections: number[];
  stardock: boolean;
}

export interface Galaxy {
  id: string;
  sectors: Map<number, Sector>;
  connections: Array<{ from: number; to: number }>;
  fedSpace: number[];
  stardocks: number[];
}

export const useGalaxyStore = defineStore('galaxy', () => {
  const galaxy = ref<Galaxy | null>(null);
  const currentSectorId = ref<number>(0);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const visitedIds = ref<number[]>([]);

  async function loadGalaxy(galaxyId: number) {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/galaxy/${galaxyId}/sectors`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load galaxy');

      const sectors = new Map<number, Sector>();
      const connections: Array<{ from: number; to: number }> = [];
      const fedSpace: number[] = [];
      const stardocks: number[] = [];

      for (const row of data.sectors) {
        const id = row.sector_index;
        const conns: number[] = JSON.parse(row.connections_json || '[]');
        sectors.set(id, {
          id,
          name: row.name,
          danger: row.danger || 'safe',
          hasPort: row.port_class != null,
          portClass: row.port_class,
          portName: row.port_name,
          connections: conns,
          stardock: row.stardock === 1,
        });
        for (const to of conns) {
          connections.push({ from: id, to });
        }
        if (row.danger === 'safe') fedSpace.push(id);
        if (row.stardock === 1) stardocks.push(id);
      }

      galaxy.value = { id: `cloud-${galaxyId}`, sectors, connections, fedSpace, stardocks };
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function loadSector(galaxyId: number, sectorId: number) {
    const auth = useAuthStore();
    try {
      const res = await fetch(`${API_BASE}/api/galaxy/${galaxyId}/sector?id=${sectorId}`, {
        headers: auth.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load sector');

      // Update sector inventory if present
      const sector = galaxy.value?.sectors.get(sectorId);
      if (sector && data.sector?.port_inventory_json) {
        (sector as any).inventory = JSON.parse(data.sector.port_inventory_json);
      }
      return data;
    } catch (err: any) {
      error.value = err.message;
      return null;
    }
  }

  function visit(sectorId: number) {
    currentSectorId.value = sectorId;
    visitedIds.value.push(sectorId);
  }

  const currentSector = () => galaxy.value?.sectors.get(currentSectorId.value) ?? null;

  const neighbors = () => {
    if (!galaxy.value) return [];
    return galaxy.value.connections
      .filter(c => c.from === currentSectorId.value)
      .map(c => galaxy.value!.sectors.get(c.to))
      .filter((s): s is Sector => s !== undefined);
  };

  return {
    galaxy, currentSectorId, loading, error, visitedIds,
    loadGalaxy, loadSector, visit, currentSector, neighbors,
  };
});
