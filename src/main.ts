import { createApp } from 'vue';
import { VirtualKeyboardEvents } from '@/utils/VirtualKeyboardEvents';
import App from './App.vue';
import router from './router';
import './assets/main.css';

VirtualKeyboardEvents.setupDefaultHandler();

const app = createApp(App);
app.use(router);

// TODO temporary solution for EditorView until this gets sorted out:
// https://github.com/surmon-china/vue-codemirror/issues/167
app.provide('app', app);

app.mount('#app');
