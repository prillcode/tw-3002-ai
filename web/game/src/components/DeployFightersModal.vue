<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
    <div class="terminal-panel p-6 max-w-md w-full">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-mono font-bold text-terminal-cyan">🚀 Deploy Fighters</h3>
        <button @click="$emit('close')" class="text-terminal-muted hover:text-terminal-white font-mono">✕</button>
      </div>

      <p class="text-terminal-muted font-mono text-xs mb-3">
        Carried fighters: <span class="text-terminal-yellow">{{ carried.toLocaleString() }}</span>
      </p>

      <div class="mb-3">
        <label class="block text-terminal-muted font-mono text-xs mb-1">Quantity</label>
        <input
          v-model.number="quantity"
          type="number"
          min="1"
          :max="carried"
          class="w-full bg-void-900 border border-void-700 rounded px-3 py-2 text-terminal-white font-mono text-sm"
        />
      </div>

      <div class="mb-4">
        <label class="block text-terminal-muted font-mono text-xs mb-1">Mode</label>
        <div class="space-y-2">
          <button
            v-for="m in modes"
            :key="m.id"
            @click="mode = m.id"
            :class="[
              'w-full text-left px-3 py-2 rounded border font-mono text-sm',
              mode === m.id
                ? 'border-terminal-cyan text-terminal-cyan bg-terminal-cyan/10'
                : 'border-void-700 text-terminal-white hover:bg-void-800'
            ]"
          >
            <div class="font-bold">{{ m.label }}</div>
            <div class="text-terminal-muted text-xs">{{ m.help }}</div>
          </button>
        </div>
      </div>

      <div class="flex gap-2">
        <button @click="$emit('close')" class="flex-1 terminal-btn">Cancel</button>
        <button @click="submit" :disabled="submitting || !canSubmit" class="flex-1 terminal-btn-primary disabled:opacity-50">
          {{ submitting ? 'Deploying...' : 'Deploy' }}
        </button>
      </div>

      <p v-if="error" class="mt-3 text-terminal-red font-mono text-xs">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useShipStore } from '../stores/ship';

const props = defineProps<{
  galaxyId: number;
  sectorId: number;
}>();

const emit = defineEmits<{
  close: [];
  deployed: [];
}>();

const ship = useShipStore();

const carried = computed(() => ship.ship?.fighters ?? 0);
const quantity = ref(1);
const mode = ref<'defensive' | 'offensive' | 'tolled'>('defensive');
const submitting = ref(false);
const error = ref<string | null>(null);

const modes = [
  { id: 'defensive', label: 'Defensive', help: 'Challenge intruders at 1:1 odds' },
  { id: 'offensive', label: 'Offensive', help: 'Auto-attack intruders at 2:1 odds' },
  { id: 'tolled', label: 'Tolled', help: 'Charge toll or force combat' },
] as const;

const canSubmit = computed(() => quantity.value > 0 && quantity.value <= carried.value);

async function submit() {
  if (!canSubmit.value) return;
  submitting.value = true;
  error.value = null;

  try {
    await ship.deployFighters(props.galaxyId, props.sectorId, quantity.value, mode.value);
    emit('deployed');
    emit('close');
  } catch (err: any) {
    error.value = err.message;
  } finally {
    submitting.value = false;
  }
}
</script>
