import { reactive, toRaw, ref, watch, type Ref } from 'vue';
import { trial } from '@/utils/trial';
import throttle from 'lodash-es/throttle';

type UseAsyncStateReturn<T, WatchParam = void> = {
  data: T | undefined
  error: Error | undefined
  isGetting: boolean
  isPutting: boolean
  isReady: boolean
  refetch: ((params?: WatchParam) => Promise<void>) | (() => Promise<void>)
  put: (newValue: T) => Promise<void>
  flushPut: () => Promise<void>
}
/**
 * A composable for asynchronous state management similar to `useAsyncState` in `vueuse`,
 * but it can:
 * - Persist changes to the data (that also supports throttling)
 * - Watch for arbitrary parameters and re-fetch the data when they change
 */
export function useAsyncState<T, WatchParam = void>(options: {
  watch: () => WatchParam,
  get: (params: WatchParam) => Promise<T> | T,
  put?: ((data: T) => any),
  putThrottling?: number
}): UseAsyncStateReturn<T, WatchParam> & { refetch: (params?: WatchParam) => Promise<void> }
export function useAsyncState<T, Q = any>(options: {
  get: ((params: Q) => Promise<T> | T),
  put?: ((data: T) => any),
  putThrottling?: number
}): UseAsyncStateReturn<T> & { refetch: (params: Q) => Promise<void> }
export function useAsyncState<T, WatchParam = void>({
  get,
  put,
  putThrottling = 0,
  watch: watchFn
}: {
  watch?: () => WatchParam,
  get: ((params?: WatchParam) => Promise<T> | T) | (() => Promise<T> | T) ,
  put?: ((data: T) => any),
  putThrottling?: number
}): UseAsyncStateReturn<T, WatchParam> {
  const data = ref(undefined) as Ref<T | undefined>;
  const lastData = ref(undefined) as Ref<T | undefined>;
  const isGetting = ref(false);
  const isPutting = ref(false);
  const isReady = ref(false);
  const error = ref<Error | undefined>(undefined);
  let updateWatchStopHandler: ReturnType<typeof watch> | undefined;
  let getQueued: {
    params: WatchParam | undefined
  } | undefined;
  let putQueued: {
    newValue: T
  } | undefined;
  let processPromise: Promise<void> = Promise.resolve();
  let isProcessing = false;

  const throttledQueuePut = throttle(queuePut, putThrottling);

  if (watchFn) {
    watch(watchFn, queueGet, {
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

  async function queuePut(newValue: T) {
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
      const newValue = await get(params);
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

  async function _put(newValue: T) {
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
        if (putThrottling) {
          throttledQueuePut(newValue);
        } else {
          queuePut(newValue);
        }
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

  async function flushPut() {
    const putPromise = throttledQueuePut.flush();
    if (putPromise) {
      return putPromise;
    }
    return processPromise;
  }

  async function refetch(params?: WatchParam) {
    if (!params && watchFn) {
      params = watchFn();
    }
    await queueGet(params);
  }

  return reactive({
    data,
    error,
    isGetting,
    isPutting,
    isReady,
    refetch,
    put: queuePut,
    flushPut,
  });
}
