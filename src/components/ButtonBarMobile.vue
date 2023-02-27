<script setup lang="ts">
import { useThemeService } from '@/services/themeService';
import useVirtualKeyboard from '@/composables/useVirtualKeyboard';

const themeService = useThemeService();
const virtualKeyboard = useVirtualKeyboard();
</script>

<template>
  <div class="pt-px">
    <div
      class="px-2 flex items-center justify-around bg-main-400/20 text-main-300
        transition-[padding] duration-300 ease-in-out"
      :class="{
        'pb-safe-b': !themeService.themeSettingsOpen && !virtualKeyboard.visible.value
      }"
    >
      <slot />
    </div>
  </div>
</template>
