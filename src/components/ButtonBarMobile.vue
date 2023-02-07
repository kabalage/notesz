<script setup lang="ts">
import { useThemeState } from '@/stores/themeState';
const themeState = useThemeState()!;
</script>

<template>
  <div class="bg-backgroundd pt-px">
    <div
      class="px-2 flex justify-around bg-main-400/20 text-main-300
        transition-[padding] duration-300 ease-in-out"
      :class="{
        'pb-safe-b': !themeState.themeSettingsOpen
      }"
    >
      <slot />
    </div>
  </div>
</template>
