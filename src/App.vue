<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { RouterView } from 'vue-router';
import { provideThemeState } from './stores/themeState';

const ThemeSettings = defineAsyncComponent(() => import('@/views/ThemeSettings.vue'));

const themeState = provideThemeState();

</script>

<template>
  <div
    v-if="themeState.loaded"
    class="w-full h-full flex flex-col"
  >
    <div
      class="flex-1 overflow-hidden"
      v-auto-animate="{ duration: 125, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }"
    >
      <RouterView class="" />
    </div>
    <div
      v-if="themeState.themeSettingsOpen"
      class="flex-none"
    >
      <ThemeSettings class="" />
    </div>
  </div>
</template>
