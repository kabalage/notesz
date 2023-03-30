<script setup lang="ts">
import BaseButton from './BaseButton.vue';
import SpinnerIcon from '@/assets/icons/spinner.svg?component';

const props = defineProps<{
  to?: string | object,
  disabled?: boolean,
  ghost?: boolean,
  accent?: boolean,
  danger?: boolean,
  loading?: boolean,
  tag?: string
}>();

</script>

<template>
  <BaseButton
    class="
      px-4 py-2.5 flex items-center justify-center rounded-lg font-medium text-white
      transform transition-transform duration-200 ease-in-out
      motion-reduce:transition-none motion-reduce:transform-none
      relative before:absolute before:inset-0
      before:transition-all before:duration-200 before:ease-in-out
      motion-reduce:before:transition-none motion-reduce:before:transform-none"
    :class="{
      'mouse:hover:bg-main-400/40': !props.disabled && !props.accent && !props.danger,
      'mouse:hover:bg-accent-400/40': !props.disabled && props.accent && !props.danger,
      'mouse:hover:bg-red-500': !props.disabled && !props.accent && props.danger,
      'bg-main-400/30': !props.ghost && !props.accent && !props.danger,
      'bg-accent-400/30': !props.ghost && props.accent && !props.danger,
      'bg-red-500/80': !props.ghost && !props.accent && props.danger,
      'border-2 border-main-400/40': props.ghost && !props.accent && !props.danger,
      'border-2 border-accent-400/40': props.ghost && props.accent && !props.danger,
      'border-2 border-red-500': props.ghost && !props.accent && props.danger,
      'mouse:hover:border-transparent': props.ghost && !props.disabled,
      'text-main-400': props.disabled,
      '[&>*]:invisible': props.loading,
      'disabled:opacity-50': !props.loading
    }"
    :active-class="`border-transparent scale-75 motion-reduce:opacity-50
      before:scale-133 motion-reduce:before:opacity-50 `
        + (props.accent
          ? '!bg-accent-400/30'
          : props.danger
            ? '!bg-red-500/80'
            : '!bg-main-400/30')"
    :to="props.to"
    :disabled="props.disabled || props.loading"
    :tag="tag"
  >
    <div
      v-if="props.loading"
      class="!visible absolute inset-0 flex items-center justify-center"
      aria-label="Loading"
      role="status"
    >
      <SpinnerIcon
        class="w-6 h-6"
        :class="{
          'text-main-300': !props.accent && !props.danger,
          'text-accent-300': props.accent && !props.danger,
          'text-red-300': !props.accent && props.danger,
        }"
        aria-hidden="true"
      />
    </div>
    <slot />
  </BaseButton>
</template>
