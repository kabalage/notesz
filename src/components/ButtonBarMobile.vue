<script setup lang="ts">
import { useThemeState } from '@/stores/themeState';
import useVirtualKeyboard from '@/utils/useVirtualKeyboard';

const themeState = useThemeState()!;
const virtualKeyboard = useVirtualKeyboard();
</script>

<template>
  <div class="pt-px">
    <div
      class="px-2 flex justify-around bg-main-400/20 text-main-300
        transition-[padding] duration-300 ease-in-out"
      :class="{
        'pb-safe-b': !themeState.themeSettingsOpen && !virtualKeyboard.visible.value
      }"
    >
      <slot />
    </div>
  </div>
</template>
