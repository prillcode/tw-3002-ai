<template>
  <div class="min-h-screen bg-void-950 p-4 flex items-center justify-center">
    <div class="terminal-panel p-6 max-w-lg w-full">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-mono font-bold text-terminal-yellow text-lg">
          {{ tradeMode === 'buy' ? 'BUY' : 'SELL' }} — {{ currentSector?.name }}
        </h2>
        <button @click="goBack" class="terminal-btn text-xs">Esc</button>
      </div>

      <div v-if="loading" class="text-terminal-cyan font-mono text-sm">Loading market data...</div>
      <div v-else-if="error" class="text-terminal-red font-mono text-sm">{{ error }}</div>
      <div v-else-if="!inventory" class="text-terminal-muted font-mono text-sm">No port in this sector.</div>

      <template v-else>
        <!-- Commodity List -->
        <div class="space-y-2 mb-4">
          <button
            v-for="c in displayedCommodities"
            :key="c.id"
            @click="selectedCommodity = c.id"
            :class="[
              'w-full text-left px-3 py-2 rounded font-mono text-sm transition-colors flex items-center justify-between',
              selectedCommodity === c.id
                ? c.id === 'melange' ? 'bg-amber-900/20 border border-amber-500/50 text-amber-400' : 'bg-terminal-cyan/10 border border-terminal-cyan/50 text-terminal-cyan'
                : 'hover:bg-void-800 text-terminal-white'
            ]"
          >
            <span>{{ c.icon }} {{ c.label }}</span>
            <span class="text-terminal-muted text-xs">
              {{ inventory?.[c.id]?.price?.toLocaleString() ?? 0 }} cr · Sup:{{ inventory?.[c.id]?.supply ?? 0 }} · Own:{{ (ship.ship?.cargo as any)?.[c.id] ?? 0 }}
            </span>
          </button>
        </div>

        <!-- Mode Toggle -->
        <div class="flex gap-2 mb-4">
          <button
            @click="tradeMode = 'buy'"
            :class="['flex-1 py-2 rounded font-mono text-sm font-bold transition-colors',
              tradeMode === 'buy' ? 'bg-terminal-cyan/20 text-terminal-cyan border border-terminal-cyan/50' : 'bg-void-800 text-terminal-muted border border-void-600']"
          >BUY</button>
          <button
            @click="tradeMode = 'sell'"
            :class="['flex-1 py-2 rounded font-mono text-sm font-bold transition-colors',
              tradeMode === 'sell' ? 'bg-terminal-magenta/20 text-terminal-magenta border border-terminal-magenta/50' : 'bg-void-800 text-terminal-muted border border-void-600']"
          >SELL</button>
        </div>

        <!-- Quantity -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-terminal-muted font-mono text-sm">Quantity:</span>
          <div class="flex items-center gap-2">
            <button @click="quantity = Math.max(1, quantity - 1)" class="terminal-btn px-3 py-1">−</button>
            <span class="text-terminal-yellow font-mono font-bold w-12 text-center">{{ quantity }}</span>
            <button @click="quantity++" class="terminal-btn px-3 py-1">+</button>
          </div>
        </div>

        <!-- Summary -->
        <div class="terminal-panel bg-void-900 p-3 mb-4">
          <div class="flex justify-between text-sm font-mono">
            <span class="text-terminal-muted">{{ tradeMode === 'buy' ? 'Cost' : 'Revenue' }}:</span>
            <span :class="tradeMode === 'buy' ? 'text-terminal-red' : 'text-terminal-green'">{{ totalPrice.toLocaleString() }} cr</span>
          </div>
          <div class="flex justify-between text-sm font-mono mt-1">
            <span class="text-terminal-muted">Credits:</span>
            <span class="text-terminal-cyan">{{ (ship.ship?.credits ?? 0).toLocaleString() }} cr</span>
          </div>
          <div class="flex justify-between text-sm font-mono mt-1">
            <span class="text-terminal-muted">Cargo:</span>
            <span>{{ totalCargo }}/{{ ship.ship?.maxCargo ?? 0 }}</span>
          </div>
        </div>

        <!-- Message -->
        <div v-if="message" class="mb-4 text-terminal-yellow font-mono text-sm">{{ message }}</div>

        <!-- Confirm -->
        <button
          @click="executeTrade"
          :disabled="trading"
          class="w-full terminal-btn-primary disabled:opacity-50"
        >
          {{ trading ? 'Processing...' : `${tradeMode === 'buy' ? 'Buy' : 'Sell'} ${quantity} ${selectedCommodity}` }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGalaxyStore } from '../stores/galaxy';
import { useShipStore } from '../stores/ship';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const galaxy = useGalaxyStore();
const ship = useShipStore();
const auth = useAuthStore();

const galaxyId = 1;
const loading = ref(false);
const error = ref<string | null>(null);
const message = ref<string | null>(null);
const trading = ref(false);

const inventory = ref<Record<string, { price: number; supply: number }> | null>(null);
const selectedCommodity = ref('ore');
const tradeMode = ref<'buy' | 'sell'>('buy');
const quantity = ref(1);

const baseCommodities = [
  { id: 'ore', label: 'Ore', icon: '⛏' },
  { id: 'organics', label: 'Organics', icon: '🌱' },
  { id: 'equipment', label: 'Equipment', icon: '⚙' },
];

const displayedCommodities = computed(() => {
  const list = [...baseCommodities];
  if (inventory.value && inventory.value.melange) {
    list.push({ id: 'melange', label: 'Melange', icon: '⚡' });
  }
  return list;
});
const currentSector = computed(() => galaxy.currentSector());

const totalCargo = computed(() => {
  if (!ship.ship) return 0;
  return Object.values(ship.ship.cargo).reduce((a, b) => a + b, 0);
});

const totalPrice = computed(() => {
  const price = inventory.value?.[selectedCommodity.value]?.price ?? 0;
  return price * quantity.value;
});

async function loadInventory() {
  if (!currentSector.value) return;
  loading.value = true;
  error.value = null;
  try {
    const data = await galaxy.loadSector(galaxyId, currentSector.value.id);
    if (data?.sector?.port_inventory_json) {
      const inv = JSON.parse(data.sector.port_inventory_json);
      if (Object.keys(inv).length > 0) {
        inventory.value = inv;
        if (!inv[selectedCommodity.value]) {
          selectedCommodity.value = Object.keys(inv)[0] || 'ore';
        }
      } else {
        inventory.value = null;
      }
    } else {
      inventory.value = null;
    }
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function executeTrade() {
  if (!ship.ship || !currentSector.value || !inventory.value) return;
  const inv = inventory.value[selectedCommodity.value];
  if (!inv) return;

  // Client-side validation
  if (tradeMode.value === 'buy') {
    if (totalPrice.value > ship.ship.credits) {
      message.value = 'Not enough credits';
      return;
    }
    if (inv.supply < quantity.value) {
      message.value = `Port only has ${inv.supply} units`;
      return;
    }
    if (totalCargo.value + quantity.value > ship.ship.maxCargo) {
      message.value = `Not enough cargo space (${ship.ship.maxCargo - totalCargo.value} free)`;
      return;
    }
  } else {
    const owned = (ship.ship.cargo as any)[selectedCommodity.value] ?? 0;
    if (owned < quantity.value) {
      message.value = `You only have ${owned} units`;
      return;
    }
  }

  trading.value = true;
  message.value = null;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/action/trade`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({
        galaxyId,
        sectorId: currentSector.value.id,
        commodity: selectedCommodity.value,
        quantity: quantity.value,
        action: tradeMode.value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Trade failed');

    // Update local ship state
    if (ship.ship) {
      ship.ship.credits = data.remainingCredits;
      const key = selectedCommodity.value as keyof typeof ship.ship.cargo;
      if (tradeMode.value === 'buy') {
        (ship.ship.cargo as any)[key] = ((ship.ship.cargo as any)[key] ?? 0) + quantity.value;
      } else {
        (ship.ship.cargo as any)[key] = ((ship.ship.cargo as any)[key] ?? 0) - quantity.value;
      }
    }

    message.value = `${tradeMode.value === 'buy' ? 'Bought' : 'Sold'} ${quantity.value} ${selectedCommodity.value} for ${tradeMode.value === 'buy' ? data.cost : data.revenue} cr`;
    quantity.value = 1;
    await loadInventory();
  } catch (err: any) {
    message.value = err.message;
  } finally {
    trading.value = false;
  }
}

function goBack() {
  router.push(`/galaxy/${galaxyId}`);
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape') goBack();
  if (e.key === 'b' || e.key === 'B') tradeMode.value = 'buy';
  if (e.key === 's' || e.key === 'S') tradeMode.value = 'sell';
  if (e.key === 'ArrowUp') {
    const ids = displayedCommodities.value.map(c => c.id);
    const idx = ids.indexOf(selectedCommodity.value);
    selectedCommodity.value = ids[Math.max(0, idx - 1)] || ids[0] || 'ore';
  }
  if (e.key === 'ArrowDown') {
    const ids = displayedCommodities.value.map(c => c.id);
    const idx = ids.indexOf(selectedCommodity.value);
    selectedCommodity.value = ids[Math.min(ids.length - 1, idx + 1)] || ids[ids.length - 1] || 'ore';
  }
  if (e.key === '+' || e.key === '=') quantity.value++;
  if (e.key === '-') quantity.value = Math.max(1, quantity.value - 1);
  if (e.key === 'Enter') executeTrade();
}

onMounted(() => {
  loadInventory();
  window.addEventListener('keydown', handleKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
});
</script>
