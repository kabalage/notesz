<script setup lang="ts">
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  to?: string | object,
  disabled?: boolean
}>();

</script>

<template>
  <BaseButton
    class="p-1.5 rounded-xl border-2 border-indigo-500/40 bg-indigo-500/20 text-indigo-300
      hover:bg-indigo-500/30 hover:text-indigo-200 transition-transform duration-200
      ease-in-out transform motion-reduce:transition-none"
    active-class="scale-75 motion-reduce:transform-none motion-reduce:opacity-50"
    :to="props.to"
    :disabled="props.disabled"
    :min-active-time="200"
  >
    <slot />
  </BaseButton>
</template>
