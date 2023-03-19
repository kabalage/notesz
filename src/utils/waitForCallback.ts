import { trial } from '@/utils/trial';
import type { createMessageBus } from '@/utils/createMessageBus';
import { waitForChildWindowClose } from '@/utils/waitForChildWindowClose';

// TODO needs more constraints
interface CallbackData {
  type: string;
  params: any;
}

export async function waitForCallback<T extends {
  'callback': CallbackData
}>(
  type: string,
  childWindow: Window,
  messageBus: ReturnType<typeof createMessageBus<T>>
): Promise<{ canceled: boolean, params?: any }> {
  return new Promise((resolve) => {
    // console.log('waitForCallback', type);
    updatePendingCallbacks((pendingCallbacks) => {
      pendingCallbacks[type] = true;
      return pendingCallbacks;
    });
    const windowCloseWaitAbortController = new AbortController();
    waitForChildWindowClose(childWindow, windowCloseWaitAbortController.signal)
      .then(onChildWindowClose);

    messageBus.on('callback', onCallback);

    function onCallback(callbackMsg: CallbackData) {
      // console.log('callbackHandler', callbackMsg);
      if (callbackMsg.type === type) {
        cleanUp();
        resolve({
          params: callbackMsg.params,
          canceled: false
        });
      }
    }

    function onChildWindowClose() {
      if (windowCloseWaitAbortController.signal.aborted) {
        return;
      }
      // console.log('onChildWindowClose');
      cleanUp();
      resolve({
        canceled: true
      });
    }

    function cleanUp() {
      // console.log('cleanUp');
      windowCloseWaitAbortController.abort();
      messageBus.off('callback', onCallback);
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
