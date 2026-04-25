import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/galaxy/:galaxyId',
    name: 'sector',
    component: () => import('./views/SectorView.vue'),
  },
  {
    path: '/galaxy/:galaxyId/market',
    name: 'market',
    component: () => import('./views/MarketView.vue'),
  },
  {
    path: '/galaxy/:galaxyId/combat',
    name: 'combat',
    component: () => import('./views/CombatView.vue'),
  },
  {
    path: '/galaxy/:galaxyId/stardock',
    name: 'stardock',
    component: () => import('./views/StarDockView.vue'),
  },
  {
    path: '/galaxy/:galaxyId/nav',
    name: 'navigation',
    component: () => import('./views/NavigationView.vue'),
  },
  {
    path: '/galaxy/:galaxyId/leaderboard',
    name: 'leaderboard',
    component: () => import('./views/LeaderboardView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
