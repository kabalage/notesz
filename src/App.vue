<script setup lang="ts">
import { defineAsyncComponent, Transition } from 'vue';
import { RouterView } from 'vue-router';
import { provideThemeState } from '@/stores/themeState';
import { provideDialogState } from '@/stores/dialogState';

import { vSmoothResize } from '@/composables/useSmoothResize';
import NoteszTransition from '@/components/NoteszTransition.vue';
import useIsTouchDevice from '@/composables/useIsTouchDevice';
import DialogHost from '@/views/DialogHost.vue';

const ThemeSettings = defineAsyncComponent(() => import('@/views/ThemeSettings.vue'));
const MobileDevConsole = defineAsyncComponent(() => import('@/views/MobileDevConsole.vue'));

const dialogState = provideDialogState();
const themeState = provideThemeState(dialogState);

const isTouchDevice = useIsTouchDevice();

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
      v-smooth-resize="{ watchParent: true, animationDuration: 300 }"
    >
      <RouterView class="" v-slot="{ Component }">
        <component
          :is="isTouchDevice ? 'v-fragment' : Transition"
          enter-active-class="duration-200 transition-all ease-out
            motion-reduce:transition-none"
          leave-active-class="duration-100 transition-all ease-in
            motion-reduce:transition-none"
          enter-from-class="opacity-0 transform scale-[0.95]"
          leave-to-class="opacity-0 transform scale-[0.95]"
          mode="out-in"
        >
          <component :is="Component" />
        </component>
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
    <DialogHost />
  </div>
</template>
