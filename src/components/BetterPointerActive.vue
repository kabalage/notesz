<script setup lang="ts">
import { toRef, ref } from 'vue';
import { useBetterPointerActiveState } from '@/composables/useBetterPointerActiveState';
import { useIosPointerMoveCancelHack } from '@/composables/useIosPointerMoveCancelHack';

const props = withDefaults(defineProps<{
  tag?: string,
  disabled?: boolean,
  minActiveTime?: number,
  stopPointerEventPropagation?: boolean
}>(), {
  tag: 'div',
  minActiveTime: 200,
  disabled: false,
  stopPointerEventPropagation: true
});

const element = ref<HTMLElement | undefined>();

const iosCanceled = useIosPointerMoveCancelHack(element);
const active = useBetterPointerActiveState(
  element,
  {
    minActiveTime: toRef(props, 'minActiveTime'),
    disabled: toRef(props, 'disabled'),
    stopPropagation: toRef(props, 'stopPointerEventPropagation')
  }
);

</script>

<template>
  <component
    :is="props.tag"
    ref="element"
  >
    <slot :active="active && !iosCanceled" />
  </component>
</template>
