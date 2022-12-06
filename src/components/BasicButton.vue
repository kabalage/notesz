<script setup lang="ts">
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  to?: string | object,
  disabled?: boolean
}>();

</script>

<template>
  <BaseButton
    class="
      px-6 py-4 mouse:px-4 mouse:py-3 flex items-center text-indigo-200 rounded-lg font-semibold
      bg-indigo-500/30 mouse:hover:enabled:bg-indigo-500/40 transition-transform duration-200
      ease-in-out transform motion-reduce:transition-none motion-reduce:transform-none
      disabled:opacity-75"
    active-class="bg-indigo-500/40 scale-75"
    :to="props.to"
    :disabled="props.disabled"
    :min-active-time="200"
  >
    <slot />
  </BaseButton>
</template>
