<script setup lang="ts">
import { useThemeService } from '@/services/themeService';
import useVirtualKeyboard from '@/composables/useVirtualKeyboard';

const themeService = useThemeService();
const virtualKeyboard = useVirtualKeyboard();
</script>

<template>
  <div class="pt-px">
    <div
      class="px-2 py-0.5 flex items-center justify-around bg-main-400/20 text-main-300
        transition-[padding] duration-300 ease-in-out"
      :class="{
        'pb-[max(env(safe-area-inset-bottom),0.125rem)]':
          !themeService.themeSettingsOpen && !virtualKeyboard.visible.value
      }"
    >
      <slot />
    </div>
  </div>
</template>
