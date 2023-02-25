import { debounce } from '@/utils/debounce';

export async function waitForChildWindowClose(
  childWindow: Window,
  abortSignal?: AbortSignal
): Promise<void> {
  return new Promise((resolve) => {
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
