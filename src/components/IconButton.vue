<script setup lang="ts">
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  to?: string | object,
  disabled?: boolean,
  accent?: boolean
}>();

</script>

<template>
  <BaseButton
    class="p-2 disabled:opacity-50
      transform transition-transform duration-200 ease-in-out
      motion-reduce:transition-none motion-reduce:transform-none
      relative before:absolute before:inset-0
      before:transition-all before:duration-200 before:ease-in-out
      motion-reduce:before:transition-none motion-reduce:before:transform-none"
    :class="{
      'text-main-400': !props.accent,
      'text-accent-300': props.accent,
      'mouse:hover:text-main-300': !props.accent && !props.disabled,
      'mouse:hover:text-accent-200': props.accent && !props.disabled
    }"
    active-class="scale-50 mouse:scale-75 motion-reduce:opacity-50
      before:scale-200 mouse:before:scale-133 motion-reduce:before:opacity-50"
    :to="props.to"
    :disabled="props.disabled"
  >
    <slot />
  </BaseButton>
</template>
