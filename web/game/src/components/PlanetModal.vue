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
      <div class="space-y-3 mb-4">
        <div class="text-terminal-muted font-mono text-xs">{{ planet.description }}</div>

        <div class="grid grid-cols-2 gap-2 text-sm font-mono">
          <div>Class: <span class="text-terminal-cyan">{{ planet.class }}</span></div>
          <div>Citadel: <span class="text-terminal-magenta">Level {{ planet.citadelLevel }} ({{ citadelName }})</span></div>
          <div>Colonists: <span class="text-terminal-yellow">{{ planet.colonists?.toLocaleString() }}</span> / {{ planet.maxColonists?.toLocaleString() }}</div>
          <div>Owner: <span :class="planet.isOwn ? 'text-terminal-green' : 'text-terminal-muted'">{{ planet.isOwn ? 'You' : planet.ownerName }}</span></div>
        </div>

        <!-- Resources -->
        <div class="terminal-panel p-3">
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

        <!-- Q-Cannon Status -->
        <div v-if="planet.citadelLevel >= 3" class="terminal-panel p-3">
          <div class="text-xs font-mono text-terminal-muted mb-2">Q-CANNON STATUS</div>
          <div class="grid grid-cols-2 gap-1 text-sm font-mono">
            <div>Sector: <span class="text-terminal-red">{{ planet.sectCannonPct }}%</span></div>
            <div v-if="planet.citadelLevel >= 4">Atmo: <span class="text-terminal-red">{{ planet.atmoCannonPct }}%</span></div>
          </div>
        </div>
      </div>

      <!-- Owner-only sections -->
      <template v-if="planet.isOwn">
        <!-- Tab Navigation -->
        <div class="flex gap-1 mb-4 border-t border-terminal-cyan/20 pt-3">
          <button v-for="tab in tabs" :key="tab.id"
            @click="activeTab = tab.id"
            class="px-3 py-1 text-xs font-mono rounded"
            :class="activeTab === tab.id ? 'bg-terminal-cyan/20 text-terminal-cyan' : 'text-terminal-muted hover:text-terminal-white'"
          >{{ tab.label }}</button>
        </div>

        <!-- Colonize Tab -->
        <div v-if="activeTab === 'colonize'" class="space-y-2">
          <div class="flex gap-2 items-center">
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

        <!-- Citadel Tab -->
        <div v-if="activeTab === 'citadel'" class="space-y-3">
          <div v-if="citadelCosts && citadelCosts.maxLevel" class="text-terminal-green font-mono text-sm">
            ✅ Citadel at maximum level (Interdictor)
          </div>
          <div v-else-if="citadelCosts" class="space-y-2">
            <div class="text-sm font-mono">
              Next: <span class="text-terminal-magenta">{{ citadelCosts.nextName }}</span> (Level {{ citadelCosts.nextLevel }})
            </div>
            <div class="text-xs font-mono text-terminal-muted">{{ citadelCosts.nextDescription }}</div>

            <!-- Requirements -->
            <div class="terminal-panel p-2 text-xs font-mono">
              <div class="text-terminal-muted mb-1">REQUIREMENTS</div>
              <div :class="citadelCosts.currentResources.colonists >= citadelCosts.requirements.colonists ? 'text-terminal-green' : 'text-terminal-red'">
                Colonists: {{ citadelCosts.requirements.colonists?.toLocaleString() }} (have {{ citadelCosts.currentResources.colonists?.toLocaleString() }})
              </div>
              <div :class="citadelCosts.currentResources.fuel >= citadelCosts.requirements.fuel ? 'text-terminal-green' : 'text-terminal-red'">
                ⛽ Fuel: {{ citadelCosts.requirements.fuel?.toLocaleString() }} (have {{ citadelCosts.currentResources.fuel?.toLocaleString() }})
              </div>
              <div :class="citadelCosts.currentResources.organics >= citadelCosts.requirements.organics ? 'text-terminal-green' : 'text-terminal-red'">
                🌱 Org: {{ citadelCosts.requirements.organics?.toLocaleString() }} (have {{ citadelCosts.currentResources.organics?.toLocaleString() }})
              </div>
              <div :class="citadelCosts.currentResources.equipment >= citadelCosts.requirements.equipment ? 'text-terminal-green' : 'text-terminal-red'">
                ⚙ Eq: {{ citadelCosts.requirements.equipment?.toLocaleString() }} (have {{ citadelCosts.currentResources.equipment?.toLocaleString() }})
              </div>
            </div>

            <button
              @click="advanceCitadel"
              :disabled="advancing || !citadelCosts.canAfford"
              class="w-full terminal-btn text-sm disabled:opacity-50"
            >
              {{ advancing ? 'Upgrading...' : citadelCosts.canAfford ? 'Upgrade Citadel' : 'Insufficient Resources' }}
            </button>
          </div>
          <div v-else class="text-terminal-muted font-mono text-xs">Loading citadel costs...</div>
        </div>

        <!-- Q-Cannon Tab -->
        <div v-if="activeTab === 'cannon'" class="space-y-3">
          <div v-if="planet.citadelLevel < 3" class="text-terminal-muted font-mono text-xs">
            Q-Cannon requires Citadel Level 3 (Fortress)
          </div>
          <template v-else>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <label class="text-xs font-mono text-terminal-muted w-24">Sector %</label>
                <input v-model.number="sectPct" type="range" min="0" max="100" class="flex-1" />
                <span class="text-sm font-mono text-terminal-red w-10 text-right">{{ sectPct }}%</span>
              </div>
              <div v-if="planet.citadelLevel >= 4" class="flex items-center gap-2">
                <label class="text-xs font-mono text-terminal-muted w-24">Atmo %</label>
                <input v-model.number="atmoPct" type="range" min="0" max="100" class="flex-1" />
                <span class="text-sm font-mono text-terminal-red w-10 text-right">{{ atmoPct }}%</span>
              </div>
              <button @click="saveCannon" :disabled="savingCannon" class="terminal-btn text-sm w-full">
                {{ savingCannon ? 'Saving...' : 'Save Q-Cannon Settings' }}
              </button>
            </div>
          </template>
        </div>

        <!-- Transport Tab -->
        <div v-if="activeTab === 'transport'" class="space-y-3">
          <div class="text-xs font-mono text-terminal-muted mb-1">
            Transfer resources between ship cargo and planet storage
          </div>
          <div class="flex gap-2 mb-2">
            <button
              @click="transportDir = 'deposit'"
              class="px-3 py-1 text-xs font-mono rounded"
              :class="transportDir === 'deposit' ? 'bg-terminal-cyan/20 text-terminal-cyan' : 'text-terminal-muted'"
            >Deposit →</button>
            <button
              @click="transportDir = 'withdraw'"
              class="px-3 py-1 text-xs font-mono rounded"
              :class="transportDir === 'withdraw' ? 'bg-terminal-cyan/20 text-terminal-cyan' : 'text-terminal-muted'"
            >← Withdraw</button>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="text-xs font-mono text-terminal-muted">⛽ Fuel</label>
              <input v-model.number="tFuel" type="number" min="0" class="w-full bg-void-900 border border-terminal-cyan/30 text-terminal-white font-mono text-sm p-1 rounded" />
            </div>
            <div>
              <label class="text-xs font-mono text-terminal-muted">🌱 Org</label>
              <input v-model.number="tOrg" type="number" min="0" class="w-full bg-void-900 border border-terminal-cyan/30 text-terminal-white font-mono text-sm p-1 rounded" />
            </div>
            <div>
              <label class="text-xs font-mono text-terminal-muted">⚙ Eq</label>
              <input v-model.number="tEq" type="number" min="0" class="w-full bg-void-900 border border-terminal-cyan/30 text-terminal-white font-mono text-sm p-1 rounded" />
            </div>
          </div>
          <button @click="doTransport" :disabled="transporting" class="terminal-btn text-sm w-full">
            {{ transporting ? 'Transferring...' : `${transportDir === 'deposit' ? 'Deposit' : 'Withdraw'} Resources` }}
          </button>
        </div>

        <div v-if="actionMessage" class="text-xs font-mono mt-2" :class="actionMessage.includes('Error') ? 'text-terminal-red' : 'text-terminal-green'">
          {{ actionMessage }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

// Tab state
const tabs = [
  { id: 'colonize', label: 'Colonize' },
  { id: 'citadel', label: 'Citadel' },
  { id: 'cannon', label: 'Q-Cannon' },
  { id: 'transport', label: 'Transport' },
];
const activeTab = ref('colonize');
const actionMessage = ref<string | null>(null);

// Colonize
const colonistQty = ref(100);
const colonizing = ref(false);
const colonizeError = ref<string | null>(null);

// Citadel
const citadelCosts = ref<any>(null);
const advancing = ref(false);

// Q-Cannon
const sectPct = ref(props.planet.sectCannonPct || 0);
const atmoPct = ref(props.planet.atmoCannonPct || 0);
const savingCannon = ref(false);

// Transport
const transportDir = ref<'deposit' | 'withdraw'>('deposit');
const tFuel = ref(0);
const tOrg = ref(0);
const tEq = ref(0);
const transporting = ref(false);

const citadelNames = ['None', 'Bunker', 'Barracks', 'Fortress', 'Citadel', 'Stronghold', 'Interdictor'];
const citadelName = computed(() => citadelNames[props.planet.citadelLevel] || 'Unknown');

const colonistSpace = computed(() => Math.max(0, (props.planet.maxColonists || 0) - (props.planet.colonists || 0)));
const colonistCreditCost = computed(() => colonistQty.value * 5);
const colonistFuelCost = computed(() => {
  const distance = Math.abs((ship.ship?.currentSector || 0) - (props.planet.sectorIndex || 0));
  return distance * 10 * Math.ceil(colonistQty.value / 100);
});

// Load citadel costs on mount
onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/planets/citadel-costs?planetId=${props.planet.id}`, {
      headers: auth.getHeaders(),
    });
    citadelCosts.value = await res.json();
  } catch { /* ignore */ }
});

async function colonize() {
  if (colonistQty.value <= 0) return;
  colonizing.value = true;
  colonizeError.value = null;
  try {
    const res = await fetch(`${API_BASE}/api/planets/colonize`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({ galaxyId: props.galaxyId, planetId: props.planet.id, quantity: colonistQty.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    props.planet.colonists = data.totalColonists;
    if (ship.ship) ship.ship.credits -= data.creditsConsumed;
    actionMessage.value = `+${data.colonistsAdded.toLocaleString()} colonists deposited`;
    emit('refresh');
  } catch (err: any) {
    colonizeError.value = err.message;
  } finally {
    colonizing.value = false;
  }
}

async function advanceCitadel() {
  advancing.value = true;
  actionMessage.value = null;
  try {
    const res = await fetch(`${API_BASE}/api/planets/citadel/advance`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({ planetId: props.planet.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    props.planet.citadelLevel = data.newLevel;
    props.planet.fuel = data.remainingResources.fuel;
    props.planet.organics = data.remainingResources.organics;
    props.planet.equipment = data.remainingResources.equipment;
    actionMessage.value = `Citadel upgraded to ${data.levelName} (L${data.newLevel})!`;
    // Reload costs
    const costsRes = await fetch(`${API_BASE}/api/planets/citadel-costs?planetId=${props.planet.id}`, { headers: auth.getHeaders() });
    citadelCosts.value = await costsRes.json();
  } catch (err: any) {
    actionMessage.value = `Error: ${err.message}`;
  } finally {
    advancing.value = false;
  }
}

async function saveCannon() {
  savingCannon.value = true;
  actionMessage.value = null;
  try {
    const body: any = { planetId: props.planet.id, sectPct: sectPct.value };
    if (props.planet.citadelLevel >= 4) body.atmoPct = atmoPct.value;
    const res = await fetch(`${API_BASE}/api/planets/qcannon`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    props.planet.sectCannonPct = data.sectCannonPct;
    props.planet.atmoCannonPct = data.atmoCannonPct;
    actionMessage.value = 'Q-Cannon settings saved';
  } catch (err: any) {
    actionMessage.value = `Error: ${err.message}`;
  } finally {
    savingCannon.value = false;
  }
}

async function doTransport() {
  transporting.value = true;
  actionMessage.value = null;
  try {
    const res = await fetch(`${API_BASE}/api/planets/transport`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify({
        planetId: props.planet.id,
        direction: transportDir.value,
        fuel: tFuel.value,
        organics: tOrg.value,
        equipment: tEq.value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    actionMessage.value = `${transportDir.value === 'deposit' ? 'Deposited' : 'Withdrew'} ${data.moved.fuel} fuel, ${data.moved.organics} org, ${data.moved.equipment} eq`;
    emit('refresh');
  } catch (err: any) {
    actionMessage.value = `Error: ${err.message}`;
  } finally {
    transporting.value = false;
  }
}

function close() { emit('close'); }

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

window.addEventListener('keydown', handleKey);
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>
