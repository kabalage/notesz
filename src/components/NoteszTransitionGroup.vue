<script setup lang="ts">
import { ref, type ComponentPublicInstance, computed } from 'vue';
import { useSmoothResize } from '@/composables/useSmoothResize';

const rootNode = ref<ComponentPublicInstance | null>(null);

const parentElement = computed(() => {
  if (!rootNode.value) return null;
  if (rootNode.value.$el instanceof Text) {
    return rootNode.value.$el.parentElement;
  } else {
    return rootNode.value.$el;
  }
});
const props = withDefaults(defineProps<{
  resizeAnimationDuration?: number,
}>(), {
  resizeAnimationDuration: 300
});

useSmoothResize(parentElement, {
  animationDuration: props.resizeAnimationDuration
});

function onBeforeLeave(el: Element) {
  if (!(el instanceof HTMLElement)) {
    return;
  }
  Object.assign(el.style, {
    width: el.offsetWidth + 'px',
    height: el.offsetHeight + 'px',
    left: el.offsetLeft + 'px',
    top: el.offsetTop + 'px',
    margin: '0',
  });
}

</script>

<template>
  <TransitionGroup
    ref="rootNode"
    move-class="duration-300 transition-all ease-in-out motion-reduce:transition-none"
    enter-active-class="duration-300 delay-200 transition-all ease-in-out
      motion-reduce:transition-none"
    leave-active-class="duration-300 transition-all ease-in-out motion-reduce:transition-none
      !absolute"
    enter-from-class="opacity-0 transform scale-[0.95]"
    leave-to-class="opacity-0 transform scale-[0.95]"
    @before-leave="onBeforeLeave"
  >
    <slot />
  </TransitionGroup>
</template>
