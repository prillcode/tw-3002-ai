<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="$emit('close')">
    <div class="terminal-panel p-5 max-w-sm w-full">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-mono font-bold text-terminal-cyan text-sm">
          {{ player.ship_name || 'Unknown Ship' }}
          <span v-if="isMe" class="text-terminal-yellow text-xs">(you)</span>
        </h3>
        <button @click="$emit('close')" class="text-terminal-muted hover:text-terminal-white font-mono text-sm">✕</button>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs font-mono mb-3">
        <div class="text-terminal-muted">Class</div>
        <div class="text-terminal-white text-right">{{ shipClassName }}</div>

        <div class="text-terminal-muted">Net Worth</div>
        <div class="text-terminal-green text-right">{{ (player.net_worth ?? 0).toLocaleString() }} cr</div>

        <div class="text-terminal-muted">Kills / Deaths</div>
        <div class="text-terminal-yellow text-right">{{ player.kills ?? 0 }} / {{ player.deaths ?? 0 }}</div>

        <div class="text-terminal-muted">KDR</div>
        <div class="text-terminal-yellow text-right">{{ kdr }}</div>

        <div class="text-terminal-muted">Standing</div>
        <div :class="standingColor" class="text-right">{{ standing }}</div>

        <div class="text-terminal-muted">Rank</div>
        <div class="text-terminal-cyan text-right">{{ rankTitle }}</div>

        <div class="text-terminal-muted">Experience</div>
        <div class="text-terminal-cyan text-right">{{ (player.experience ?? 0).toLocaleString() }} XP</div>

        <div class="text-terminal-muted">Planets Held</div>
        <div class="text-terminal-magenta text-right">{{ player.planets_held ?? 0 }}</div>

        <div v-if="player.commissioned" class="col-span-2 text-terminal-yellow text-center mt-1">
          ⭐ Guild Commissioned
        </div>
      </div>

      <div class="border-t border-void-700 pt-3 text-center">
        <span class="text-terminal-muted font-mono text-xs">{{ displayName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SHIP_CLASSES } from '../data/ships';

interface Props {
  player: {
    ship_name: string;
    class_id: string;
    display_name?: string;
    email: string;
    net_worth: number;
    kills: number;
    deaths: number;
    alignment: number;
    experience: number;
    rank: number;
    commissioned: number;
    planets_held?: number;
  };
  isMe?: boolean;
}

const props = defineProps<Props>();
defineEmits<{ (e: 'close'): void }>();

const RANK_TABLE: Record<number, string> = {
  1: 'Private', 2: 'Private 1st Class', 3: 'Lance Corporal', 4: 'Corporal',
  5: 'Sergeant', 6: 'Staff Sergeant', 7: 'Gunnery Sergeant', 8: '1st Sergeant',
  9: 'Sergeant Major', 10: 'Warrant Officer', 11: 'Chief Warrant Officer', 12: 'Ensign',
  13: 'Lieutenant J.G.', 14: 'Lieutenant', 15: 'Lieutenant Commander', 16: 'Commander',
  17: 'Captain', 18: 'Commodore', 19: 'Rear Admiral', 20: 'Vice Admiral',
  21: 'Admiral', 22: 'Fleet Admiral',
};

const shipClassName = computed(() => {
  return SHIP_CLASSES.find(c => c.id === props.player.class_id)?.name ?? props.player.class_id;
});

const displayName = computed(() => {
  return props.player.display_name || props.player.email.split('@')[0];
});

const kdr = computed(() => {
  const d = props.player.deaths ?? 0;
  if (d === 0) return (props.player.kills ?? 0).toFixed(1);
  return ((props.player.kills ?? 0) / d).toFixed(2);
});

const standing = computed(() => {
  const a = props.player.alignment ?? 0;
  if (a >= 1000) return 'CHOAM Commissioned';
  if (a > 0) return 'CHOAM Friendly';
  if (a === 0) return 'Independent';
  if (a <= -100) return 'Outlaw';
  return 'Smuggler';
});

const standingColor = computed(() => {
  const a = props.player.alignment ?? 0;
  if (a > 0) return 'text-terminal-green';
  if (a === 0) return 'text-terminal-muted';
  return 'text-terminal-red';
});

const rankTitle = computed(() => {
  return RANK_TABLE[props.player.rank ?? 1] ?? 'Private';
});
</script>
