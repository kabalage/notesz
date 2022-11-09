import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import './assets/main.css';
import { registerSW } from 'virtual:pwa-register';
import { autoAnimatePlugin } from '@formkit/auto-animate/vue';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('sw onNeedRefresh');
    alert('A new version is available.');
    updateSW();
  },
  onOfflineReady() {
    console.log('sw onOfflineReady - App ready to work offline');
  },
});

// enable mobile safari :active
// https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/
// document.addEventListener('touchstart', () => {}, true);

const app = createApp(App);
app.use(router);
app.use(autoAnimatePlugin);

// TODO temporary solution for EditorView until this gets sorted out:
// https://github.com/surmon-china/vue-codemirror/issues/167
app.provide('app', app);

app.mount('#app');
