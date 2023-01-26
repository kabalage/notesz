import debounce from '@/utils/debounce';

export default async function waitForChildWindowClose(
  childWindow: Window
): Promise<void> {
  return new Promise((resolve) => {
    const debouncedFocusHandler = debounce(focusHandler, 500);
    window.addEventListener('focus', debouncedFocusHandler);
    const interval = setInterval(handleWindowClosed, 1000);

    function focusHandler(event: FocusEvent) {
      console.log('focusHandler', event);
      handleWindowClosed();
    }

    function handleWindowClosed() {
      console.log('childWindow.closed', childWindow.closed);
      if (childWindow.closed) {
        cleanUp();
        resolve();
      }
    }

    function cleanUp() {
      debouncedFocusHandler.cancel();
      clearInterval(interval);
      window.removeEventListener('focus', debouncedFocusHandler);
    }
  });
}
