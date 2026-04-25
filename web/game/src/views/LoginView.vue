<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-4xl mb-4">🌌</div>
        <h1 class="text-3xl font-mono font-bold text-terminal-cyan mb-2">TW 3002 AI</h1>
        <p class="text-terminal-muted font-mono text-sm">Web Client v0.1.0</p>
      </div>

      <!-- Login Form -->
      <div class="terminal-panel p-6">
        <div v-if="!needsShip">
          <label class="block text-sm font-mono text-terminal-muted mb-2">Enter your email to begin</label>
          <input
            v-model="email"
            type="email"
            placeholder="captain@example.com"
            class="w-full px-4 py-3 bg-void-950 border border-void-700 rounded text-terminal-white font-mono text-sm focus:border-terminal-cyan focus:outline-none"
            @keyup.enter="handleRegister"
          />
          <button
            @click="handleRegister"
            :disabled="auth.loading"
            class="w-full mt-4 terminal-btn-primary disabled:opacity-50"
          >
            {{ auth.loading ? 'Connecting...' : 'Launch' }}
          </button>
        </div>

        <!-- Ship Creation -->
        <div v-else>
          <p class="text-sm font-mono text-terminal-muted mb-4">Create your ship</p>
          <input
            v-model="shipName"
            type="text"
            placeholder="Ship Name"
            class="w-full px-4 py-3 bg-void-950 border border-void-700 rounded text-terminal-white font-mono text-sm focus:border-terminal-cyan focus:outline-none mb-4"
          />
          <div class="mb-4">
            <p class="text-xs font-mono text-terminal-muted mb-2">Class</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="c in shipClasses"
                :key="c.id"
                @click="selectedClass = c.id"
                :class="[
                  'p-3 rounded border text-xs font-mono text-center transition-colors',
                  selectedClass === c.id
                    ? 'border-terminal-cyan bg-terminal-cyan/10 text-terminal-cyan'
                    : 'border-void-600 bg-void-800 text-terminal-muted hover:bg-void-700'
                ]"
              >
                <div class="font-bold mb-1">{{ c.name }}</div>
                <div class="text-[10px]">{{ c.desc }}</div>
              </button>
            </div>
          </div>
          <button
            @click="handleCreateShip"
            :disabled="!shipName.trim() || ship.loading"
            class="w-full terminal-btn-primary disabled:opacity-50"
          >
            {{ ship.loading ? 'Launching...' : 'Launch Ship' }}
          </button>
        </div>

        <p v-if="auth.error || ship.error" class="mt-4 text-terminal-red text-sm font-mono text-center">
          {{ auth.error || ship.error }}
        </p>
      </div>

      <!-- Footer -->
      <div class="mt-6 text-center">
        <a href="https://playtradewars.net/guide/getting-started" class="text-terminal-muted text-xs font-mono hover:text-terminal-cyan transition-colors">
          New? Read the Guide →
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useShipStore } from '../stores/ship';

const router = useRouter();
const auth = useAuthStore();
const ship = useShipStore();

const email = ref('');
const shipName = ref('');
const selectedClass = ref('merchant');
const needsShip = ref(false);

const shipClasses = [
  { id: 'merchant', name: 'Merchant', desc: '120 cargo, 80 turns' },
  { id: 'scout', name: 'Scout', desc: '60 cargo, 120 turns' },
  { id: 'interceptor', name: 'Interceptor', desc: '70 cargo, 120 hull' },
];

const GALAXY_ID = 1;

async function handleRegister() {
  if (!email.value.trim()) return;
  await auth.register(email.value.trim());
  if (auth.isAuthenticated) {
    await ship.loadShip(GALAXY_ID);
    if (ship.ship) {
      router.push(`/galaxy/${GALAXY_ID}`);
    } else {
      needsShip.value = true;
    }
  }
}

async function handleCreateShip() {
  if (!shipName.value.trim()) return;
  await ship.createShip(GALAXY_ID, shipName.value.trim(), selectedClass.value);
  if (ship.ship) {
    router.push(`/galaxy/${GALAXY_ID}`);
  }
}

watch(() => auth.isAuthenticated, (val) => {
  if (val) {
    ship.loadShip(GALAXY_ID).then(() => {
      if (ship.ship) {
        router.push(`/galaxy/${GALAXY_ID}`);
      } else {
        needsShip.value = true;
      }
    });
  }
});
</script>
