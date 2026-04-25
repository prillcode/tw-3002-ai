import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import { computeEffectiveStats } from '../data/ships';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.playtradewars.net';

export interface ShipState {
  name: string;
  credits: number;
  cargo: { ore: number; organics: number; equipment: number };
  maxCargo: number;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  turns: number;
  maxTurns: number;
  classId: string;
  currentSector: number;
  upgrades: Record<string, number>;
}

export const useShipStore = defineStore('ship', () => {
  const ship = ref<ShipState | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const message = ref<string | null>(null);

  function applyEffectiveStats() {
    if (!ship.value) return;
    const stats = computeEffectiveStats(ship.value.classId, ship.value.upgrades);
    ship.value.maxCargo = stats.maxCargo;
    ship.value.maxHull = stats.maxHull;
    ship.value.maxShield = stats.shieldPoints;
    ship.value.maxTurns = stats.maxTurns;
    // Cap current shield/hull at new maxima
    ship.value.shield = Math.min(ship.value.shield, stats.shieldPoints);
    ship.value.hull = Math.min(ship.value.hull, stats.maxHull);
  }

  async function loadShip(galaxyId: number) {
    const auth = useAuthStore();
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/player/ship?galaxyId=${galaxyId}`, {
        headers: auth.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          ship.value = null;
          return;
        }
        throw new Error(data.error || 'Failed to load ship');
      }
      const s = data.ship;
      ship.value = {
        name: s.ship_name,
        credits: s.credits,
        cargo: JSON.parse(s.cargo_json || '{}'),
        maxCargo: 120,
        hull: s.hull,
        maxHull: s.hull,
        shield: s.shield,
        maxShield: s.shield,
        turns: s.turns,
        maxTurns: s.max_turns,
        classId: s.class_id,
        currentSector: s.current_sector,
        upgrades: JSON.parse(s.upgrades_json || '{}'),
      };
      applyEffectiveStats();
      if (data.ship.regenerated > 0) {
        message.value = `+${data.ship.regenerated} turns regenerated while away`;
      }
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function createShip(galaxyId: number, shipName: string, classId: string) {
    const auth = useAuthStore();
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/player/ship`, {
        method: 'POST',
        headers: auth.getHeaders(),
        body: JSON.stringify({ galaxyId, shipName, classId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create ship');
      await loadShip(galaxyId);
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function moveShip(galaxyId: number, sectorId: number) {
    const auth = useAuthStore();
    try {
      const res = await fetch(`${API_BASE}/api/player/ship/move`, {
        method: 'POST',
        headers: auth.getHeaders(),
        body: JSON.stringify({ galaxyId, sectorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Move failed');
      if (ship.value) {
        ship.value.currentSector = sectorId;
        ship.value.turns = Math.max(0, ship.value.turns - 1);
      }
      return true;
    } catch (err: any) {
      message.value = err.message;
      return false;
    }
  }

  function clearMessage() {
    message.value = null;
  }

  return { ship, loading, error, message, loadShip, createShip, moveShip, clearMessage, applyEffectiveStats };
});
