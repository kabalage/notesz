import { reactive, toRaw, ref, type UnwrapRef, watch } from 'vue';
import { trial } from '@/utils/trial';
import throttle from 'lodash-es/throttle';

export function useFromDb<T, WatchParam>({
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
  const isFetching = ref(false);
  const isPutting = ref(false);
  const isInitialized = ref(false);
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
    // console.log('useFromDb queueGet');
    getQueued = { params };
    if (isProcessing) {
      return processPromise;
    } else {
      processPromise = process();
      return processPromise;
    }
  }

  async function queuePut(newValue: UnwrapRef<T>) {
    // console.log('useFromDb queuePut');
    putQueued = { newValue };
    if (isProcessing) {
      return processPromise;
    } else {
      processPromise = process();
      return processPromise;
    }
  }

  async function process() {
    // console.log('useFromDb process');
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
    // console.log('useFromDb _get');
    const [, getError] = await trial(async () => {
      isFetching.value = true;
      error.value = undefined;
      const newValue = await get(params) as UnwrapRef<T>;
      stopUpdateWatch();
      data.value = newValue;
    });
    if (getError) {
      error.value = getError;
    } else {
      isInitialized.value = true;
    }
    isFetching.value = false;
    if (put && data.value !== undefined) {
      startUpdateWatch();
    }
  }

  async function _put(newValue: UnwrapRef<T>) {
    if (!put) return;
    // console.log('useFromDb _put');
    const [, putError] = await trial(async () => {
      isPutting.value = true;
      error.value = undefined;
      await put(toRaw(newValue));
    });
    if (putError) {
      error.value = putError;
    }
    isPutting.value = false;
  }

  function startUpdateWatch() {
    // console.log('useFromDb startUpdateWatch');
    if (!put) return;
    updateWatchStopHandler = watch(data, function updateWatchHandler(newValue) {
      if (newValue !== undefined && newValue !== null) {
        throttledQueuePut(newValue);
      }
    }, {
      deep: true
    });
  }

  async function stopUpdateWatch() {
    if (updateWatchStopHandler) {
      // console.log('useFromDb stopUpdateWatch');
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
    isFetching,
    isPutting,
    isInitialized,
    refetch: queueGet,
    put: queuePut,
    flushThrottledPut
  });
}
