<template>
  <div class="min-h-screen bg-void-950 p-4 flex items-center justify-center">
    <div class="terminal-panel p-6 max-w-lg w-full">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-mono font-bold text-terminal-cyan text-lg">🧭 NAVIGATION LOG</h2>
        <button @click="$router.push(`/galaxy/${galaxyId}`)" class="terminal-btn text-xs">Esc</button>
      </div>
      <p class="text-terminal-muted font-mono text-sm">Full navigation log — coming in next update.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const galaxyId = 1;
</script>
