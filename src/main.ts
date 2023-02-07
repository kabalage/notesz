import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import './assets/main.css';
import { registerSW } from 'virtual:pwa-register';

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

const app = createApp(App);
app.use(router);

// TODO temporary solution for EditorView until this gets sorted out:
// https://github.com/surmon-china/vue-codemirror/issues/167
app.provide('app', app);

app.mount('#app');
