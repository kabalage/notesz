<script setup lang="ts">
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  to?: string | object,
  disabled?: boolean
}>();

</script>

<template>
  <BaseButton
    class="text-indigo-400 mouse:hover:text-indigo-300 p-2
      transition-transform duration-200 ease-in-out transform motion-reduce:transition-none
      motion-reduce:transform-none disabled:opacity-75"
    active-class="scale-50 mouse:scale-75 motion-reduce:transform-none
      motion-reduce:opacity-50"
    :to="props.to"
    :disabled="props.disabled"
    :min-active-time="200"
  >
    <slot />
  </BaseButton>
</template>
