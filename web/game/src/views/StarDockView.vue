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

        <!-- Fighter Bay -->
        <div class="mt-4 pt-4 border-t border-void-700">
          <h3 class="font-mono font-bold text-terminal-cyan text-sm mb-2">🚀 Fighter Bay</h3>
          <div class="flex items-center justify-between mb-2">
            <span class="text-terminal-muted font-mono text-xs">Carried Fighters:</span>
            <span class="text-terminal-yellow font-mono text-sm">{{ (ship.ship?.fighters ?? 0).toLocaleString() }}</span>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <input
              v-model.number="fighterQuantity"
              type="number"
              min="1"
              class="flex-1 bg-void-900 border border-void-700 rounded px-2 py-1 text-terminal-white font-mono text-sm"
            />
            <span class="text-terminal-muted font-mono text-xs">x 100 cr</span>
          </div>
          <button
            @click="buyFighters"
            :disabled="buyingFighters || fighterQuantity <= 0 || (ship.ship?.credits ?? 0) < fighterQuantity * 100"
            class="w-full terminal-btn disabled:opacity-50"
          >
            {{ buyingFighters ? 'Purchasing...' : `Buy Fighters (${(fighterQuantity * 100).toLocaleString()} cr)` }}
          </button>
        </div>

        <!-- Mine Bay -->
        <div class="mt-4 pt-4 border-t border-void-700">
          <h3 class="font-mono font-bold text-terminal-cyan text-sm mb-2">💣 Mine Bay</h3>
          <div class="grid grid-cols-2 gap-2 mb-2 text-xs font-mono">
            <div class="text-terminal-muted">Limpets:</div>
            <div class="text-terminal-yellow text-right">{{ (ship.ship?.limpets ?? 0).toLocaleString() }}</div>
            <div class="text-terminal-muted">Armids:</div>
            <div class="text-terminal-yellow text-right">{{ (ship.ship?.armids ?? 0).toLocaleString() }}</div>
            <div class="text-terminal-muted">Attached:</div>
            <div class="text-right" :class="(ship.ship?.limpetAttached ?? 0) > 0 ? 'text-terminal-red' : 'text-terminal-muted'">
              {{ (ship.ship?.limpetAttached ?? 0).toLocaleString() }}
            </div>
          </div>

          <div class="flex items-center gap-2 mb-2">
            <input v-model.number="limpetQuantity" type="number" min="1" class="flex-1 bg-void-900 border border-void-700 rounded px-2 py-1 text-terminal-white font-mono text-sm" />
            <button
              @click="buyMines('limpet')"
              :disabled="buyingLimpets || limpetQuantity <= 0 || (ship.ship?.credits ?? 0) < limpetQuantity * 300"
              class="terminal-btn text-xs disabled:opacity-50"
            >
              {{ buyingLimpets ? '...' : `Buy Limpets (${(limpetQuantity * 300).toLocaleString()} cr)` }}
            </button>
          </div>

          <div class="flex items-center gap-2 mb-2">
            <input v-model.number="armidQuantity" type="number" min="1" class="flex-1 bg-void-900 border border-void-700 rounded px-2 py-1 text-terminal-white font-mono text-sm" />
            <button
              @click="buyMines('armid')"
              :disabled="buyingArmids || armidQuantity <= 0 || (ship.ship?.credits ?? 0) < armidQuantity * 500"
              class="terminal-btn text-xs disabled:opacity-50"
            >
              {{ buyingArmids ? '...' : `Buy Armids (${(armidQuantity * 500).toLocaleString()} cr)` }}
            </button>
          </div>

          <button
            @click="clearLimpets"
            :disabled="clearingLimpets || (ship.ship?.limpetAttached ?? 0) <= 0"
            class="w-full terminal-btn disabled:opacity-50"
          >
            {{ clearingLimpets ? 'Clearing...' : `Clear Attached Limpets (${((ship.ship?.limpetAttached ?? 0) * 5000).toLocaleString()} cr)` }}
          </button>
        </div>

        <!-- Genesis Torpedo -->
        <div class="mt-4 pt-4 border-t border-void-700">
          <h3 class="font-mono font-bold text-terminal-cyan text-sm mb-2">🌍 Genesis Torpedo</h3>
          <div class="text-xs font-mono text-terminal-muted mb-2">Create a planet in any non-protected sector. Planet class is randomized.</div>
          <div class="text-xs font-mono text-terminal-yellow mb-2">Cost: 80,000 cr</div>
          <div class="text-xs font-mono text-terminal-muted">Visit a sector and press [G] to launch.</div>
        </div>

        <!-- Guild Protection Contract -->
        <div class="mt-4 pt-4 border-t border-void-700">
          <h3 class="font-mono font-bold text-terminal-cyan text-sm mb-2">🛡 Guild Protection Contract</h3>
          <div v-if="ship.ship?.insuranceActive" class="text-terminal-green font-mono text-xs mb-2">
            ✓ Active — expires {{ formatDate(ship.ship.insuranceExpires) }}
          </div>
          <div v-else class="text-terminal-muted font-mono text-xs mb-2">
            No active Guild Protection Contract. Death penalty: 25% credits lost.
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-terminal-muted font-mono text-xs">Cost (5% net worth):</span>
            <span class="text-terminal-yellow font-mono text-sm">{{ insuranceCost.toLocaleString() }} cr</span>
          </div>
          <button
            @click="buyInsurance"
            :disabled="insuring || ship.ship?.insuranceActive || ship.ship?.credits < insuranceCost"
            class="w-full terminal-btn disabled:opacity-50"
          >
            {{ insuring ? 'Processing...' : ship.ship?.insuranceActive ? 'Already Protected' : 'Buy Contract (7 days)' }}
          </button>
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
const buyingFighters = ref(false);
const fighterQuantity = ref(10);
const buyingLimpets = ref(false);
const buyingArmids = ref(false);
const clearingLimpets = ref(false);
const limpetQuantity = ref(5);
const armidQuantity = ref(3);
const insuring = ref(false);

const insuranceCost = computed(() => {
  return Math.floor((ship.ship?.netWorth ?? ship.ship?.credits ?? 0) * 0.05);
});

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

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

async function buyFighters() {
  if (!ship.ship || fighterQuantity.value <= 0) return;
  buyingFighters.value = true;
  message.value = null;

  try {
    const data = await ship.buyFighters(galaxyId, fighterQuantity.value);
    message.value = `🚀 Purchased ${data.quantity.toLocaleString()} fighters`;
  } catch (err: any) {
    message.value = err.message;
  } finally {
    buyingFighters.value = false;
  }
}

async function buyMines(type: 'limpet' | 'armid') {
  if (!ship.ship) return;

  const quantity = type === 'limpet' ? limpetQuantity.value : armidQuantity.value;
  if (quantity <= 0) return;

  if (type === 'limpet') buyingLimpets.value = true;
  else buyingArmids.value = true;

  message.value = null;

  try {
    const data = await ship.buyMines(galaxyId, type, quantity);
    message.value = `💣 Purchased ${data.quantity.toLocaleString()} ${type} mines`;
  } catch (err: any) {
    message.value = err.message;
  } finally {
    if (type === 'limpet') buyingLimpets.value = false;
    else buyingArmids.value = false;
  }
}

async function clearLimpets() {
  if (!ship.ship || (ship.ship.limpetAttached ?? 0) <= 0) return;
  clearingLimpets.value = true;
  message.value = null;

  try {
    const data = await ship.clearLimpets(galaxyId, ship.ship.currentSector);
    message.value = `🧹 Cleared ${data.removed} attached limpets`;
  } catch (err: any) {
    message.value = err.message;
  } finally {
    clearingLimpets.value = false;
  }
}

async function buyInsurance() {
  if (!ship.ship) return;
  insuring.value = true;
  message.value = null;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/insurance/buy`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({
        galaxyId,
        sectorId: ship.ship.currentSector,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Guild Protection Contract purchase failed');

    ship.ship.credits = data.remainingCredits;
    ship.ship.insuranceActive = true;
    ship.ship.insuranceExpires = data.expires;

    message.value = `🛡 Guild Protection Contract active! Expires ${formatDate(data.expires)}`;
  } catch (err: any) {
    message.value = err.message;
  } finally {
    insuring.value = false;
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
