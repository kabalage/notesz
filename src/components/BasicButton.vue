<script setup lang="ts">
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  to?: string | object,
  disabled?: boolean,
  ghost?: boolean,
  accent?: boolean
}>();

</script>

<template>
  <BaseButton
    class="
      px-6 py-4 mouse:px-4 mouse:py-3 flex items-center justify-center rounded-lg font-semibold
      text-white disabled:opacity-50
      transform transition-transform duration-200 ease-in-out
      motion-reduce:transition-none motion-reduce:transform-none
      relative before:absolute before:inset-0
      before:transition-all before:duration-200 before:ease-in-out
      motion-reduce:before:transition-none motion-reduce:before:transform-none"
    :class="{
      'mouse:hover:bg-main-400/40': !props.disabled && !props.accent,
      'mouse:hover:bg-accent-400/40': !props.disabled && props.accent,
      'bg-main-400/30': !props.ghost && !props.accent,
      'bg-accent-400/30': !props.ghost && props.accent,
      'border-2 border-main-400/40': props.ghost && !props.accent,
      'border-2 border-accent-400/40': props.ghost && props.accent,
      'mouse:hover:border-transparent': props.ghost && !props.disabled,
      'text-main-400': props.disabled
    }"
    active-class="bg-main-400/40 scale-75 motion-reduce:opacity-50
      before:scale-133 motion-reduce:before:opacity-50"
    :to="props.to"
    :disabled="props.disabled"
  >
    <slot />
  </BaseButton>
</template>
