<script setup lang="ts">
import { ref, watch } from 'vue';
import useVirtualKeyboard from '@/composables/useVirtualKeyboard';
import { useService } from '@/utils/injector';
import { ThemeService } from '@/services/ThemeService';

const themeService = useService(ThemeService);
const virtualKeyboard = useVirtualKeyboard();

const animate = ref(false);
let animateTimeout: number | undefined;
watch(() => themeService.themeSettingsOpen, () => {
  animate.value = true;
  window.clearTimeout(animateTimeout);
  animateTimeout = window.setTimeout(() => {
    animate.value = false;
  }, 300);
});
</script>

<template>
  <nav class="relative" aria-label="Main navigation">
    <div
      class="px-2 flex items-center justify-around bg-main-400/20 text-main-300"
      :class="{
        'pb-safe-b': !themeService.themeSettingsOpen && !virtualKeyboard.visible.value,
        'transition-[padding] duration-300 ease-in-out': animate
      }"
    >
      <slot />
    </div>
    <div
      class="absolute z-10 h-16 inset-x-0 top-0 -mt-16 pointer-events-none
        bg-gradient-to-t from-background/60 to-transparent"
    />
  </nav>
</template>
