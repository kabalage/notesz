import { ref } from 'vue';
import { tryOnScopeDispose, createSharedComposable } from '@vueuse/core';
import {
  VirtualKeyboardEvents,
  type VirtualKeyboardChangeEvent
} from '@/utils/VirtualKeyboardEvents';

export default createSharedComposable(() => {
  const visible = ref(false);
  const keyboardHeight = ref(0);
  const viewportHeight = ref(window.visualViewport?.height || window.innerHeight);

  VirtualKeyboardEvents.onChange(handleChange);

  function handleChange(change: VirtualKeyboardChangeEvent) {
    visible.value = change.visible;
    keyboardHeight.value = change.keyboardHeight;
    viewportHeight.value = change.viewportHeight;
  }

  tryOnScopeDispose(() => {
    VirtualKeyboardEvents.off(handleChange);
  });

  return {
    visible,
    keyboardHeight,
    viewportHeight
  };
});
