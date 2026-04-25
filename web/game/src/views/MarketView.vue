<template>
  <div class="min-h-screen bg-void-950 p-4 flex items-center justify-center">
    <div class="terminal-panel p-6 max-w-lg w-full">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-mono font-bold text-terminal-yellow text-lg">MARKET</h2>
        <button @click="$router.push(`/galaxy/${galaxyId}`)" class="terminal-btn text-xs">Esc</button>
      </div>
      <p class="text-terminal-muted font-mono text-sm">Market overlay — coming in next update.</p>
      <p class="text-terminal-muted font-mono text-xs mt-2">Press Esc to return to sector.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const galaxyId = 1;
</script>
