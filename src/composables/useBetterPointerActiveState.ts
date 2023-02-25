import {
  type MaybeRef,
  type MaybeComputedRef,
  resolveUnref,
  useEventListener,
  tryOnScopeDispose
} from '@vueuse/core';
import { ref } from 'vue';

interface BetterPointerActiveStateOptions {
  minActiveTime: MaybeRef<number>,
  stopPropagation: MaybeRef<boolean>,
  disabled: MaybeRef<boolean>
}

const defaultOptions: BetterPointerActiveStateOptions = {
  minActiveTime: 200,
  stopPropagation: true,
  disabled: false
};

/**
 * Using the native `:active` state sometimes results in a too short feedback when the clicks/taps
 * are fast. This composable provides an `active` state for which a minimal time may be configured.
 * If not enough time passes between the pointerdown and pointerup events the active state persists
 * until the minimal time elapsed.
 */
export function useBetterPointerActiveState(
  target: MaybeComputedRef<EventTarget | null | undefined>,
  options: Partial<BetterPointerActiveStateOptions> = {}
) {
  const {
    minActiveTime,
    stopPropagation,
    disabled
  } = {
    ...defaultOptions,
    ...options
  };
  const active = ref(false);
  let activeEndTimeout: ReturnType<typeof setTimeout> | undefined;
  let pointerDownTime = 0;
  let eventListenerCleanups: Array<ReturnType<typeof useEventListener>> = [];

  useEventListener(target, 'pointerdown', handlePointerDown);
  tryOnScopeDispose(() => removeEventListeners());

  function handlePointerDown(event: PointerEvent) {
    if (resolveUnref(disabled)) {
      return;
    }
    // console.log('pointerdown', event);
    if (resolveUnref(stopPropagation)) {
      event.stopPropagation();
    }
    if (activeEndTimeout) {
      clearTimeout(activeEndTimeout);
      activeEndTimeout = undefined;
    }
    pointerDownTime = Date.now();
    active.value = true;
    addEventListeners();
    // console.log('active true');
  }

  function addEventListeners() {
    // handles unmounts and target.value changes
    eventListenerCleanups = [
      useEventListener(target, 'pointerleave', handlePointerLeave),
      useEventListener(target, 'pointerup', handlePointerUp),
      useEventListener(target, 'pointercancel', handlePointerCancel)
    ];
  }

  function removeEventListeners() {
    eventListenerCleanups.forEach((cleanup) => cleanup());
    eventListenerCleanups = [];
  }

  function handlePointerCancel() {
    // console.log('pointercancel');
    active.value = false;
    removeEventListeners();
  }

  function handlePointerLeave() {
    // console.log('pointerleave');
    active.value = false;
    removeEventListeners();
    // console.log('active false');
  }

  function handlePointerUp() {
    // console.log('pointerup', {
    //   active: active.value
    // });
    removeEventListeners();
    if (!active.value) {
      return;
    }
    const activeTime = Date.now() - pointerDownTime;
    const activeTimeLeft = resolveUnref(minActiveTime) - activeTime;
    if (activeTimeLeft <= 0) {
      active.value = false;
      // console.log('active false');
    } else {
      // console.log('activeTimeLeft', resolveUnref(minActiveTime), activeTimeLeft);
      activeEndTimeout = setTimeout(() => {
        active.value = false;
        activeEndTimeout = undefined;
        // console.log('active false');
      }, activeTimeLeft);
    }
  }

  return active;
}
