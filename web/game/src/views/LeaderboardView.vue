<template>
  <div class="min-h-screen bg-void-950 p-4 flex items-center justify-center">
    <div class="terminal-panel p-6 max-w-2xl w-full">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-mono font-bold text-terminal-yellow text-lg">🏆 LEADERBOARD</h2>
        <button @click="goBack" class="terminal-btn text-xs">Esc</button>
      </div>

      <div v-if="loading" class="text-terminal-cyan font-mono text-sm">Loading...</div>
      <div v-else-if="error" class="text-terminal-red font-mono text-sm">{{ error }}</div>

      <div v-else-if="entries.length === 0" class="text-terminal-muted font-mono text-sm">
        No pilots registered in this galaxy yet.
      </div>

      <div v-else>
        <table class="w-full text-sm font-mono">
          <thead>
            <tr class="text-terminal-muted border-b border-void-700">
              <th class="text-left py-2 px-2">#</th>
              <th class="text-left py-2 px-2">Pilot</th>
              <th class="text-left py-2 px-2">Ship</th>
              <th class="text-right py-2 px-2">Net Worth</th>
              <th class="text-right py-2 px-2">K/D</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(entry, i) in entries"
              :key="entry.ship_name"
              :class="[
                'border-b border-void-800 hover:bg-void-800 transition-colors',
                isMe(entry.email) ? 'bg-terminal-cyan/5' : ''
              ]"
            >
              <td class="py-2 px-2 text-terminal-muted">{{ i + 1 }}</td>
              <td class="py-2 px-2 text-terminal-white">
                {{ entry.display_name || entry.email.split('@')[0] }}
                <span v-if="isMe(entry.email)" class="text-terminal-cyan text-xs"> (you)</span>
              </td>
              <td class="py-2 px-2 text-terminal-muted">{{ shipClassName(entry.class_id) }}</td>
              <td class="py-2 px-2 text-right text-terminal-green">{{ entry.net_worth?.toLocaleString() ?? 0 }} cr</td>
              <td class="py-2 px-2 text-right text-terminal-yellow">{{ entry.kills ?? 0 }}/{{ entry.deaths ?? 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { SHIP_CLASSES } from '../data/ships';

const router = useRouter();
const auth = useAuthStore();

const galaxyId = 1;
const loading = ref(true);
const error = ref<string | null>(null);
const entries = ref<Array<any>>([]);

function shipClassName(id: string) {
  return SHIP_CLASSES.find(c => c.id === id)?.name ?? id;
}

function isMe(email: string) {
  return auth.email === email;
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.playtradewars.net'}/api/leaderboard?galaxyId=${galaxyId}&limit=50`, {
      headers: auth.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard');
    entries.value = data.leaderboard ?? [];
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push(`/galaxy/${galaxyId}`);
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape') goBack();
}

onMounted(() => {
  load();
  window.addEventListener('keydown', handleKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
});
</script>
