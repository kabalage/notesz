import {
  type MaybeComputedRef,
  type MaybeRef,
  resolveUnref,
  useEventListener,
  useResizeObserver,
  useMutationObserver,
  useMediaQuery
} from '@vueuse/core';
import { computed } from 'vue';

interface SmoothResizeOptions {
  animationDuration: MaybeRef<number>,
  watchParent: MaybeRef<boolean>
}

const defaultOptions: SmoothResizeOptions = {
  animationDuration: 300,
  watchParent: false
};

export function useSmoothResize(
  target: MaybeComputedRef<HTMLElement | null | undefined>,
  options: Partial<SmoothResizeOptions> = {}
) {
  const {
    animationDuration,
    watchParent
  } = {
    ...defaultOptions,
    ...options
  };

  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion)');

  let lastSize: ({ width: number, height: number } | null) = null;
  let animating = false;
  let lastMutationTime = 0;

  const mutationTarget = computed(() => {
    const targetEl = resolveUnref(target);
    if (!targetEl) return null;
    const parentEl = targetEl.parentElement;
    if (!parentEl) return null;
    if (resolveUnref(watchParent)) {
      return parentEl; // for flex children we need to observe the parent and siblings
    } else {
      return targetEl; // for non-flex children we observe the element and its children
    }
  });

  useMutationObserver(mutationTarget, (mutations) => {
    lastMutationTime = Date.now();
  }, {
    childList: true,
    attributes: true
  });

  useResizeObserver(target, (entries) => {
    if (animating) return;
    const el = entries[0].target as HTMLElement;
    const newSize = {
      height: entries[0].contentRect.height,
      width: entries[0].contentRect.width
    };
    if (!lastSize) {
      // initial call
      lastSize = newSize;
      return;
    }
    const elementSizeChanged = newSize.height !== lastSize.height
      || newSize.width !== lastSize.width;
    const mutationHappenedRecently = (Date.now() - lastMutationTime)
      < resolveUnref(animationDuration) + 100;
    // Only animate resize if the mutations happened recently. Viewport resizing will not trigger
    // animations.
    if (elementSizeChanged && mutationHappenedRecently && !prefersReducedMotion.value) {
      // Revert to the previous dimensions
      // console.log('resize detected: ', newSize, lastSize, entries[0].target, entries[0]);
      // console.log('setting size to: ', lastSize);
      animating = true;
      Object.assign(el.style, {
        width: lastSize.width + 'px',
        height: lastSize.height + 'px',
        transition: 'none',
        // If the element is a flex child, it should not grow or shrink during the animation.
        flex: 'none'
      });
      lastSize = newSize;
      requestAnimationFrame(() => {
        // After a render cycle, set the new size with a transition
        Object.assign(el.style, {
          width: newSize.width + 'px',
          height: newSize.height + 'px',
          transition: `all ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
        });
        // console.log('animating to target size: ', newSize, Date.now());
      });
    } else {
      // console.log('skip resize handling', newSize, lastSize, entries[0].target, entries[0]);
      lastSize = newSize;
    }
  }, {
    box: 'border-box'
  });

  useEventListener(target, 'transitionend', (event: TransitionEvent) => {
    const targetEl = resolveUnref(target);
    if (targetEl && animating && event.target === targetEl) {
      // console.log('transitionend', event.target);
      animating = false;
      Object.assign(targetEl.style, {
        width: '',
        height: '',
        transition: '',
        flex: ''
      });
    }
  });
}

export const vSmoothResize = {
  mounted(el: HTMLElement, binding: { value?: Partial<SmoothResizeOptions> }) {
    // console.log('vSmoothResize mounted', el);
    useSmoothResize(el, binding.value);
  }
};
