<template>
  <div class="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
    <div class="terminal-panel p-6 max-w-xl w-full">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-mono font-bold text-terminal-red">⚔ Fighter Encounter</h3>
        <button @click="$emit('close')" class="text-terminal-muted hover:text-terminal-white font-mono">✕</button>
      </div>

      <p class="font-mono text-sm text-terminal-white mb-2">
        Sector {{ encounter.targetSector }} is guarded by hostile fighters.
      </p>

      <div class="space-y-1 mb-3">
        <div
          v-for="group in encounter.fighters"
          :key="`${group.ownerId}-${group.mode}`"
          class="flex items-center justify-between font-mono text-xs px-2 py-1 rounded bg-void-900"
        >
          <span class="text-terminal-muted">{{ group.ownerName }}</span>
          <span class="text-terminal-yellow">{{ group.count.toLocaleString() }} {{ group.mode }}</span>
        </div>
      </div>

      <p v-if="encounter.tollCredits > 0" class="font-mono text-xs mb-3" :class="encounter.canPayToll ? 'text-terminal-cyan' : 'text-terminal-red'">
        Toll required: {{ encounter.tollCredits.toLocaleString() }} cr
      </p>

      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="action in encounter.options"
          :key="action"
          @click="resolve(action)"
          :disabled="submitting || (action === 'pay_toll' && !encounter.canPayToll)"
          class="terminal-btn disabled:opacity-50"
        >
          {{ labels[action] }}
        </button>
      </div>

      <p v-if="error" class="mt-3 text-terminal-red font-mono text-xs">{{ error }}</p>
      <p v-if="resultText" class="mt-3 text-terminal-green font-mono text-xs">{{ resultText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useShipStore } from '../stores/ship';

const props = defineProps<{
  galaxyId: number;
  encounter: {
    targetSector: number;
    fighters: Array<{ ownerId: number; ownerName: string; count: number; mode: string }>;
    options: Array<'attack' | 'retreat' | 'surrender' | 'pay_toll'>;
    tollCredits: number;
    canPayToll: boolean;
  };
}>();

const emit = defineEmits<{
  close: [];
  resolved: [data: any];
}>();

const ship = useShipStore();
const submitting = ref(false);
const error = ref<string | null>(null);
const resultText = ref<string | null>(null);

const labels: Record<'attack' | 'retreat' | 'surrender' | 'pay_toll', string> = {
  attack: 'Attack',
  retreat: 'Retreat',
  surrender: 'Surrender',
  pay_toll: 'Pay Toll',
};

async function resolve(action: 'attack' | 'retreat' | 'surrender' | 'pay_toll') {
  submitting.value = true;
  error.value = null;

  try {
    const data = await ship.resolveFighterEncounter(props.galaxyId, props.encounter.targetSector, action);
    resultText.value = data.narrative;
    emit('resolved', data);
  } catch (err: any) {
    error.value = err.message;
  } finally {
    submitting.value = false;
  }
}
</script>
