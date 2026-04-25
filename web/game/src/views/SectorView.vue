<template>
  <div class="min-h-screen bg-void-950 p-4">
    <!-- Loading -->
    <div v-if="galaxy.loading || ship.loading" class="flex items-center justify-center h-screen">
      <p class="text-terminal-cyan font-mono">🌌 Connecting to The Void...</p>
    </div>

    <!-- Error -->
    <div v-else-if="galaxy.error || ship.error" class="flex items-center justify-center h-screen">
      <div class="text-center">
        <p class="text-terminal-red font-mono font-bold mb-2">Connection Error</p>
        <p class="text-terminal-white font-mono text-sm">{{ galaxy.error || ship.error }}</p>
      </div>
    </div>

    <!-- Game Screen -->
    <div v-else-if="currentSector && ship.ship" class="max-w-6xl mx-auto">
      <!-- Top Bar -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="text-xl">🌌</span>
          <span class="font-mono font-bold text-terminal-cyan">TW 3002 AI</span>
        </div>
        <div class="flex items-center gap-2">
          <button @click="ui.openModal('help')" class="terminal-btn text-xs">H</button>
          <button @click="ui.openModal('nav')" class="terminal-btn text-xs">N</button>
          <button @click="ui.openModal('leaderboard')" class="terminal-btn text-xs">L</button>
          <button @click="handleQuit" class="terminal-btn text-xs text-terminal-red">Q</button>
        </div>
      </div>

      <!-- Sector Info -->
      <div class="terminal-panel p-4 mb-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-mono font-bold text-lg">
              <span class="text-terminal-cyan">SECTOR {{ currentSector.id }}</span>
              <span class="text-terminal-white"> — {{ currentSector.name.toUpperCase() }}</span>
            </h2>
            <div class="flex items-center gap-3 mt-1 text-sm font-mono">
              <span :class="dangerColor">{{ dangerIcon }}</span>
              <span v-if="currentSector.hasPort" class="text-terminal-yellow">
                Port Class {{ currentSector.portClass }} ({{ currentSector.portName }})
              </span>
              <span v-if="currentSector.stardock" class="text-terminal-magenta font-bold">⚡ StarDock</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Ship Status -->
        <div class="terminal-panel p-4">
          <h3 class="font-mono font-bold text-terminal-cyan mb-3 text-sm">{{ ship.ship.name }}</h3>
          <div class="space-y-2 text-sm font-mono">
            <div class="flex justify-between">
              <span class="text-terminal-muted">Credits</span>
              <span class="text-terminal-green">{{ ship.ship.credits.toLocaleString() }} cr</span>
            </div>
            <div class="flex justify-between">
              <span class="text-terminal-muted">Cargo</span>
              <span>{{ totalCargo }}/{{ ship.ship.maxCargo }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-terminal-muted">Hull</span>
              <span :class="hullColor">{{ ship.ship.hull }}/{{ ship.ship.maxHull }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-terminal-muted">Shield</span>
              <span>{{ ship.ship.shield }}/{{ ship.ship.maxShield }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-terminal-muted">Turns</span>
              <span :class="turnsColor">{{ ship.ship.turns }}/{{ ship.ship.maxTurns }}</span>
            </div>
          </div>
        </div>

        <!-- Warp Lanes -->
        <div class="terminal-panel p-4">
          <h3 class="font-mono font-bold text-terminal-cyan mb-3 text-sm">Warp Lanes</h3>
          <div class="space-y-1">
            <button
              v-for="n in neighborList"
              :key="n.id"
              @click="selectedNeighbor = n.id"
              :class="[
                'w-full text-left px-3 py-2 rounded font-mono text-sm transition-colors',
                selectedNeighbor === n.id
                  ? 'bg-terminal-cyan/10 border border-terminal-cyan/50 text-terminal-cyan'
                  : 'hover:bg-void-800 text-terminal-white'
              ]"
            >
              <span class="inline-block w-8">{{ n.id }}</span>
              <span class="text-terminal-muted">{{ n.name }}</span>
              <span v-if="n.hasPort" class="text-terminal-yellow ml-2">P{{ n.portClass }}</span>
              <span v-if="n.stardock" class="text-terminal-magenta ml-2">⚡</span>
            </button>
          </div>
          <button
            v-if="selectedNeighbor && ship.ship.turns > 0"
            @click="handleJump"
            :disabled="jumping"
            class="w-full mt-3 terminal-btn-primary"
          >
            {{ jumping ? 'Warping...' : `Jump to Sector ${selectedNeighbor} (1 turn)` }}
          </button>
          <p v-else-if="ship.ship.turns === 0" class="text-terminal-red text-xs font-mono mt-3 text-center">
            ⚠ OUT OF TURNS
          </p>
        </div>

        <!-- Actions -->
        <div class="terminal-panel p-4">
          <h3 class="font-mono font-bold text-terminal-cyan mb-3 text-sm">Actions</h3>
          <div class="space-y-2">
            <button
              v-if="currentSector.hasPort"
              @click="$router.push(`/galaxy/${galaxyId}/market`)"
              class="w-full terminal-btn text-left"
            >
              📦 Open Market [M]
            </button>
            <button
              v-if="currentSector.stardock"
              @click="$router.push(`/galaxy/${galaxyId}/stardock`)"
              class="w-full terminal-btn text-left"
            >
              ⚡ Enter StarDock [D]
            </button>
          </div>
        </div>
      </div>

      <!-- Message -->
      <div v-if="ship.message" class="mt-4 terminal-panel p-3 border-terminal-yellow/50">
        <p class="text-terminal-yellow font-mono text-sm">{{ ship.message }}</p>
        <button @click="ship.clearMessage()" class="text-terminal-muted text-xs font-mono mt-1 hover:text-terminal-white">Dismiss</button>
      </div>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <div v-if="ui.activeModal" class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div class="terminal-panel p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-mono font-bold text-terminal-cyan">
              {{ ui.activeModal === 'help' ? 'HELP' : ui.activeModal === 'nav' ? 'NAVIGATION LOG' : 'LEADERBOARD' }}
            </h3>
            <button @click="ui.closeModal()" class="text-terminal-muted hover:text-terminal-white font-mono">✕</button>
          </div>
          <!-- Help Content -->
          <div v-if="ui.activeModal === 'help'" class="space-y-3 text-sm font-mono">
            <div class="grid grid-cols-2 gap-2">
              <div><span class="text-terminal-cyan">↑↓</span> <span class="text-terminal-muted">Select warp</span></div>
              <div><span class="text-terminal-cyan">Enter</span> <span class="text-terminal-muted">Jump</span></div>
              <div><span class="text-terminal-cyan">M</span> <span class="text-terminal-muted">Market</span></div>
              <div><span class="text-terminal-cyan">D</span> <span class="text-terminal-muted">StarDock</span></div>
              <div><span class="text-terminal-cyan">N</span> <span class="text-terminal-muted">Navigation</span></div>
              <div><span class="text-terminal-cyan">L</span> <span class="text-terminal-muted">Leaderboard</span></div>
              <div><span class="text-terminal-cyan">H</span> <span class="text-terminal-muted">Help</span></div>
              <div><span class="text-terminal-cyan">Esc</span> <span class="text-terminal-muted">Back</span></div>
            </div>
          </div>
          <!-- Nav Content -->
          <div v-else-if="ui.activeModal === 'nav'" class="text-sm font-mono">
            <p class="text-terminal-muted mb-2">Visited {{ galaxy.visitedIds.length }} sectors</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(id, i) in galaxy.visitedIds.slice(-20)"
                :key="i"
                :class="[
                  'px-2 py-1 rounded text-xs',
                  id === -1 ? 'bg-terminal-red/20 text-terminal-red' : 'bg-void-800 text-terminal-white'
                ]"
              >
                {{ id === -1 ? '💥' : id }}
              </span>
            </div>
          </div>
          <!-- Leaderboard Content -->
          <div v-else-if="ui.activeModal === 'leaderboard'">
            <p class="text-terminal-muted font-mono text-sm">Coming soon — leaderboard data will appear here.</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGalaxyStore } from '../stores/galaxy';
import { useShipStore } from '../stores/ship';
import { useUiStore } from '../stores/ui';

const router = useRouter();
const galaxy = useGalaxyStore();
const ship = useShipStore();
const ui = useUiStore();

const galaxyId = 1;
const selectedNeighbor = ref<number | null>(null);
const jumping = ref(false);

const currentSector = computed(() => galaxy.currentSector());
const neighborList = computed(() => galaxy.neighbors());

const totalCargo = computed(() => {
  if (!ship.ship) return 0;
  return Object.values(ship.ship.cargo).reduce((a, b) => a + b, 0);
});

const dangerColor = computed(() => {
  const d = currentSector.value?.danger;
  if (d === 'safe') return 'text-terminal-green';
  if (d === 'caution') return 'text-terminal-yellow';
  return 'text-terminal-red';
});

const dangerIcon = computed(() => {
  const d = currentSector.value?.danger;
  if (d === 'safe') return '● Safe';
  if (d === 'caution') return '◐ Caution';
  return '◉ DANGER';
});

const hullColor = computed(() => {
  if (!ship.ship) return '';
  const ratio = ship.ship.hull / ship.ship.maxHull;
  if (ratio > 0.5) return 'text-terminal-green';
  if (ratio > 0.25) return 'text-terminal-yellow';
  return 'text-terminal-red';
});

const turnsColor = computed(() => {
  if (!ship.ship) return '';
  if (ship.ship.turns === 0) return 'text-terminal-red';
  if (ship.ship.turns <= 20) return 'text-terminal-yellow';
  return 'text-terminal-white';
});

async function handleJump() {
  if (!selectedNeighbor.value || !ship.ship) return;
  jumping.value = true;
  const success = await ship.moveShip(galaxyId, selectedNeighbor.value);
  if (success) {
    galaxy.visit(selectedNeighbor.value);
    await galaxy.loadSector(galaxyId, selectedNeighbor.value);
    selectedNeighbor.value = null;
  }
  jumping.value = false;
}

function handleQuit() {
  if (confirm('Quit the game?')) {
    router.push('/');
  }
}

// Keyboard shortcuts
function handleKey(e: KeyboardEvent) {
  if (ui.activeModal) {
    if (e.key === 'Escape') ui.closeModal();
    return;
  }
  if (e.key === 'm' || e.key === 'M') {
    if (currentSector.value?.hasPort) {
      router.push(`/galaxy/${galaxyId}/market`);
    }
  }
  if (e.key === 'd' || e.key === 'D') {
    if (currentSector.value?.stardock) {
      router.push(`/galaxy/${galaxyId}/stardock`);
    }
  }
  if (e.key === 'n' || e.key === 'N') ui.openModal('nav');
  if (e.key === 'h' || e.key === 'H' || e.key === '?') ui.openModal('help');
  if (e.key === 'l' || e.key === 'L') ui.openModal('leaderboard');
}

onMounted(async () => {
  await galaxy.loadGalaxy(galaxyId);
  await ship.loadShip(galaxyId);
  if (ship.ship) {
    galaxy.currentSectorId = ship.ship.currentSector;
    galaxy.visit(ship.ship.currentSector);
    await galaxy.loadSector(galaxyId, ship.ship.currentSector);
  }
  window.addEventListener('keydown', handleKey);
});
</script>
