<template>
  <div class="min-h-screen bg-void-950 p-4 flex items-center justify-center">
    <div class="terminal-panel p-6 max-w-lg w-full">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-mono font-bold text-terminal-cyan text-lg">🧭 NAVIGATION LOG</h2>
        <button @click="goBack" class="terminal-btn text-xs">Esc</button>
      </div>

      <div v-if="!galaxy.galaxy" class="text-terminal-muted font-mono text-sm">No galaxy data.</div>

      <template v-else>
        <div class="text-terminal-muted font-mono text-xs mb-3">
          {{ galaxy.visitedIds.length }} sectors visited · Current: {{ currentSectorName }}
        </div>

        <div class="max-h-[60vh] overflow-y-auto space-y-1">
          <div
            v-for="(id, i) in reversedVisited"
            :key="`${id}-${i}`"
            :class="[
              'flex items-center gap-3 px-3 py-2 rounded font-mono text-sm',
              id === galaxy.currentSectorId ? 'bg-terminal-cyan/10 border border-terminal-cyan/30' : 'hover:bg-void-800'
            ]"
          >
            <span class="text-terminal-muted w-6 text-right">{{ galaxy.visitedIds.length - i }}</span>
            <span
              class="w-3 h-3 rounded-full shrink-0"
              :class="dangerColor(id)"
            />
            <span class="text-terminal-white">{{ sectorName(id) }}</span>
            <span class="text-terminal-muted text-xs ml-auto">Sector {{ id }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGalaxyStore } from '../stores/galaxy';

const router = useRouter();
const galaxy = useGalaxyStore();

const galaxyId = 1;

const reversedVisited = computed(() => [...galaxy.visitedIds].reverse());

const currentSectorName = computed(() => {
  const s = galaxy.galaxy?.sectors.get(galaxy.currentSectorId);
  return s ? `${s.name} (${galaxy.currentSectorId})` : `Sector ${galaxy.currentSectorId}`;
});

function sectorName(id: number) {
  const s = galaxy.galaxy?.sectors.get(id);
  return s ? s.name : `Sector ${id}`;
}

function dangerColor(id: number) {
  const s = galaxy.galaxy?.sectors.get(id);
  if (!s) return 'bg-terminal-muted';
  if (s.danger === 'safe') return 'bg-terminal-green';
  if (s.danger === 'caution') return 'bg-terminal-yellow';
  return 'bg-terminal-red';
}

function goBack() {
  router.push(`/galaxy/${galaxyId}`);
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape') goBack();
}

import { onUnmounted } from 'vue';

window.addEventListener('keydown', handleKey);

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
});
</script>
