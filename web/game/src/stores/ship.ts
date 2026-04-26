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
  fighters: number;
  upgrades: Record<string, number>;
  kills: number;
  deaths: number;
  reputation: number;
  netWorth: number;
  insuranceActive: boolean;
  insuranceExpires: string | null;
}

export const useShipStore = defineStore('ship', () => {
  const ship = ref<ShipState | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const message = ref<string | null>(null);
  const stats = ref({ kills: 0, deaths: 0, kdr: 0, wanted: false, wantedKillCount: 0, netWorth: 0, reputation: 0, insuranceActive: false, insuranceExpires: null as string | null });

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
        fighters: s.fighters ?? 0,
        upgrades: JSON.parse(s.upgrades_json || '{}'),
        kills: s.kills ?? 0,
        deaths: s.deaths ?? 0,
        reputation: s.reputation ?? 0,
        netWorth: s.net_worth ?? s.credits,
        insuranceActive: s.insurance_expires ? new Date(s.insurance_expires) > new Date() : false,
        insuranceExpires: s.insurance_expires ?? null,
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

  async function moveShip(galaxyId: number, sectorId: number): Promise<{ status: 'moved'; ship: any; operations?: any[]; outcome?: any } | { status: 'encounter'; encounter: any } | { status: 'error'; error: string }> {
    const auth = useAuthStore();
    try {
      const res = await fetch(`${API_BASE}/api/player/ship/move`, {
        method: 'POST',
        headers: auth.getHeaders(),
        body: JSON.stringify({ galaxyId, sectorId }),
      });
      const data = await res.json();

      if (res.status === 409 && data?.encounterRequired) {
        return { status: 'encounter', encounter: data };
      }

      if (!res.ok) throw new Error(data.error || 'Move failed');

      const nextShip = data.ship ?? data.outcome?.ship;
      if (ship.value && nextShip) {
        ship.value.currentSector = nextShip.current_sector;
        ship.value.turns = nextShip.turns;
        ship.value.hull = nextShip.hull;
        ship.value.shield = nextShip.shield;
        ship.value.credits = nextShip.credits;
        ship.value.fighters = nextShip.fighters ?? ship.value.fighters;
      }

      return { status: 'moved', ship: nextShip, operations: data.operations, outcome: data.outcome };
    } catch (err: any) {
      message.value = err.message;
      return { status: 'error', error: err.message };
    }
  }

  async function resolveFighterEncounter(
    galaxyId: number,
    targetSectorId: number,
    action: 'attack' | 'retreat' | 'surrender' | 'pay_toll',
  ) {
    const auth = useAuthStore();
    const res = await fetch(`${API_BASE}/api/fighters/encounter/resolve`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({ galaxyId, targetSectorId, action }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Encounter resolution failed');

    const nextShip = data.ship;
    if (ship.value && nextShip) {
      ship.value.currentSector = nextShip.current_sector;
      ship.value.turns = nextShip.turns;
      ship.value.hull = nextShip.hull;
      ship.value.shield = nextShip.shield;
      ship.value.credits = nextShip.credits;
      ship.value.fighters = nextShip.fighters ?? ship.value.fighters;
    }

    return data;
  }

  async function loadStats(galaxyId: number) {
    const auth = useAuthStore();
    try {
      const res = await fetch(`${API_BASE}/api/player/stats?galaxyId=${galaxyId}`, {
        headers: auth.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return;
      stats.value = {
        kills: data.kills ?? 0,
        deaths: data.deaths ?? 0,
        kdr: data.kdr ?? 0,
        wanted: data.wanted ?? false,
        wantedKillCount: data.wantedKillCount ?? 0,
        netWorth: data.netWorth ?? 0,
        reputation: data.reputation ?? 0,
        insuranceActive: data.insuranceActive ?? false,
        insuranceExpires: data.insuranceExpires ?? null,
      };
    } catch {
      // silently fail
    }
  }

  async function buyFighters(galaxyId: number, quantity: number) {
    const auth = useAuthStore();
    const res = await fetch(`${API_BASE}/api/fighters/buy`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({ galaxyId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to buy fighters');

    if (ship.value) {
      ship.value.credits = data.remainingCredits;
      ship.value.fighters = data.shipFighters;
    }

    return data;
  }

  async function deployFighters(galaxyId: number, sectorId: number, quantity: number, mode: 'defensive' | 'offensive' | 'tolled') {
    const auth = useAuthStore();
    const res = await fetch(`${API_BASE}/api/fighters/deploy`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({ galaxyId, sectorId, quantity, mode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to deploy fighters');

    if (ship.value) {
      ship.value.fighters = data.remainingShipFighters;
    }

    return data;
  }

  async function recallFighters(galaxyId: number, sectorId: number, quantity?: number) {
    const auth = useAuthStore();
    const res = await fetch(`${API_BASE}/api/fighters/recall`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({ galaxyId, sectorId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to recall fighters');

    if (ship.value) {
      ship.value.fighters = data.shipFighters;
    }

    return data;
  }

  function clearMessage() {
    message.value = null;
  }

  return {
    ship,
    loading,
    error,
    message,
    stats,
    loadShip,
    createShip,
    moveShip,
    clearMessage,
    applyEffectiveStats,
    loadStats,
    buyFighters,
    deployFighters,
    recallFighters,
    resolveFighterEncounter,
  };
});
