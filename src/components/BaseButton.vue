<script setup lang="ts">
import { useAttrs, computed, toRef, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useBetterPointerActiveState } from '@/composables/useBetterPointerActiveState';
import { useIosPointerMoveCancelHack } from '@/composables/useIosPointerMoveCancelHack';

const props = withDefaults(defineProps<{
  to?: string | object,
  disabled?: boolean,
  activeClass?: string,
  minActiveTime?: number,
  tag?: string
}>(), {
  activeClass: '',
  minActiveTime: 200
});

const attrs = useAttrs();

const element = ref<HTMLElement | undefined>();

const iosCanceled = useIosPointerMoveCancelHack(element);
const active = useBetterPointerActiveState(
  element,
  {
    minActiveTime: toRef(props, 'minActiveTime')
  }
);

const type = computed(() => {
  if (props.tag) {
    return props.tag;
  } else if (props.disabled) {
    return 'button';
  } else if (props.to) {
    return RouterLink;
  } else if (attrs.href) {
    return 'a';
  }
  return 'button';
});

</script>

<template>
  <component
    ref="element"
    :is="type"
    :class="{
      [activeClass]: active && !iosCanceled
    }"
    :to="props.to"
    :disabled="props.disabled"
  >
    <slot :active="active && !iosCanceled" />
  </component>
</template>
