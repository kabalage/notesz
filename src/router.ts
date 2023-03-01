import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router';
import EditorLayout from '@/views/EditorLayout.vue';

const pwaMode = window.matchMedia('(display-mode: standalone)').matches;

let routerHistory;
if (pwaMode && !import.meta.env.DEV) {
  // In PWA mode, we don't want back/forward navigation because it's confusing that is does not
  // work like in a native app
  routerHistory = createMemoryHistory(import.meta.env.BASE_URL);
  routerHistory.replace(location.pathname);
} else {
  routerHistory = createWebHistory(import.meta.env.BASE_URL);
}

const router = createRouter({
  history: routerHistory,
  routes: [
    {
      path: '/',
      component: () => import('@/views/WelcomeView.vue'),
      props: true
    },
    {
      name: 'edit',
      path: '/edit/:repoUser/:repoName/:path*',
      component: EditorLayout,
      props(route) {
        return {
          repo: `${route.params.repoUser}/${route.params.repoName}`,
          path: Array.isArray(route.params.path)
            ? route.params.path.join('/')
            : route.params.path
        };
      }
    },
    {
      name: 'sync',
      path: '/sync/:repoUser/:repoName',
      component: () => import('@/views/SyncRepository.vue'),
      props(route) {
        return {
          repo: `${route.params.repoUser}/${route.params.repoName}`,
          redirect: route.query.redirect || '/'
        };
      }
    },
    {
      path: '/settings',
      component: () => import('@/views/SettingsView.vue'),
      props: true
    },
    {
      path: '/connect',
      component: () => import('@/views/ConnectRepository.vue'),
      props(route) {
        return {
          redirect: route.query.redirect || '/'
        };
      }
    },
    {
      path: '/callback/:type',
      component: () => import('@/views/CallbackHandler.vue'),
      props: true
    },
    {
      path: '/dev',
      component: () => import('@/views/DevSandbox.vue'),
    }
  ]
});

export default router;
