/*
  VirtualKeyboardEvents

    This module provides a way to listen to virtual keyboard events. If the browser supports the
    VirtualKeyboard API, it will use that. Otherwise, it will use a fallback method that relies on
    resize events.

    `setupDefaultHandler` must be called before any listeners are added. This enables a default
    behavior that improves the user experience for every input field.

    This default behavior does the following:
    - Constrains the viewport height to the available space, to prevent the keyboard overlapping the
      content.
    - On Android it blurs the focus when the keyboard is hidden manually.

    When the default behavior is not desired, call `onChange` with a custom handler, and use
    `preventDefault` to disable the default behavior. Parts of the default behavior are exported
    to make it easier to override just what you need.

    TODO: the API needs to be improved, it's not very intuitive.

*/

import { isIos, isIpad } from '@/utils/iDeviceDetection';

declare global {
  interface VirtualKeyboard extends EventTarget {
    boundingRect: DOMRectReadOnly,
    overlaysContent: boolean,
    hide: () => void,
    show: () => void
  }

  interface Navigator {
    virtualKeyboard?: VirtualKeyboard
  }
}

export type VirtualKeyboardChangeEvent = {
  visible: boolean;
  keyboardHeight: number;
  viewportHeight: number;
  preventDefault: () => void;
};

type Listener = (event: VirtualKeyboardChangeEvent) => void;

const listeners: Set<Listener> = new Set();
let lastViewportHeight = 0;
const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
const safariMajorVersion = Number(navigator.userAgent.match(/Safari\/(\d+)/)?.[1] || '0');
const iosMagicOffsetNeeded = isIpad && safariMajorVersion < 605;

function setupDefaultHandler(defaultHandler = defaultChangeHandler) {
  if (navigator.virtualKeyboard) {
    const virtualKeyboard = navigator.virtualKeyboard;
    virtualKeyboard.overlaysContent = true;
    virtualKeyboard.addEventListener('geometrychange', (event: any) => {
      const keyboardHeight = event.target.boundingRect.height;
      const viewportHeight = window.innerHeight - keyboardHeight;
      // console.log('virtualKeyboard geometrychange', {
      //   keyboardHeight,
      //   viewportHeight,
      //   windowInnerHeight: window.innerHeight
      // });
      handleResizeAndGemetryChange(keyboardHeight, viewportHeight, defaultHandler);
    });
  } else if (window.visualViewport && isIos) {
    const visualViewport = window.visualViewport;
    visualViewport.addEventListener('resize', () => {
      if (!document.activeElement || !document.activeElement.matches(':focus')) {
        // Nothing is focused and iOS reports weird values for visualViewport.height, so we act like
        // the keyboard is hidden
        return handleResizeAndGemetryChange(0, window.innerHeight, defaultHandler);
      }
      // Weird way to compute the keyboard height on iOS...
      const keyboardHeight = window.innerHeight - visualViewport.height + visualViewport.offsetTop;
      const viewportHeight = visualViewport.height;
      // console.log('visualViewport resize', {
      //   keyboardHeight,
      //   viewportHeight,
      //   viewportOffsetTop: visualViewport.offsetTop,
      //   windowInnerHeight: window.innerHeight
      // });
      handleResizeAndGemetryChange(keyboardHeight, viewportHeight, defaultHandler);
    });
  }
}

function handleResizeAndGemetryChange(
  keyboardHeight: number,
  viewportHeight: number,
  defaultHandler: typeof defaultChangeHandler
) {
  const visible = keyboardHeight > 0;
  if (viewportHeight === lastViewportHeight) {
    lastViewportHeight = viewportHeight;
    return;
  }
  lastViewportHeight = viewportHeight;
  let defaultPrevented = false;

  function preventDefault() {
    defaultPrevented = true;
  }
  const changeEvent = {
    visible,
    keyboardHeight,
    viewportHeight,
    preventDefault
  };
  // console.log('virtual keyboard change', {
  //   visible: changeEvent.visible,
  //   keyboardHeight,
  //   viewportHeight,
  // });
  emit(changeEvent);
  if (!defaultPrevented) {
    defaultHandler(changeEvent);
  }
}

export function defaultChangeHandler(event: VirtualKeyboardChangeEvent) {
  if (event.visible) {
    handleShow(event);
  } else {
    handleHide(event);
  }
}

export function handleHide(event: VirtualKeyboardChangeEvent) {
  handleHideIos(event);
  handleHideNonIos(event);
}

export function handleShow(event: VirtualKeyboardChangeEvent) {
  handleShowIos(event);
  handleShowNonIos(event);
  handleShowFocus(event);
}

export function handleShowIos(event: VirtualKeyboardChangeEvent) {
  if (event.visible && isIos) {
    // console.log('handleShowIos');
    document.documentElement.scrollTop = -1;
    const resizeToHeight = isInstalled && isIpad
      ? event.viewportHeight - 1 - Number(iosMagicOffsetNeeded) * 24
        // 1px for a border above the keyboard
        // 24px magic offset to fix reported standalone safari viewport height on the iPad
      : event.viewportHeight - 1;
    document.documentElement.style.height = `${resizeToHeight}px`;
  }
}

export function handleShowNonIos(event: VirtualKeyboardChangeEvent) {
  if (event.visible && !isIos) {
    // console.log('handleShowNonIos');
    // a weird 2px offset is needed on Chrome Android
    document.documentElement.style.height = 'calc(100% - env(keyboard-inset-height, 0) - 2px)';
  }
}

export function handleShowFocus(event: VirtualKeyboardChangeEvent) {
  if (event.visible) {
    // console.log('handleShowFocus');
    document.activeElement?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }
}

export function handleHideIos(event: VirtualKeyboardChangeEvent) {
  if (!event.visible && isIos) {
    // console.log('handleHideIos');
    document.documentElement.style.height = '';
  }
}

export function handleHideNonIos(event: VirtualKeyboardChangeEvent) {
  if (!event.visible && !isIos) {
    // console.log('handleHideNonIos');
    // make sure the element is unfocused when the keyboard is hidden on Chrome Android
    document.documentElement.style.height = '';
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}

function emit(event: VirtualKeyboardChangeEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

function onChange(listener: Listener) {
  listeners.add(listener);
}

function off(listener: Listener) {
  listeners.delete(listener);
}

export const VirtualKeyboardEvents = {
  setupDefaultHandler,
  onChange,
  off
};
