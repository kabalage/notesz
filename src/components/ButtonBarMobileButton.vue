<script setup lang="ts">
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  to?: string | object,
  disabled?: boolean,
  label?: string
}>();

</script>

<template>
  <BaseButton
    class="h-12 flex flex-col items-center justify-center
      transform transition-transform duration-200 ease-in-out
      text-accent-300 disabled:opacity-25
      motion-reduce:transition-none motion-reduce:transform-none
      relative before:absolute before:inset-0
      before:transition-all before:duration-200 before:ease-in-out
      motion-reduce:before:transition-none motion-reduce:before:transform-none"
    active-class="scale-50 motion-reduce:opacity-50
      before:scale-200 motion-reduce:before:opacity-50"
    :to="props.to"
    :disabled="props.disabled"
  >
    <slot />
    <!-- <div
      v-if="props.label"
      class="text-[0.625rem] font-medium leading-none mt-1 text-center"
    >
      {{ label }}
    </div> -->
  </BaseButton>
</template>
