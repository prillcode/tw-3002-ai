<template>
  <Teleport to="body">
    <div
      :class="[
        'fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300',
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      ]"
    >
      <!-- Radial burst background -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-terminal-cyan/30 via-void-950/90 to-void-950" />

      <!-- Star streaks -->
      <div class="absolute inset-0 overflow-hidden">
        <div
          v-for="i in 24"
          :key="i"
          class="absolute left-1/2 top-1/2"
          :style="{ transform: `rotate(${(i / 24) * 360}deg)` }"
        >
          <div
            :class="[
              'h-px bg-terminal-white/80 rounded-full origin-left',
              active ? 'animate-star-streak' : ''
            ]"
            :style="{
              width: `${20 + (i % 8) * 15}px`,
              animationDelay: `${(i % 6) * 0.05}s`,
            }"
          />
        </div>
      </div>

      <!-- Scanlines -->
      <div class="absolute inset-0 opacity-10 pointer-events-none" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px);" />

      <!-- Text -->
      <div class="relative text-center pointer-events-none">
        <p class="font-mono text-terminal-cyan text-xl font-bold animate-pulse">
          WARPING TO SECTOR {{ targetSector }}
        </p>
        <p class="font-mono text-terminal-muted text-xs mt-2 animate-pulse">
          Initiating jump sequence...
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  active: boolean;
  targetSector: number;
}>();
</script>

<style scoped>
@keyframes star-streak {
  0% {
    opacity: 0;
    transform: translateX(20px) scaleX(0.2);
  }
  30% {
    opacity: 1;
    transform: translateX(60px) scaleX(1);
  }
  100% {
    opacity: 0;
    transform: translateX(200px) scaleX(2);
  }
}

.animate-star-streak {
  animation: star-streak 0.6s ease-out forwards;
}
</style>
