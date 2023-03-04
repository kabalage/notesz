<script setup lang="ts">
import BaseButton from './BaseButton.vue';

const props = defineProps<{
  modelValue?: boolean,
}>();

</script>

<template>
  <BaseButton
    :class="props.modelValue
      ? 'bg-accent-400 [&:disabled>span]:opacity-75 ring-offset-2'
      : 'bg-main-400/40 [&:disabled>span]:opacity-25'"
    class="relative inline-flex h-8 w-16 items-center rounded-full
      ring-offset-background disabled:opacity-50"
    @click="$emit('update:modelValue', !props.modelValue)"
  >
    <span
      :class="{
        'translate-x-9 shadow-sm shadow-accent-800/40': props.modelValue,
        'translate-x-1 shadow-none': !props.modelValue
      }"
      class="inline-block h-6 w-6 transform rounded-full bg-white transition ease-in-out
        duration-200 motion-reduce:transition-none"
    />
  </BaseButton>
</template>
