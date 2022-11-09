<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div
    class="w-full h-full"
    v-auto-animate="{ duration: 125, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }"
  >
    <RouterView />
  </div>
</template>
