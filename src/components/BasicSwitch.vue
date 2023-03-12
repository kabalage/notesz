<script setup lang="ts">
import BaseButton from './BaseButton.vue';

const props = withDefaults(defineProps<{
  modelValue?: boolean,
  labelId?: string,
  id?: string
}>(), {
  id() {
    return Math.random().toString().slice(2);
  }
});

</script>

<template>
  <BaseButton
    :id="id"
    :class="props.modelValue
      ? 'bg-accent-400 [&:disabled>span]:opacity-75 ring-offset-2'
      : 'bg-main-400/40 [&:disabled>span]:opacity-25'"
    class="relative inline-flex h-8 w-16 items-center rounded-full
      ring-offset-background disabled:opacity-50"
    role="switch"
    :aria-checked="String(props.modelValue)"
    :aria-labelledby="`${props.labelId || ''} value-${props.id}`"
    @click="$emit('update:modelValue', !props.modelValue)"
  >
    <span

      class="inline-block h-6 w-6 transform rounded-full bg-white transition ease-in-out
        duration-200 motion-reduce:transition-none"
      :class="{
        'translate-x-9 shadow-sm shadow-accent-800/40': props.modelValue,
        'translate-x-1 shadow-none': !props.modelValue
      }"
      aria-hidden="true"
    />
    <span hidden :id="`value-${props.id}`">
      {{ props.modelValue ? 'On' : 'Off' }}
    </span>
  </BaseButton>
</template>
