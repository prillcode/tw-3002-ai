import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.playtradewars.net';

export interface CloudAuth {
  token: string;
  email: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('tw3002_token'));
  const email = ref<string | null>(localStorage.getItem('tw3002_email'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  /** Step 1: Register — sends OTP email, no token yet. */
  async function register(emailInput: string, turnstileToken?: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      email.value = emailInput;
      localStorage.setItem('tw3002_email', emailInput);
      return data;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /** Step 2: Verify OTP — returns bearer token. */
  async function verifyEmail(emailInput: string, otp: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      token.value = data.authToken;
      localStorage.setItem('tw3002_token', data.authToken);
      return data;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    token.value = null;
    email.value = null;
    localStorage.removeItem('tw3002_token');
    localStorage.removeItem('tw3002_email');
  }

  function getHeaders(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token.value) h['Authorization'] = `Bearer ${token.value}`;
    return h;
  }

  return {
    token,
    email,
    loading,
    error,
    isAuthenticated,
    register,
    verifyEmail,
    logout,
    getHeaders,
  };
});
