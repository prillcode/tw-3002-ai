<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-4xl mb-4">🌌</div>
        <h1 class="text-3xl font-mono font-bold text-terminal-cyan mb-2">TW 3002 AI</h1>
        <p class="text-terminal-muted font-mono text-sm">Web Client v0.6.0</p>
      </div>

      <div class="terminal-panel p-6">
        <!-- STEP 1: Register -->
        <div v-if="step === 'register'">
          <label class="block text-sm font-mono text-terminal-muted mb-2">Enter your email to begin</label>
          <input
            v-model="email"
            type="email"
            placeholder="captain@example.com"
            class="w-full px-4 py-3 bg-void-950 border border-void-700 rounded text-terminal-white font-mono text-sm focus:border-terminal-cyan focus:outline-none"
            @keyup.enter="handleRegister"
          />
          <!-- Turnstile widget -->
          <div
            class="cf-turnstile mt-4 flex justify-center"
            :data-sitekey="TURNSTILE_SITE_KEY"
            data-callback="onTurnstileSuccess"
            data-error-callback="onTurnstileError"
            data-expired-callback="onTurnstileExpired"
          ></div>
          <button
            @click="handleRegister"
            :disabled="auth.loading || !email.trim()"
            class="w-full mt-4 terminal-btn-primary disabled:opacity-50"
          >
            {{ auth.loading ? 'Sending code...' : 'Continue' }}
          </button>
        </div>

        <!-- STEP 2: Verify OTP -->
        <div v-else-if="step === 'verify'">
          <p class="text-sm font-mono text-terminal-cyan mb-1">📧 Check your email</p>
          <p class="text-xs font-mono text-terminal-muted mb-4">
            We sent a 6-digit code to <strong class="text-terminal-white">{{ email }}</strong>
          </p>
          <input
            v-model="otp"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            placeholder="123456"
            class="w-full px-4 py-3 bg-void-950 border border-void-700 rounded text-terminal-white font-mono text-lg tracking-[0.5em] text-center focus:border-terminal-cyan focus:outline-none"
            @keyup.enter="handleVerify"
          />
          <button
            @click="handleVerify"
            :disabled="auth.loading || otp.length !== 6"
            class="w-full mt-4 terminal-btn-primary disabled:opacity-50"
          >
            {{ auth.loading ? 'Verifying...' : 'Verify & Launch' }}
          </button>
          <button
            @click="resendCode"
            :disabled="auth.loading"
            class="w-full mt-2 text-xs font-mono text-terminal-muted hover:text-terminal-cyan transition-colors"
          >
            Resend code
          </button>
          <button
            @click="step = 'register'"
            class="w-full mt-2 text-xs font-mono text-terminal-muted hover:text-terminal-cyan transition-colors"
          >
            Use a different email
          </button>
        </div>

        <!-- STEP 3: Ship Creation -->
        <div v-else-if="step === 'createShip'">
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
import { ref, onMounted } from 'vue';
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
const otp = ref('');
const shipName = ref('');
const selectedClass = ref('merchant');
const step = ref<'register' | 'verify' | 'createShip'>('register');
const digest = ref<DigestData | null>(null);
const turnstileToken = ref<string | null>(null);

// TODO: Replace with your actual Cloudflare Turnstile site key
const TURNSTILE_SITE_KEY = '0x4AAAAAADIgFsuw7omMEkIh';

const shipClasses = [
  { id: 'merchant', name: 'Spice Runner', desc: '120 cargo, 80 turns' },
  { id: 'scout', name: 'Dune Skiff', desc: '60 cargo, 120 turns' },
  { id: 'interceptor', name: 'Sardaukar Blade', desc: '70 cargo, 120 hull' },
];

const GALAXY_ID = 1;

// Turnstile callbacks (globals that the widget calls)
if (typeof window !== 'undefined') {
  (window as any).onTurnstileSuccess = (token: string) => {
    turnstileToken.value = token;
  };
  (window as any).onTurnstileError = () => {
    turnstileToken.value = null;
  };
  (window as any).onTurnstileExpired = () => {
    turnstileToken.value = null;
  };
}

// Load Turnstile script
onMounted(() => {
  if (!document.getElementById('cf-turnstile-script')) {
    const script = document.createElement('script');
    script.id = 'cf-turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
});

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

function resetTurnstile() {
  turnstileToken.value = null;
  if (typeof window !== 'undefined' && (window as any).turnstile) {
    (window as any).turnstile.reset();
  }
}

async function handleRegister() {
  if (!email.value.trim()) return;
  if (!turnstileToken.value) {
    auth.error = 'Please complete the Cloudflare verification';
    return;
  }
  try {
    await auth.register(email.value.trim(), turnstileToken.value);
    step.value = 'verify';
    otp.value = '';
    resetTurnstile();
  } catch {
    // Error displayed by auth.error
  }
}

async function handleVerify() {
  if (otp.value.length !== 6) return;
  try {
    await auth.verifyEmail(email.value, otp.value);
    // Now authenticated — check for existing ship
    await ship.loadShip(GALAXY_ID);
    await fetchDigest();
    if (ship.ship && !digest.value?.deaths) {
      router.push(`/galaxy/${GALAXY_ID}`);
    } else if (ship.ship) {
      // Show digest
    } else {
      step.value = 'createShip';
    }
  } catch {
    // Error displayed by auth.error
  }
}

async function resendCode() {
  if (!email.value.trim()) return;
  if (!turnstileToken.value) {
    auth.error = 'Please complete the Cloudflare verification again';
    resetTurnstile();
    return;
  }
  try {
    await auth.register(email.value.trim(), turnstileToken.value);
    auth.error = 'Code resent. Check your email.';
    resetTurnstile();
  } catch {
    // Error displayed by auth.error
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
</script>
