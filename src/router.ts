import { createRouter, createWebHistory } from 'vue-router';
import EditorLayout from '@/views/EditorLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
          path: Array.isArray(route.params.path) ?
            route.params.path.join('/'):
            route.params.path
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
      props: {
        parentRoute: '/'
      }
    },
    {
      path: '/settings/connect',
      component: () => import('@/views/ConnectRepository.vue'),
      props: {
        parentRoute: '/settings'
      }
    },
    {
      path: '/callback/:type',
      component: () => import('@/views/CallbackHandler.vue'),
      props: true
    }
  ]
});

export default router;
