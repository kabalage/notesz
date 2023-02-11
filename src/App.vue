<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { RouterView } from 'vue-router';
import { provideThemeState } from './stores/themeState';

import { vSmoothResize } from '@/composables/useSmoothResize';
import NoteszTransition from './components/NoteszTransition.vue';

const ThemeSettings = defineAsyncComponent(() => import('@/views/ThemeSettings.vue'));
const MobileDevConsole = defineAsyncComponent(() => import('@/views/MobileDevConsole.vue'));

const themeState = provideThemeState();
</script>

<template>
  <div
    v-if="themeState.loaded"
    class="w-full h-full flex flex-col bg-main-400/20"
  >
    <MobileDevConsole
      v-if="false"
      ref="consoleDiv"
      class="h-32"
    />
    <div
      class="flex-1 overflow-hidden bg-background"
      key="main-area"
      v-smooth-resize="{ watchParent: true }"
    >
      <RouterView class="" v-slot="{ Component }">
        <Transition
          enter-active-class="duration-[150ms] transition-all ease-in-out
            motion-reduce:transition-none"
          leave-active-class="duration-[150ms] transition-all ease-in-out
            motion-reduce:transition-none"
          enter-from-class="opacity-0 transform scale-[0.95]"
          leave-to-class="opacity-0 transform scale-[0.95]"
          mode="out-in"
        >
          <Component :is="Component" />
        </Transition>
      </RouterView>
    </div>
    <NoteszTransition
      enter-from-class=""
      leave-to-class="translate-y-full"
    >
      <ThemeSettings
        v-if="themeState.themeSettingsOpen"
        class="flex-none"
        key="theme-settings"
      />
    </NoteszTransition>
  </div>
</template>
