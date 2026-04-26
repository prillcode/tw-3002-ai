<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-4xl mb-4">🌌</div>
        <h1 class="text-3xl font-mono font-bold text-terminal-cyan mb-2">TW 3002 AI</h1>
        <p class="text-terminal-muted font-mono text-sm">Web Client v0.5.0</p>
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

        <!-- Digest -->
        <div v-if="digest && (digest.deaths > 0 || digest.news.length > 0)" class="mt-4 terminal-panel p-3 border-terminal-yellow/50">
          <p class="text-terminal-yellow font-mono text-xs font-bold mb-1">📡 While you were away...</p>
          <p v-if="digest.deaths > 0" class="text-terminal-red font-mono text-xs">💥 {{ digest.deaths }} death(s)</p>
          <p v-if="digest.kills > 0" class="text-terminal-green font-mono text-xs">⚔ {{ digest.kills }} kill(s)</p>
          <p v-for="(item, i) in digest.news.slice(0, 3)" :key="i" class="text-terminal-muted font-mono text-xs">
            • {{ item.headline }}
          </p>
          <button @click="router.push(`/galaxy/${GALAXY_ID}`)" class="w-full mt-2 terminal-btn-primary text-xs">
            Enter Galaxy →
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

interface DigestData {
  kills: number;
  deaths: number;
  news: Array<any>;
}

const router = useRouter();
const auth = useAuthStore();
const ship = useShipStore();

const email = ref('');
const shipName = ref('');
const selectedClass = ref('merchant');
const needsShip = ref(false);
const digest = ref<DigestData | null>(null);

const shipClasses = [
  { id: 'merchant', name: 'Merchant', desc: '120 cargo, 80 turns' },
  { id: 'scout', name: 'Scout', desc: '60 cargo, 120 turns' },
  { id: 'interceptor', name: 'Interceptor', desc: '70 cargo, 120 hull' },
];

const GALAXY_ID = 1;

async function fetchDigest() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/notifications/digest?galaxyId=${GALAXY_ID}`, {
      headers: auth.getHeaders(),
    });
    if (res.ok) {
      digest.value = await res.json();
    }
  } catch {
    digest.value = null;
  }
}

async function handleRegister() {
  if (!email.value.trim()) return;
  await auth.register(email.value.trim());
  if (auth.isAuthenticated) {
    await ship.loadShip(GALAXY_ID);
    await fetchDigest();
    if (ship.ship && !digest.value?.deaths) {
      router.push(`/galaxy/${GALAXY_ID}`);
    } else if (ship.ship) {
      // Show digest, then user clicks to continue
    } else {
      needsShip.value = true;
    }
  }
}

async function handleCreateShip() {
  if (!shipName.value.trim()) return;
  await ship.createShip(GALAXY_ID, shipName.value.trim(), selectedClass.value);
  if (ship.ship) {
    await fetchDigest();
    if (!digest.value?.deaths) {
      router.push(`/galaxy/${GALAXY_ID}`);
    }
  }
}

watch(() => auth.isAuthenticated, (val) => {
  if (val) {
    ship.loadShip(GALAXY_ID).then(async () => {
      await fetchDigest();
      if (ship.ship && !digest.value?.deaths) {
        router.push(`/galaxy/${GALAXY_ID}`);
      } else if (!ship.ship) {
        needsShip.value = true;
      }
    });
  }
});
</script>
