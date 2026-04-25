import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', () => {
  const showHelp = ref(false);
  const showNav = ref(false);
  const showLeaderboard = ref(false);
  const activeModal = ref<string | null>(null);

  function openModal(name: string) {
    activeModal.value = name;
  }

  function closeModal() {
    activeModal.value = null;
  }

  return { showHelp, showNav, showLeaderboard, activeModal, openModal, closeModal };
});
