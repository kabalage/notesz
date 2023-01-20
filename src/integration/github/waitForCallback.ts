import debounce from '@/utils/debounce';
import trial from '@/utils/trial';

export default async function waitForCallback(
  type: string,
  childWindow: Window
): Promise<{ canceled: boolean, params?: any }> {
  return new Promise((resolve) => {
    console.log('waitForCallback', type);
    updatePendingCallbacks((pendingCallbacks) => {
      pendingCallbacks[type] = true;
      return pendingCallbacks;
    });
    const debouncedFocusHandler = debounce(focusHandler, 500);
    window.addEventListener('storage', storageHandler);
    window.addEventListener('focus', debouncedFocusHandler);

    function storageHandler(event: StorageEvent) {
      console.log('storage', event, localStorage.tabMessage);
      if (event.key === 'tabMessage' && event.newValue) {
        const message = JSON.parse(localStorage.tabMessage);
        console.log('tabMessage', message);
        if (message?.type === 'callback' && message?.callback === type) {
          cleanUp();
          resolve({
            params: message.params,
            canceled: false
          });
        }
      }
    }

    function focusHandler(event: FocusEvent) {
      console.log('focusHandler', event);
      console.log('childWindow.closed', childWindow.closed);
      if (childWindow.closed) {
        cleanUp();
        resolve({
          canceled: true
        });
      }
    }

    function cleanUp() {
      debouncedFocusHandler.cancel();
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('focus', debouncedFocusHandler);
      updatePendingCallbacks((pendingCallbacks) => {
        delete pendingCallbacks[type];
        return pendingCallbacks;
      });
    }
  });
}

export function getPendingCallbacks() {
  const pendingCallbacks = localStorage.pendingCallbacks;
  if (!pendingCallbacks) {
    return {};
  }
  const [parsedPendingCallbacks, parseError] = trial(() => {
    return JSON.parse(pendingCallbacks) as unknown;
  });
  if (parseError) {
    console.error(parseError);
    return {};
  }
  if (typeof parsedPendingCallbacks !== 'object'
    || Array.isArray(parsedPendingCallbacks)
    || parsedPendingCallbacks === null) {
    return {};
  }
  return parsedPendingCallbacks as Record<string, boolean>;
}

function updatePendingCallbacks(
  updater: (pendingCallbacks: Record<string, boolean>) => (Record<string, boolean> | undefined)
) {
  const pendingCallbacks = getPendingCallbacks();
  const newValue = updater(pendingCallbacks);
  if (newValue) {
    localStorage.pendingCallbacks = JSON.stringify(pendingCallbacks);
  }
}
