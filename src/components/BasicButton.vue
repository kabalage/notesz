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
      px-6 py-4 mouse:px-4 mouse:py-3 flex items-center justify-center rounded-lg font-semibold
      bg-indigo-500/30 text-indigo-200 mouse:enabled:hover:bg-indigo-500/40
      transform transition-transform duration-200 ease-in-out
      motion-reduce:transition-none motion-reduce:transform-none
      disabled:opacity-75
      relative before:absolute before:inset-0
      before:transition-all before:duration-200 before:ease-in-out
      motion-reduce:before:transition-none motion-reduce:before:transform-none"
    active-class="bg-indigo-500/40 scale-75 motion-reduce:opacity-50
      before:scale-133 motion-reduce:before:opacity-50"
    :to="props.to"
    :disabled="props.disabled"
    :min-active-time="200"
  >
    <slot />
  </BaseButton>
</template>
