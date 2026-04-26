<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="close">
    <div class="terminal-panel p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-mono font-bold text-terminal-cyan text-lg">
          🌍 {{ planet.className }} Planet
        </h2>
        <button @click="close" class="terminal-btn text-xs">Esc</button>
      </div>

      <!-- Planet Info -->
      <div class="space-y-3 mb-6">
        <div class="text-terminal-muted font-mono text-xs">{{ planet.description }}</div>

        <div class="grid grid-cols-2 gap-2 text-sm font-mono">
          <div>Class: <span class="text-terminal-cyan">{{ planet.class }}</span></div>
          <div>Citadel: <span class="text-terminal-magenta">Level {{ planet.citadelLevel }}</span></div>
          <div>Colonists: <span class="text-terminal-yellow">{{ planet.colonists?.toLocaleString() }}</span> / {{ planet.maxColonists?.toLocaleString() }}</div>
          <div>Owner: <span :class="planet.isOwn ? 'text-terminal-green' : 'text-terminal-muted'">{{ planet.isOwn ? 'You' : planet.ownerName }}</span></div>
        </div>

        <!-- Resources -->
        <div class="terminal-panel p-3 mt-3">
          <div class="text-xs font-mono text-terminal-muted mb-2">STORED RESOURCES</div>
          <div class="grid grid-cols-2 gap-1 text-sm font-mono">
            <div>⛽ Fuel: <span class="text-terminal-yellow">{{ planet.fuel?.toLocaleString() }}</span></div>
            <div>🌱 Organics: <span class="text-terminal-green">{{ planet.organics?.toLocaleString() }}</span></div>
            <div>⚙ Equipment: <span class="text-terminal-magenta">{{ planet.equipment?.toLocaleString() }}</span></div>
            <div>✈ Fighters: <span class="text-terminal-red">{{ planet.fighters?.toLocaleString() }}</span></div>
          </div>
        </div>

        <!-- Daily Production -->
        <div v-if="planet.dailyProduction" class="terminal-panel p-3">
          <div class="text-xs font-mono text-terminal-muted mb-2">DAILY PRODUCTION</div>
          <div class="grid grid-cols-2 gap-1 text-sm font-mono">
            <div>⛽ Fuel: <span class="text-terminal-yellow">+{{ planet.dailyProduction.fuel?.toLocaleString() }}</span></div>
            <div>🌱 Org: <span class="text-terminal-green">+{{ planet.dailyProduction.organics?.toLocaleString() }}</span></div>
            <div>⚙ Eq: <span class="text-terminal-magenta">+{{ planet.dailyProduction.equipment?.toLocaleString() }}</span></div>
            <div>✈ Fig: <span class="text-terminal-red">+{{ planet.dailyProduction.fighters?.toLocaleString() }}</span></div>
          </div>
        </div>
      </div>

      <!-- Colonize (own planets only) -->
      <div v-if="planet.isOwn" class="border-t border-terminal-cyan/20 pt-4">
        <h3 class="font-mono text-sm text-terminal-cyan mb-3">COLONIZE</h3>
        <div class="flex gap-2 items-center mb-2">
          <input
            v-model.number="colonistQty"
            type="number"
            min="1"
            :max="colonistSpace"
            class="bg-void-900 border border-terminal-cyan/30 text-terminal-white font-mono text-sm p-2 rounded w-32"
            placeholder="Quantity"
          />
          <button @click="colonize" :disabled="colonizing" class="terminal-btn text-sm">
            {{ colonizing ? 'Transporting...' : 'Transport Colonists' }}
          </button>
        </div>
        <div class="text-xs font-mono text-terminal-muted">
          Cost: {{ colonistCreditCost.toLocaleString() }} cr + {{ colonistFuelCost }} fuel
        </div>
        <div v-if="colonizeError" class="text-xs font-mono text-terminal-red mt-1">{{ colonizeError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useShipStore } from '../stores/ship';
import { useAuthStore } from '../stores/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.playtradewars.net';

const props = defineProps<{
  planet: any;
  galaxyId: number;
}>();

const emit = defineEmits<{ (e: 'close'): void; (e: 'refresh'): void }>();

const ship = useShipStore();
const auth = useAuthStore();

const colonistQty = ref(100);
const colonizing = ref(false);
const colonizeError = ref<string | null>(null);

const colonistSpace = computed(() => {
  return Math.max(0, (props.planet.maxColonists || 0) - (props.planet.colonists || 0));
});

const colonistCreditCost = computed(() => colonistQty.value * 5);

const colonistFuelCost = computed(() => {
  const distance = Math.abs((ship.ship?.currentSector || 0) - (props.planet.sectorIndex || 0));
  return distance * 10 * Math.ceil(colonistQty.value / 100);
});

async function colonize() {
  if (colonistQty.value <= 0) return;
  colonizing.value = true;
  colonizeError.value = null;

  try {
    const res = await fetch(`${API_BASE}/api/planets/colonize`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({
        galaxyId: props.galaxyId,
        planetId: props.planet.id,
        quantity: colonistQty.value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Colonization failed');

    // Update local state
    props.planet.colonists = data.totalColonists;
    if (ship.ship) {
      ship.ship.credits -= data.creditsConsumed;
    }

    emit('refresh');
  } catch (err: any) {
    colonizeError.value = err.message;
  } finally {
    colonizing.value = false;
  }
}

function close() {
  emit('close');
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

import { onUnmounted } from 'vue';
window.addEventListener('keydown', handleKey);
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>
