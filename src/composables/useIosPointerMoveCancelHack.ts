import {
  type MaybeComputedRef,
  useEventListener,
  tryOnScopeDispose
} from '@vueuse/core';
import { ref } from 'vue';
import { isIos } from '@/utils/iDeviceDetection';

/**
 * On iOS moving your finger after pressing down on an element does not always emit pointercancel
 * and surprisingly a click event is emitted when releasing the touch even after the pointer left
 * the element. This composable rejects the clicks that would happen after moving your finger while
 * touching the element.
 */
export default function useIosPointerMoveCancelHack(
  target: MaybeComputedRef<EventTarget | null | undefined>
) {
  const active = ref(false);
  const canceled = ref(false);
  let pointerDownClientX = 0;
  let pointerDownClientY = 0;
  const touchMoveJitterAllowed = 20;
  let eventListenerCleanups: Array<ReturnType<typeof useEventListener>> = [];

  if (isIos) {
    useEventListener(target, 'pointerdown', handlePointerDown);
    tryOnScopeDispose(() => removeEventListeners());
  }

  function handlePointerDown(event: PointerEvent) {
    // console.log('-----------------------');
    // console.log('pointerdown');
    pointerDownClientX = event.clientX;
    pointerDownClientY = event.clientY;
    active.value = true;
    removeEventListeners(); // rarely pointercancel is not called and event handlers get stuck
    addEventListeners();
    // console.log('active true');
  }

  function addEventListeners() {
    // console.log('addEventListeners');
    eventListenerCleanups = [
      useEventListener(target, 'pointermove', handlePointerMove),
      useEventListener(target, 'pointercancel', handlePointerCancel),
      useEventListener(target, 'click', handleClick, { capture: true }),
    ];
  }

  function removeEventListeners() {
    // console.log('removeEventListeners');
    eventListenerCleanups.forEach((cleanup) => cleanup());
    eventListenerCleanups = [];
  }

  function handlePointerMove(event: PointerEvent) {
    // console.log('pointermove', event);
    if (active.value && (Math.abs(pointerDownClientX - event.clientX) > touchMoveJitterAllowed
        || Math.abs(pointerDownClientY - event.clientY) > touchMoveJitterAllowed)
    ) {
      active.value = false;
      canceled.value = true;
      // console.log('active false');
    }
  }

  function handlePointerCancel() {
    // console.log('pointercancel');
    active.value = false;
    canceled.value = false;
    removeEventListeners();
  }

  function handleClick(event: MouseEvent) {
    // console.log('click');
    if (!active.value) {
      event.preventDefault();
      event.stopImmediatePropagation();
    } else {
      active.value = false;
    }
    canceled.value = false;
    removeEventListeners();
  }

  return canceled;
}
