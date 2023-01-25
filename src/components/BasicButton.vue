<script setup lang="ts">
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  to?: string | object,
  disabled?: boolean,
  ghost?: boolean
}>();

</script>

<template>
  <BaseButton
    class="
      px-6 py-4 mouse:px-4 mouse:py-3 flex items-center justify-center rounded-lg font-semibold
      text-indigo-200 disabled:opacity-50
      transform transition-transform duration-200 ease-in-out
      motion-reduce:transition-none motion-reduce:transform-none
      relative before:absolute before:inset-0
      before:transition-all before:duration-200 before:ease-in-out
      motion-reduce:before:transition-none motion-reduce:before:transform-none"
    :class="{
      'mouse:hover:bg-indigo-500/40': !props.disabled,
      'bg-indigo-500/30': !props.ghost,
      'border-2 border-indigo-500/40': props.ghost,
      'mouse:hover:border-transparent': props.ghost && !props.disabled
    }"
    active-class="bg-indigo-500/40 scale-75 motion-reduce:opacity-50
      before:scale-133 motion-reduce:before:opacity-50"
    :to="props.to"
    :disabled="props.disabled"
  >
    <slot />
  </BaseButton>
</template>
