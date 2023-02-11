import { ref } from 'vue';
import { tryOnScopeDispose, createSharedComposable } from '@vueuse/shared';
import virtualKeyboard from '@/utils/VirtualKeyboardEvents';
import type { VirtualKeyboardChangeEvent } from '@/utils/VirtualKeyboardEvents';

export default createSharedComposable(() => {
  const visible = ref(false);
  const keyboardHeight = ref(0);
  const viewportHeight = ref(window.visualViewport?.height || window.innerHeight);

  virtualKeyboard.onChange(handleChange);

  function handleChange(change: VirtualKeyboardChangeEvent) {
    visible.value = change.visible;
    keyboardHeight.value = change.keyboardHeight;
    viewportHeight.value = change.viewportHeight;
  }

  tryOnScopeDispose(() => {
    virtualKeyboard.off(handleChange);
  });

  return {
    visible,
    keyboardHeight,
    viewportHeight
  };
});
