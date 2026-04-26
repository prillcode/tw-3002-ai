<template>
  <div class="min-h-screen bg-void-950 p-4 flex items-center justify-center">
    <div class="terminal-panel p-6 max-w-lg w-full border-terminal-red/50">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-mono font-bold text-terminal-red text-lg">⚔ COMBAT</h2>
        <button @click="goBack" class="terminal-btn text-xs">Esc</button>
      </div>

      <div v-if="!ship.ship" class="text-terminal-muted font-mono text-sm">No ship data.</div>

      <template v-else-if="!resolved">
        <!-- Enemy Info -->
        <div class="terminal-panel bg-void-900 p-4 mb-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">{{ enemyType === 'raider' ? '⚠️' : enemyType === 'patrol' ? '🛡️' : '📦' }}</span>
            <span class="font-mono font-bold text-terminal-red">{{ enemyName }}</span>
            <span class="text-terminal-muted font-mono text-xs">{{ enemyType }}</span>
          </div>
          <div class="text-sm font-mono text-terminal-muted">
            Hull: ???/??? · Shield: ???/???
          </div>
        </div>

        <!-- Player Stats -->
        <div class="terminal-panel bg-void-900 p-4 mb-4">
          <h3 class="font-mono font-bold text-terminal-cyan text-sm mb-2">Your Ship</h3>
          <div class="space-y-1 text-sm font-mono">
            <div class="flex justify-between">
              <span class="text-terminal-muted">Hull</span>
              <span :class="hullColor">{{ ship.ship.hull }}/{{ ship.ship.maxHull }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-terminal-muted">Shield</span>
              <span>{{ ship.ship.shield }}/{{ ship.ship.maxShield }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-terminal-muted">Credits</span>
              <span class="text-terminal-green">{{ ship.ship.credits.toLocaleString() }} cr</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-2">
          <button
            v-for="(action, i) in actions"
            :key="action.key"
            @click="selectedAction = i"
            :class="[
              'w-full text-left px-4 py-3 rounded font-mono text-sm font-bold transition-colors',
              selectedAction === i
                ? 'bg-terminal-red/20 border border-terminal-red/50 text-terminal-red'
                : 'bg-void-800 border border-void-600 text-terminal-white hover:bg-void-700'
            ]"
          >
            {{ selectedAction === i ? '> ' : '  ' }}{{ action.label }}
          </button>
        </div>

        <button
          @click="executeCombat"
          :disabled="resolving"
          class="w-full mt-4 terminal-btn-primary disabled:opacity-50"
        >
          {{ resolving ? 'Resolving...' : 'Confirm Action' }}
        </button>
      </template>

      <!-- Result -->
      <template v-else>
        <div class="terminal-panel bg-void-900 p-4 mb-4">
          <p class="text-terminal-white font-mono text-sm leading-relaxed">{{ narrative }}</p>
        </div>

        <div v-if="result" class="space-y-2 text-sm font-mono mb-4">
          <div v-if="result.destroyed" class="text-terminal-red font-bold">💥 SHIP DESTROYED</div>
          <div v-else-if="result.won" class="text-terminal-green font-bold">⚔ Victory! +{{ result.creditsGained?.toLocaleString() }} cr</div>
          <div v-else-if="result.fled" class="text-terminal-yellow">🏃 Escaped</div>
          <div v-else-if="result.bribed" class="text-terminal-magenta">💰 Bribed for {{ result.creditsLost?.toLocaleString() }} cr</div>
          <div v-else class="text-terminal-yellow">⚔ Combat ended</div>

          <div v-if="!result.destroyed" class="flex justify-between text-terminal-muted">
            <span>Hull remaining:</span>
            <span :class="result.playerHullRemaining < ship.ship.maxHull * 0.5 ? 'text-terminal-red' : 'text-terminal-green'">
              {{ result.playerHullRemaining }}/{{ ship.ship.maxHull }}
            </span>
          </div>
        </div>

        <button @click="goBack" class="w-full terminal-btn-primary">
          {{ result?.destroyed ? 'Continue' : 'Return to Sector' }}
        </button>
      </template>

      <div v-if="message && !resolved" class="mt-4 text-terminal-yellow font-mono text-sm">{{ message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useShipStore } from '../stores/ship';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const ship = useShipStore();
const auth = useAuthStore();

const galaxyId = 1;
const enemyId = (route.query.enemyId as string) || '';
const enemyName = (route.query.enemyName as string) || 'Unknown';
const enemyType = (route.query.enemyType as string) || 'raider';

const selectedAction = ref(0);
const resolving = ref(false);
const resolved = ref(false);
const result = ref<any>(null);
const narrative = ref('');
const message = ref<string | null>(null);

const actions = [
  { key: 'attack', label: 'Attack' },
  { key: 'flee', label: 'Attempt to Flee' },
  { key: 'bribe', label: 'Offer Bribe' },
];

const hullColor = computed(() => {
  if (!ship.ship) return '';
  const ratio = ship.ship.hull / ship.ship.maxHull;
  if (ratio > 0.5) return 'text-terminal-green';
  if (ratio > 0.25) return 'text-terminal-yellow';
  return 'text-terminal-red';
});

async function executeCombat() {
  if (!ship.ship || !enemyId) return;
  const action = actions[selectedAction.value]?.key as 'attack' | 'flee' | 'bribe';
  if (!action) return;

  resolving.value = true;
  message.value = null;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/action/combat`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({
        galaxyId,
        sectorId: ship.ship.currentSector,
        enemyNpcId: enemyId,
        playerAction: action,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Combat failed');

    result.value = data.result;
    narrative.value = data.narrative || 'The encounter ends in silence.';
    resolved.value = true;

    // Reload ship state from server (handles respawn, loot, insurance, etc.)
    await ship.loadShip(galaxyId);
  } catch (err: any) {
    message.value = err.message;
  } finally {
    resolving.value = false;
  }
}

function goBack() {
  router.push(`/galaxy/${galaxyId}`);
}

function handleKey(e: KeyboardEvent) {
  if (resolved.value && e.key === 'Enter') {
    goBack();
    return;
  }
  if (resolved.value) return;
  if (e.key === 'Escape') goBack();
  if (e.key === 'ArrowUp') selectedAction.value = Math.max(0, selectedAction.value - 1);
  if (e.key === 'ArrowDown') selectedAction.value = Math.min(actions.length - 1, selectedAction.value + 1);
  if (e.key === 'Enter') executeCombat();
}

window.addEventListener('keydown', handleKey);
onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
});
</script>
