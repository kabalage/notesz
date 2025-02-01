import { createApp } from 'vue';
import { VirtualKeyboardEvents } from '@/utils/VirtualKeyboardEvents';
import App from './App.vue';
import router from './router';
import './assets/main.css';

VirtualKeyboardEvents.setupDefaultHandler();

const app = createApp(App);
app.use(router);

app.mount('#app');
