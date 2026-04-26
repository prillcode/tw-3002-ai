<template>
  <div class="min-h-screen bg-void-950 pt-7">
    <div class="fixed top-0 left-0 right-0 z-[100] h-7 bg-amber-500/15 border-b border-amber-400/30 backdrop-blur-sm">
      <div class="h-full flex items-center justify-center px-2">
        <p class="text-[11px] leading-none font-mono text-amber-300 text-center truncate">
          ⚠ BETA: TradeWars 3002 AI is pre-release. Gameplay is functional, but balance/content may change and progress may be reset.
        </p>
      </div>
    </div>
    <router-view />
  </div>
</template>
