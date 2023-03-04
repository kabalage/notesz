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
    class="p-1.5 rounded-xl border-2 border-main-400/40 bg-main-400/20
      text-accent-300 disabled:opacity-50
      transform transition-transform duration-200 ease-in-out
      motion-reduce:transition-none motion-reduce:transform-none
      relative before:absolute before:inset-0
      before:transition-all before:duration-200 before:ease-in-out
      motion-reduce:before:transition-none motion-reduce:before:transform-none"
    :class="{
      'hover:bg-main-400/30 hover:text-accent-100': !props.disabled
    }"
    active-class="scale-75 motion-reduce:opacity-50
      before:scale-133 motion-reduce:before:opacity-50"
    :to="props.to"
    :disabled="props.disabled"
  >
    <slot />
  </BaseButton>
</template>
