<script setup lang="ts">
const props = defineProps<{
  darken?: boolean,
  modelValue: string
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>();

</script>

<template>
  <input
    class="rounded-lg text-white px-4 py-2 leading-normal disabled:opacity-50"
    :class="{
      [`bg-main-400/20 enabled:mouse:hover:bg-main-400/30 enabled:mouse:hover:focus:bg-main-400/20
      placeholder:text-main-200/60`]
        : !props.darken,
      [`bg-background/40 enabled:mouse:hover:bg-background/50
      enabled:mouse:hover:focus:bg-background/40 placeholder:text-main-200/60`]
        : props.darken
    }"
    :value="props.modelValue"
    spellcheck="false"
    autocapitalize="off"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
