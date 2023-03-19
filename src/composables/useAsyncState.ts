import { reactive, toRaw, ref, type UnwrapRef, watch } from 'vue';
import { trial } from '@/utils/trial';
import throttle from 'lodash-es/throttle';

export function useAsyncState<T, WatchParam>({
  get,
  put,
  putThrottling = 1000,
  watch: watchParam
}: {
  get: (params?: WatchParam) => Promise<T> | T,
  put?: ((data: UnwrapRef<T>) => any),
  watch?: () => WatchParam,
  putThrottling?: number
}) {
  const data = ref<T | undefined>(undefined);
  const lastData = ref<T | undefined>(undefined);
  const isGetting = ref(false);
  const isPutting = ref(false);
  const isReady = ref(false);
  const error = ref<Error | undefined>(undefined);
  let updateWatchStopHandler: ReturnType<typeof watch> | undefined;
  let getQueued: {
    params: WatchParam | undefined
  } | undefined;
  let putQueued: {
    newValue: UnwrapRef<T>
  } | undefined;
  let processPromise: Promise<void> = Promise.resolve();
  let isProcessing = false;

  const throttledQueuePut = throttle(queuePut, putThrottling);

  if (watchParam) {
    watch(watchParam, queueGet, {
      immediate: true
    });
  } else {
    queueGet();
  }

  async function queueGet(params?: WatchParam) {
    // console.log('useAsyncState queueGet');
    getQueued = { params };
    if (isProcessing) {
      return processPromise;
    } else {
      processPromise = process();
      return processPromise;
    }
  }

  async function queuePut(newValue: UnwrapRef<T>) {
    // console.log('useAsyncState queuePut');
    if (!put) throw new Error('No put function provided');
    if (!isReady.value) throw new Error('Cannot put before inital get finishes');
    putQueued = { newValue };
    if (isProcessing) {
      return processPromise;
    } else {
      processPromise = process();
      return processPromise;
    }
  }

  async function process() {
    // console.log('useAsyncState process');
    isProcessing = true;
    while (getQueued || putQueued) {
      if (putQueued) {
        const newValue = putQueued.newValue;
        putQueued = undefined;
        await _put(newValue);
      }
      if (getQueued) {
        const params = getQueued.params;
        getQueued = undefined;
        await _get(params);
      }
    }
    isProcessing = false;
  }

  async function _get(params?: WatchParam) {
    // console.log('useAsyncState _get');
    const [, getError] = await trial(async () => {
      isGetting.value = true;
      error.value = undefined;
      const newValue = await get(params) as UnwrapRef<T>;
      stopUpdateWatch();
      lastData.value = newValue;
      if (!putQueued) {
        // don't update data if in the meantime a put has been queued
        data.value = structuredClone(newValue);
      }
    });
    if (getError) {
      error.value = getError;
    } else {
      isReady.value = true;
    }
    isGetting.value = false;
    if (put) {
      startUpdateWatch();
    }
  }

  async function _put(newValue: UnwrapRef<T>) {
    if (!put) return;
    // console.log('useAsyncState _put');
    const [, putError] = await trial(async () => {
      isPutting.value = true;
      error.value = undefined;
      await put(toRaw(newValue));
    });
    if (putError) {
      error.value = putError;
      stopUpdateWatch();
      data.value = lastData.value;
      startUpdateWatch();
    }
    isPutting.value = false;
  }

  function startUpdateWatch() {
    // console.log('useAsyncState startUpdateWatch');
    if (!put) return;
    updateWatchStopHandler = watch(data, function updateWatchHandler(newValue) {
      if (newValue !== undefined && newValue !== null) {
        // console.log('useAsyncState updateWatchHandler', newValue);
        throttledQueuePut(newValue);
      }
    }, {
      deep: true
    });
  }

  async function stopUpdateWatch() {
    if (updateWatchStopHandler) {
      // console.log('useAsyncState stopUpdateWatch');
      updateWatchStopHandler();
      updateWatchStopHandler = undefined;
    }
  }

  async function flushThrottledPut() {
    const putPromise = throttledQueuePut.flush();
    if (putPromise) {
      return putPromise;
    }
    return processPromise;
  }

  return reactive({
    data,
    error,
    isGetting,
    isPutting,
    isReady,
    refetch: queueGet,
    put: queuePut,
    flushThrottledPut
  });
}
