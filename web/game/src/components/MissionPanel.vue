<template>
  <div class="terminal-panel p-4 max-w-md w-full">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-mono font-bold text-terminal-yellow text-lg">📋 DAILY BOUNTIES</h2>
      <button @click="$emit('close')" class="terminal-btn text-xs">Esc</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-terminal-cyan font-mono text-sm">Loading...</div>
    <div v-else-if="error" class="text-terminal-red font-mono text-sm">{{ error }}</div>

    <!-- Missions list -->
    <div v-else-if="missions.length === 0" class="text-terminal-muted font-mono text-sm">
      No active bounties.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="mission in missions"
        :key="mission.id"
        class="border rounded p-3 font-mono text-sm transition-colors"
        :class="missionCardClass(mission)"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold">{{ missionLabel(mission.type) }}</span>
          <span :class="mission.completed ? 'text-terminal-green' : 'text-terminal-yellow'">
            {{ mission.currentCount }}/{{ mission.targetCount }}
          </span>
        </div>

        <!-- Progress bar -->
        <div class="h-2 bg-void-800 rounded overflow-hidden mb-2">
          <div
            class="h-full transition-all duration-500"
            :class="mission.completed ? 'bg-terminal-green' : 'bg-terminal-cyan'"
            :style="{ width: mission.progress + '%' }"
          />
        </div>

        <div class="flex items-center justify-between">
          <span class="text-terminal-green">💰 {{ mission.rewardCredits.toLocaleString() }} cr</span>

          <!-- Claim button (completed & unclaimed) -->
          <button
            v-if="mission.completed && !mission.claimed"
            @click="claimMission(mission.id)"
            :disabled="claiming[mission.id]"
            class="terminal-btn text-xs bg-terminal-green/20 text-terminal-green border-terminal-green/50"
          >
            {{ claiming[mission.id] ? '...' : 'Claim' }}
          </button>

          <!-- Reroll button (uncompleted & unclaimed) -->
          <button
            v-else-if="!mission.completed && !mission.claimed"
            @click="rerollMission(mission.id)"
            :disabled="rerolling[mission.id]"
            class="terminal-btn text-xs text-terminal-muted hover:text-terminal-yellow"
          >
            {{ rerolling[mission.id] ? '...' : `Reroll (${rerollCost(mission)}cr)` }}
          </button>

          <!-- Claimed badge -->
          <span v-else-if="mission.claimed" class="text-terminal-green text-xs">✓ Claimed</span>
        </div>
      </div>
    </div>

    <!-- All claimed message -->
    <div v-if="allClaimed" class="mt-3 text-terminal-green font-mono text-xs text-center">
      🎉 All bounties claimed! New missions at 00:00 UTC.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useShipStore } from '../stores/ship';

interface Mission {
  id: number;
  type: string;
  targetCount: number;
  currentCount: number;
  rewardCredits: number;
  completed: boolean;
  claimed: boolean;
  progress: number;
}

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'claimed', reward: number): void;
}>();

const auth = useAuthStore();
const ship = useShipStore();

const galaxyId = 1;
const loading = ref(true);
const error = ref<string | null>(null);
const missions = ref<Mission[]>([]);
const allClaimed = ref(false);
const claiming = ref<Record<number, boolean>>({});
const rerolling = ref<Record<number, boolean>>({});

const API_URL = import.meta.env.VITE_API_URL || 'https://api.playtradewars.net';

function missionLabel(type: string): string {
  const labels: Record<string, string> = {
    kill_npcs: 'Hunt Pirates',
    trade_credits: 'Trade Profits',
    visit_sectors: 'Explore Sectors',
    claim_planet: 'Colonize Planets',
    pay_taxes: 'Pay CHOAM Tariffs',
  };
  return labels[type] || type;
}

function missionCardClass(mission: Mission): string {
  if (mission.claimed) return 'border-terminal-muted/30 opacity-60';
  if (mission.completed) return 'border-terminal-green/50 bg-terminal-green/5';
  return 'border-void-600';
}

function rerollCost(mission: Mission): number {
  return Math.max(500, Math.floor(mission.rewardCredits * 0.5));
}

async function loadMissions() {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`${API_URL}/api/player/missions?galaxyId=${galaxyId}`, {
      headers: auth.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load bounties');
    missions.value = data.missions ?? [];
    allClaimed.value = data.allClaimed ?? false;
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function claimMission(missionId: number) {
  claiming.value[missionId] = true;
  try {
    const res = await fetch(`${API_URL}/api/player/missions/claim`, {
      method: 'POST',
      headers: { ...auth.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ galaxyId, missionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Claim failed');

    // Update local state
    const idx = missions.value.findIndex(m => m.id === missionId);
    if (idx >= 0) {
      missions.value[idx].claimed = true;
    }

    // Refresh ship credits
    await ship.loadShip(galaxyId);

    emit('claimed', data.reward);
  } catch (err: any) {
    error.value = err.message;
  } finally {
    claiming.value[missionId] = false;
  }
}

async function rerollMission(missionId: number) {
  rerolling.value[missionId] = true;
  try {
    const res = await fetch(`${API_URL}/api/player/missions/reroll`, {
      method: 'POST',
      headers: { ...auth.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ galaxyId, missionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reroll failed');

    // Refresh ship credits (cost was deducted server-side)
    await ship.loadShip(galaxyId);

    // Refresh missions to get updated list
    await loadMissions();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    rerolling.value[missionId] = false;
  }
}

onMounted(() => {
  loadMissions();
});
</script>
