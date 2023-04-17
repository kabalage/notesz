import { debounce } from '@/utils/debounce';

/**
 * Waits for a child window to be closed.
 * Can be aborted by passing an AbortSignal.
 *
 * @param childWindow
 * @param abortSignal
 */
export async function waitForChildWindowClose(
  childWindow: Window,
  abortSignal?: AbortSignal
): Promise<void> {
  return new Promise((resolve) => {
    // TODO check if this can be lower, the debounce was needed because of the focus event
    // being triggered multiple times when the window is closed
    const debouncedFocusHandler = debounce(focusHandler, 500);
    window.addEventListener('focus', debouncedFocusHandler);
    const interval = setInterval(handleWindowClosed, 1000);
    if (abortSignal) {
      abortSignal.addEventListener('abort', onAbort);
    }

    function focusHandler() {
      // console.log('focusHandler', event);
      handleWindowClosed();
    }

    function handleWindowClosed() {
      // console.log('childWindow.closed', childWindow.closed);
      if (childWindow.closed) {
        cleanUp();
        resolve();
      }
    }

    function onAbort() {
      cleanUp();
      resolve();
    }

    function cleanUp() {
      // console.log('cleanUp');
      debouncedFocusHandler.cancel();
      clearInterval(interval);
      window.removeEventListener('focus', debouncedFocusHandler);
      if (abortSignal) {
        abortSignal.removeEventListener('abort', onAbort);
      }
    }
  });
}
