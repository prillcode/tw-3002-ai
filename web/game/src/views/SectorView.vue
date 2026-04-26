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
          <button @click="$router.push(`/galaxy/${galaxyId}/nav`)" class="terminal-btn text-xs">N</button>
          <button @click="$router.push(`/galaxy/${galaxyId}/leaderboard`)" class="terminal-btn text-xs">L</button>
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
            <div class="flex items-center gap-3 mt-1 text-sm font-mono flex-wrap">
              <span :class="dangerColor">{{ dangerIcon }}</span>
              <span v-if="currentSector.hasPort" class="text-terminal-yellow">
                Port Class {{ currentSector.portClass }} ({{ currentSector.portName }})
              </span>
              <span v-if="currentSector.stardock" class="text-terminal-magenta font-bold">⚡ StarDock</span>
              <span v-if="hostileFighterCount > 0" class="text-terminal-red">⚔ {{ hostileFighterCount.toLocaleString() }} hostile fighters</span>
              <span v-if="hostileMineEstimate > 0" class="text-terminal-red">💣 ~{{ hostileMineEstimate.toLocaleString() }} hostile mines</span>
              <span v-if="currentSector.blockadeLevel && currentSector.blockadeLevel !== 'none'" class="text-terminal-yellow">⚠ {{ String(currentSector.blockadeLevel).toUpperCase() }} BLOCKADE</span>
              <span v-if="ownDeployedFighters > 0" class="text-terminal-green">🛡 Your fighters: {{ ownDeployedFighters.toLocaleString() }} ({{ ownFighterMode }})</span>
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
            <div class="flex justify-between">
              <span class="text-terminal-muted">Fighters</span>
              <span class="text-terminal-yellow">{{ (ship.ship.fighters ?? 0).toLocaleString() }} / {{ ownDeployedFighters.toLocaleString() }} deployed</span>
            </div>
            <div class="flex justify-between">
              <span class="text-terminal-muted">Mines</span>
              <span class="text-terminal-yellow">L {{ ship.ship.limpets }} / A {{ ship.ship.armids }}</span>
            </div>
            <div v-if="ship.ship.limpetAttached > 0" class="flex justify-between">
              <span class="text-terminal-muted">Limpets Attached</span>
              <span class="text-terminal-red">{{ ship.ship.limpetAttached }}</span>
            </div>
            <div v-if="ship.stats.kills > 0 || ship.stats.deaths > 0" class="flex justify-between">
              <span class="text-terminal-muted">K/D</span>
              <span class="text-terminal-yellow">{{ ship.stats.kills }}/{{ ship.stats.deaths }}</span>
            </div>
            <div v-if="ship.stats.wanted" class="flex justify-between">
              <span class="text-terminal-muted">Status</span>
              <span class="text-terminal-red font-bold">☠ WANTED ({{ ship.stats.wantedKillCount }})</span>
            </div>
            <div v-if="ship.stats.insuranceActive" class="flex justify-between">
              <span class="text-terminal-muted">Insurance</span>
              <span class="text-terminal-green">✓ Active</span>
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
                'w-full text-left px-3 py-2 rounded font-mono text-sm transition-colors flex items-center gap-2',
                selectedNeighbor === n.id
                  ? 'bg-terminal-cyan/10 border border-terminal-cyan/50 text-terminal-cyan'
                  : 'hover:bg-void-800 text-terminal-white'
              ]"
            >
              <span :class="neighborDangerColor(n.danger)">{{ neighborDangerIcon(n.danger) }}</span>
              <span class="inline-block w-8">{{ n.id }}</span>
              <span class="text-terminal-muted">{{ n.name }}</span>
              <span v-if="n.hasPort" class="text-terminal-yellow ml-auto">P{{ n.portClass }}</span>
              <span v-if="n.stardock" class="text-terminal-magenta ml-auto">⚡</span>
              <span v-if="n.blockadeLevel && n.blockadeLevel !== 'none'" class="text-terminal-red ml-auto">⚠</span>
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
            <button
              @click="$router.push(`/galaxy/${galaxyId}/nav`)"
              class="w-full terminal-btn text-left"
            >
              🧭 Show Navigation [N]
            </button>
            <button
              @click="$router.push(`/galaxy/${galaxyId}/leaderboard`)"
              class="w-full terminal-btn text-left"
            >
              🏆 Leaderboard [L]
            </button>
            <button
              @click="showDeployModal = true"
              :disabled="(ship.ship.fighters ?? 0) <= 0 || currentSector.danger === 'safe'"
              class="w-full terminal-btn text-left disabled:opacity-50"
            >
              🚀 Deploy Fighters [F]
            </button>
            <button
              v-if="ownDeployedFighters > 0"
              @click="handleRecallAll"
              :disabled="recalling"
              class="w-full terminal-btn text-left"
            >
              ↩ Recall Fighters [R]
            </button>
            <button
              @click="handleDeployMine('limpet')"
              :disabled="ship.ship.limpets <= 0 || currentSector.danger === 'safe'"
              class="w-full terminal-btn text-left disabled:opacity-50"
            >
              🧲 Deploy Limpets [1]
            </button>
            <button
              @click="handleDeployMine('armid')"
              :disabled="ship.ship.armids <= 0 || currentSector.danger === 'safe'"
              class="w-full terminal-btn text-left disabled:opacity-50"
            >
              💥 Deploy Armids [2]
            </button>
            <button
              v-if="!currentSector.stardock && currentSector.danger !== 'safe' && (ship.ship?.credits ?? 0) >= 80000 && (sectorPlanets.length ?? 0) < 5"
              @click="handleCreatePlanet"
              :disabled="creatingPlanet"
              class="w-full terminal-btn text-left"
            >
              🌍 Launch Genesis Torpedo [G]
            </button>
          </div>

          <!-- Planets in sector -->
          <div v-if="sectorPlanets.length > 0" class="mt-4 border-t border-terminal-cyan/20 pt-3">
            <h3 class="font-mono font-bold text-terminal-cyan mb-2 text-xs">🌍 PLANETS ({{ sectorPlanets.length }})</h3>
            <div class="space-y-1">
              <button
                v-for="p in sectorPlanets"
                :key="p.id"
                @click="selectedPlanet = p"
                class="w-full text-left px-2 py-1 rounded hover:bg-void-800 font-mono text-xs"
              >
                <span :class="p.isOwn ? 'text-terminal-green' : 'text-terminal-muted'">{{ p.className }}</span>
                <span class="text-terminal-muted ml-2">{{ p.colonists?.toLocaleString() }} col</span>
                <span v-if="p.citadelLevel > 0" class="text-terminal-magenta ml-2">L{{ p.citadelLevel }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sector Map -->
      <div class="terminal-panel p-4 mt-4">
        <h3 class="font-mono font-bold text-terminal-cyan mb-3 text-sm">Sector Map</h3>
        <div class="flex items-center justify-center py-4">
          <div class="relative" style="width: 320px; height: 200px;">
            <!-- Center: current sector -->
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div class="w-12 h-12 rounded-full bg-terminal-cyan/20 border-2 border-terminal-cyan flex items-center justify-center">
                <span class="text-terminal-cyan font-mono font-bold text-sm">★</span>
              </div>
              <span class="text-terminal-cyan font-mono text-xs mt-1 block">{{ currentSector.id }}</span>
            </div>
            <!-- Neighbors positioned around center -->
            <div
              v-for="(n, i) in neighborList.slice(0, 6)"
              :key="n.id"
              class="absolute text-center cursor-pointer hover:opacity-80 transition-opacity"
              :style="getNeighborPosition(i, Math.min(neighborList.length, 6))"
              @click="selectedNeighbor = n.id"
            >
              <div
                :class="[
                  'w-10 h-10 rounded-full border-2 flex items-center justify-center',
                  selectedNeighbor === n.id
                    ? 'bg-terminal-green/20 border-terminal-green'
                    : n.stardock
                    ? 'bg-terminal-magenta/10 border-terminal-magenta/50'
                    : n.hasPort
                    ? 'bg-terminal-yellow/10 border-terminal-yellow/50'
                    : 'bg-void-700 border-void-600'
                ]"
              >
                <span :class="[
                  'font-mono font-bold text-xs',
                  selectedNeighbor === n.id ? 'text-terminal-green' : 'text-terminal-white'
                ]">{{ n.id }}</span>
              </div>
              <span class="text-terminal-muted font-mono text-[10px] mt-0.5 block truncate max-w-[60px]">{{ n.name }}</span>
            </div>
            <!-- Connection lines (simple SVG overlay) -->
            <svg class="absolute inset-0 pointer-events-none" width="320" height="200">
              <line
                v-for="(n, i) in neighborList.slice(0, 6)"
                :key="`line-${n.id}`"
                x1="160" y1="100"
                :x2="getLineEnd(i, Math.min(neighborList.length, 6)).x"
                :y2="getLineEnd(i, Math.min(neighborList.length, 6)).y"
                stroke="#252a3d"
                stroke-width="1"
                stroke-dasharray="4 2"
              />
            </svg>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 justify-center text-xs font-mono text-terminal-muted">
          <span><span class="text-terminal-cyan">★</span> You</span>
          <span><span class="text-terminal-yellow">●</span> Port</span>
          <span><span class="text-terminal-magenta">●</span> StarDock</span>
          <span><span class="text-terminal-green">●</span> Selected</span>
        </div>
      </div>

      <!-- NPCs -->
      <div v-if="npcs.length > 0" class="mt-4 terminal-panel p-4">
        <h3 class="font-mono font-bold text-terminal-cyan mb-2 text-sm">Ships in Sector</h3>
        <div class="space-y-1">
          <div
            v-for="npc in npcs.slice(0, 3)"
            :key="npc.npc_id"
            class="flex items-center justify-between px-3 py-2 rounded hover:bg-void-800 transition-colors"
          >
            <div class="flex items-center gap-2">
              <span class="text-lg">
                {{ npc.persona.type === 'raider' ? '⚠️' : npc.persona.type === 'patrol' ? '🛡️' : '📦' }}
              </span>
              <span class="font-mono text-sm" :class="{
                'text-terminal-red': npc.persona.type === 'raider',
                'text-terminal-green': npc.persona.type === 'patrol',
                'text-terminal-cyan': npc.persona.type === 'trader'
              }">{{ npc.persona.name }}</span>
              <span class="text-terminal-muted font-mono text-xs">{{ npc.persona.type }}</span>
            </div>
            <button
              v-if="npc.persona.type === 'raider'"
              @click="initiateCombat(npc)"
              class="terminal-btn text-xs text-terminal-red"
            >
              ⚔ Attack
            </button>
          </div>
          <p v-if="npcs.length > 3" class="text-terminal-muted font-mono text-xs px-3">
            … and {{ npcs.length - 3 }} more
          </p>
        </div>
      </div>

      <!-- News -->
      <div v-if="news.length > 0" class="mt-4 terminal-panel p-4">
        <h3 class="font-mono font-bold text-terminal-cyan mb-2 text-sm">📰 Galaxy News</h3>
        <div class="space-y-1">
          <p
            v-for="(item, i) in news.slice(-2)"
            :key="i"
            class="text-terminal-muted font-mono text-xs"
          >
            • {{ item.headline }}
          </p>
        </div>
      </div>

      <!-- Entry Operations Log -->
      <div v-if="operationLog.length > 0" class="mt-4 terminal-panel p-3">
        <h3 class="font-mono font-bold text-terminal-cyan text-sm mb-2">Operations</h3>
        <div class="space-y-1">
          <div
            v-for="(op, idx) in operationLog"
            :key="`${op.step}-${idx}`"
            class="flex items-start justify-between gap-2 font-mono text-xs"
          >
            <span class="text-terminal-muted">{{ op.step }}</span>
            <span :class="op.status.includes('skipped') ? 'text-terminal-yellow' : op.status === 'resolved' ? 'text-terminal-green' : op.status === 'awaiting_player_choice' ? 'text-terminal-red' : 'text-terminal-muted'">
              {{ op.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Message -->
      <div v-if="ship.message" class="mt-4 terminal-panel p-3 border-terminal-yellow/50">
        <p class="text-terminal-yellow font-mono text-sm">{{ ship.message }}</p>
        <button @click="ship.clearMessage()" class="text-terminal-muted text-xs font-mono mt-1 hover:text-terminal-white">Dismiss</button>
      </div>
    </div>

    <!-- Warp Overlay -->
    <WarpOverlay :active="isWarping" :target-sector="warpTarget" />

    <DeployFightersModal
      v-if="showDeployModal && currentSector"
      :galaxy-id="galaxyId"
      :sector-id="currentSector.id"
      @close="showDeployModal = false"
      @deployed="loadFighters(currentSector.id)"
    />

    <FighterEncounterModal
      v-if="activeEncounter"
      :galaxy-id="galaxyId"
      :encounter="activeEncounter"
      @close="activeEncounter = null"
      @resolved="handleEncounterResolved"
    />

    <PlanetModal
      v-if="selectedPlanet"
      :planet="selectedPlanet"
      :galaxy-id="galaxyId"
      @close="selectedPlanet = null"
      @refresh="currentSector && loadPlanets(currentSector.id)"
    />

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
              <div><span class="text-terminal-cyan">F</span> <span class="text-terminal-muted">Deploy Fighters</span></div>
              <div><span class="text-terminal-cyan">R</span> <span class="text-terminal-muted">Recall Fighters</span></div>
              <div><span class="text-terminal-cyan">1</span> <span class="text-terminal-muted">Deploy Limpets</span></div>
              <div><span class="text-terminal-cyan">2</span> <span class="text-terminal-muted">Deploy Armids</span></div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGalaxyStore } from '../stores/galaxy';
import { useShipStore } from '../stores/ship';
import { useUiStore } from '../stores/ui';
import { useAuthStore } from '../stores/auth';
import WarpOverlay from '../components/WarpOverlay.vue';
import DeployFightersModal from '../components/DeployFightersModal.vue';
import FighterEncounterModal from '../components/FighterEncounterModal.vue';
import PlanetModal from '../components/PlanetModal.vue';

const router = useRouter();
const galaxy = useGalaxyStore();
const ship = useShipStore();
const ui = useUiStore();
const auth = useAuthStore();

const galaxyId = 1;
const selectedNeighbor = ref<number | null>(null);
const jumping = ref(false);
const isWarping = ref(false);
const warpTarget = ref(0);
const npcs = ref<Array<any>>([]);
const news = ref<Array<any>>([]);
const sectorFighters = ref<Array<{ ownerId: number; ownerName: string; count: number; mode: string; hostile: boolean }>>([]);
const sectorMines = ref<Array<{ ownerId: number; hostile: boolean; limpets?: number; armids?: number; hostileEstimate?: number }>>([]);
const showDeployModal = ref(false);
const activeEncounter = ref<any | null>(null);
const operationLog = ref<Array<{ step: string; status: string; details?: Record<string, unknown> }>>([]);
const sectorPlanets = ref<Array<{ id: number; className: string; colonists?: number; citadelLevel: number; isOwn: boolean }>>([]);
const selectedPlanet = ref<any | null>(null);
const creatingPlanet = ref(false);
const recalling = ref(false);

const currentSector = computed(() => galaxy.currentSector());
const neighborList = computed(() => galaxy.neighbors());

function getNeighborPosition(index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 70;
  const cx = 160;
  const cy = 100;
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  return {
    left: `${x - 20}px`,
    top: `${y - 20}px`,
  };
}

function getLineEnd(index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 70;
  const cx = 160;
  const cy = 100;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function neighborDangerIcon(danger: string) {
  switch (danger) {
    case 'safe': return '●';
    case 'caution': return '◐';
    case 'dangerous': return '◉';
    default: return '●';
  }
}

function neighborDangerColor(danger: string) {
  switch (danger) {
    case 'safe': return 'text-terminal-green';
    case 'caution': return 'text-terminal-yellow';
    case 'dangerous': return 'text-terminal-red';
    default: return 'text-terminal-green';
  }
}

function initiateCombat(npc: any) {
  router.push({
    path: `/galaxy/${galaxyId}/combat`,
    query: { enemyId: npc.npc_id, enemyName: npc.persona.name, enemyType: npc.persona.type },
  });
}

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

const ownFighters = computed(() => sectorFighters.value.filter(f => !f.hostile));
const ownDeployedFighters = computed(() => ownFighters.value.reduce((sum, row) => sum + row.count, 0));
const ownFighterMode = computed(() => ownFighters.value[0]?.mode ?? 'defensive');
const hostileFighterCount = computed(() => sectorFighters.value.filter(f => f.hostile).reduce((sum, row) => sum + row.count, 0));
const hostileMineEstimate = computed(() => sectorMines.value.filter(m => m.hostile).reduce((sum, row) => sum + (row.hostileEstimate ?? 0), 0));

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleJump() {
  if (!selectedNeighbor.value || !ship.ship) return;
  const target = selectedNeighbor.value;
  warpTarget.value = target;
  isWarping.value = true;
  await delay(800);
  jumping.value = true;

  const result = await ship.moveShip(galaxyId, target);

  if (result.status === 'moved') {
    operationLog.value = result.operations ?? [];
    if (result.outcome?.narrative) {
      ship.message = result.outcome.narrative;
    }
    if (ship.ship) {
      galaxy.visit(ship.ship.currentSector);
      await loadSectorData(ship.ship.currentSector);
    }
    selectedNeighbor.value = null;
  } else if (result.status === 'encounter') {
    operationLog.value = result.encounter.operations ?? [];
    ship.message = 'Fighter encounter detected. Choose your response.';
    activeEncounter.value = result.encounter;
    isWarping.value = false;
  }

  isWarping.value = false;
  jumping.value = false;
}

async function handleEncounterResolved(data: any) {
  ship.message = data.narrative;
  operationLog.value = data.operations ?? [];
  activeEncounter.value = null;
  selectedNeighbor.value = null;

  if (ship.ship) {
    galaxy.visit(ship.ship.currentSector);
    await loadSectorData(ship.ship.currentSector);
  }
}

function handleQuit() {
  if (confirm('Quit the game?')) {
    router.push('/');
  }
}

// Keyboard shortcuts
async function loadPlanets(sectorId: number) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/planets/sector?galaxyId=${galaxyId}&sectorId=${sectorId}`, {
      headers: auth.getHeaders(),
    });
    const data = await res.json();
    sectorPlanets.value = data.planets || [];
  } catch {
    sectorPlanets.value = [];
  }
}

async function handleCreatePlanet() {
  if (!currentSector.value) return;
  creatingPlanet.value = true;
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/planets/create`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({
        galaxyId,
        sectorId: currentSector.value.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create planet');

    // Refresh planets and ship credits
    await loadPlanets(currentSector.value.id);
    if (ship.ship) ship.ship.credits = data.remainingCredits;

    ship.message = `🌍 Planet created: ${data.className} (${data.class})`;
  } catch (err: any) {
    ship.message = err.message;
  } finally {
    creatingPlanet.value = false;
  }
}

function handleKey(e: KeyboardEvent) {
  if (isWarping.value) return;

  if (showDeployModal.value) {
    if (e.key === 'Escape') showDeployModal.value = false;
    return;
  }

  if (activeEncounter.value) {
    if (e.key === 'Escape') activeEncounter.value = null;
    return;
  }

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
  if (e.key === 'f' || e.key === 'F') {
    if ((ship.ship?.fighters ?? 0) > 0 && currentSector.value?.danger !== 'safe') {
      showDeployModal.value = true;
    }
  }
  if (e.key === 'r' || e.key === 'R') {
    if (ownDeployedFighters.value > 0) {
      handleRecallAll();
    }
  }
  if (e.key === '1') handleDeployMine('limpet');
  if (e.key === '2') handleDeployMine('armid');
  if (e.key === 'g' || e.key === 'G') handleCreatePlanet();
  if (e.key === 'n' || e.key === 'N') router.push(`/galaxy/${galaxyId}/nav`);
  if (e.key === 'h' || e.key === 'H' || e.key === '?') ui.openModal('help');
  if (e.key === 'l' || e.key === 'L') router.push(`/galaxy/${galaxyId}/leaderboard`);
}

async function loadFighters(sectorId: number) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/fighters/sector?galaxyId=${galaxyId}&sectorId=${sectorId}`, {
      headers: auth.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load fighters');
    sectorFighters.value = data.fighters || [];
  } catch {
    sectorFighters.value = [];
  }
}

async function loadMines(sectorId: number) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/mines/sector?galaxyId=${galaxyId}&sectorId=${sectorId}`, {
      headers: auth.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load mines');
    sectorMines.value = data.mines || [];
  } catch {
    sectorMines.value = [];
  }
}

async function handleDeployMine(type: 'limpet' | 'armid') {
  if (!currentSector.value || !ship.ship) return;
  if (currentSector.value.danger === 'safe') {
    ship.message = 'Cannot deploy mines in FedSpace';
    return;
  }

  const stock = type === 'limpet' ? ship.ship.limpets : ship.ship.armids;
  if (stock <= 0) return;

  const input = prompt(`Deploy how many ${type} mines? (max ${stock})`, '1');
  if (!input) return;

  const qty = Number(input);
  if (!Number.isInteger(qty) || qty <= 0 || qty > stock) {
    ship.message = `Invalid quantity for ${type} mines`;
    return;
  }

  try {
    await ship.deployMines(galaxyId, currentSector.value.id, type, qty);
    await loadMines(currentSector.value.id);
    ship.message = `💣 Deployed ${qty} ${type} mines`;
  } catch (err: any) {
    ship.message = err.message;
  }
}

async function handleRecallAll() {
  if (!currentSector.value || recalling.value) return;

  recalling.value = true;
  try {
    await ship.recallFighters(galaxyId, currentSector.value.id);
    await loadFighters(currentSector.value.id);
    ship.message = `↩ Recalled fighters to ship`;
  } catch (err: any) {
    ship.message = err.message;
  } finally {
    recalling.value = false;
  }
}

async function loadSectorData(sectorId: number) {
  const data = await galaxy.loadSector(galaxyId, sectorId);
  if (data) {
    npcs.value = (data.npcs || []).map((n: any) => ({
      ...n,
      persona: JSON.parse(n.persona_json || '{}'),
    }));
  }

  await loadFighters(sectorId);
  await loadMines(sectorId);
  await loadPlanets(sectorId);

  // Load news
  try {
    const newsRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/news?galaxyId=${galaxyId}&limit=5`);
    const newsData = await newsRes.json();
    news.value = newsData.news || [];
  } catch {
    news.value = [];
  }
}

onMounted(async () => {
  await galaxy.loadGalaxy(galaxyId);
  await ship.loadShip(galaxyId);
  ship.loadStats(galaxyId);
  if (ship.ship) {
    galaxy.currentSectorId = ship.ship.currentSector;
    galaxy.visit(ship.ship.currentSector);
    await loadSectorData(ship.ship.currentSector);
  }
  window.addEventListener('keydown', handleKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
});
</script>
