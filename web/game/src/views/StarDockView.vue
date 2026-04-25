<template>
  <div class="min-h-screen bg-void-950 p-4 flex items-center justify-center">
    <div class="terminal-panel p-6 max-w-lg w-full">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-mono font-bold text-terminal-magenta text-lg">⚡ STARDOCK</h2>
        <button @click="goBack" class="terminal-btn text-xs">Esc</button>
      </div>

      <div v-if="!ship.ship" class="text-terminal-muted font-mono text-sm">No ship data.</div>

      <template v-else>
        <!-- Owned Upgrades -->
        <div v-if="owned.length > 0" class="mb-4">
          <h3 class="font-mono font-bold text-terminal-cyan text-sm mb-2">Installed</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="u in owned"
              :key="u.id"
              class="px-2 py-1 rounded bg-void-800 text-terminal-muted font-mono text-xs"
            >
              {{ u.name }}
            </span>
          </div>
        </div>

        <!-- Available Upgrades -->
        <h3 class="font-mono font-bold text-terminal-yellow text-sm mb-2">Available</h3>
        <div v-if="available.length === 0" class="text-terminal-muted font-mono text-xs mb-4">
          No upgrades available.
        </div>
        <div v-else class="space-y-2 mb-4">
          <button
            v-for="(u, i) in available"
            :key="u.id"
            @click="selectedIndex = i"
            :class="[
              'w-full text-left px-3 py-2 rounded font-mono text-sm transition-colors',
              selectedIndex === i
                ? 'bg-terminal-magenta/10 border border-terminal-magenta/50 text-terminal-magenta'
                : 'hover:bg-void-800 text-terminal-white border border-transparent'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold">{{ u.name }}</span>
              <span class="text-terminal-green">{{ u.cost.toLocaleString() }} cr</span>
            </div>
            <span class="text-terminal-muted text-xs">{{ u.description }}</span>
          </button>
        </div>

        <!-- Credits & Purchase -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-terminal-muted font-mono text-sm">Credits:</span>
          <span class="text-terminal-cyan font-mono font-bold">{{ ship.ship.credits.toLocaleString() }} cr</span>
        </div>

        <div v-if="message" class="mb-4 text-terminal-yellow font-mono text-sm">{{ message }}</div>

        <button
          v-if="available.length > 0"
          @click="purchase"
          :disabled="purchasing || !canAfford"
          class="w-full terminal-btn-primary disabled:opacity-50"
        >
          {{ purchasing ? 'Installing...' : canAfford ? 'Purchase Upgrade' : 'Insufficient Credits' }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useShipStore } from '../stores/ship';
import { useAuthStore } from '../stores/auth';
import { getAvailableUpgrades, getOwnedUpgrades } from '../data/upgrades';

const router = useRouter();
const ship = useShipStore();
const auth = useAuthStore();

const galaxyId = 1;
const selectedIndex = ref(0);
const message = ref<string | null>(null);
const purchasing = ref(false);

const owned = computed(() => getOwnedUpgrades(ship.ship?.upgrades ?? {}));
const available = computed(() => getAvailableUpgrades(ship.ship?.upgrades ?? {}));

const canAfford = computed(() => {
  const upgrade = available.value[selectedIndex.value];
  if (!upgrade) return false;
  return (ship.ship?.credits ?? 0) >= upgrade.cost;
});

async function purchase() {
  const upgrade = available.value[selectedIndex.value];
  if (!upgrade || !ship.ship) return;

  purchasing.value = true;
  message.value = null;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/action/upgrade`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({
        galaxyId,
        sectorId: ship.ship.currentSector,
        upgradeId: upgrade.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upgrade failed');

    // Update local ship state
    ship.ship.credits = data.remainingCredits;
    ship.ship.upgrades[upgrade.id] = 1;
    ship.applyEffectiveStats();

    message.value = `⚡ Purchased ${upgrade.name}!`;
    selectedIndex.value = 0;
  } catch (err: any) {
    message.value = err.message;
  } finally {
    purchasing.value = false;
  }
}

function goBack() {
  router.push(`/galaxy/${galaxyId}`);
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape') goBack();
  if (e.key === 'ArrowUp') selectedIndex.value = Math.max(0, selectedIndex.value - 1);
  if (e.key === 'ArrowDown') selectedIndex.value = Math.min(available.value.length - 1, selectedIndex.value + 1);
  if (e.key === 'Enter') purchase();
}

window.addEventListener('keydown', handleKey);
onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
});
</script>
