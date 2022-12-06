import NoteszError from '@/utils/NoteszError';
import { reactive, toRaw, ref, type UnwrapRef, watch } from 'vue';

export default function useFromDb<T, WatchParams>({
  get,
  put,
  putThrottling = 1000,
  watchParams
}: {
  get: (params?: WatchParams) => Promise<T> | T,
  put?: ((data: UnwrapRef<T>) => any),
  watchParams?: () => WatchParams,
  putThrottling?: number
}) {
  const data = ref<T | undefined>(undefined);
  const isFetching = ref(false);
  const error = ref<NoteszError | undefined>(undefined);
  let updateWatchStopHandler: ReturnType<typeof watch> | undefined;
  let lastPutTime = 0;
  let putThrottlingTimer: ReturnType<typeof setTimeout> | undefined;
  let throttledPut: (() => any) | undefined;

  if (watchParams) {
    watch(watchParams, _get, {
      deep: true,
      immediate: true
    });
  } else {
    _get();
  }

  async function _get(params?: WatchParams) {
    // console.log('useFromDb _get');
    try {
      await flushThrottledPut();
      stopUpdateWatch();
      error.value = undefined;
      isFetching.value = true;
      data.value = await get(params) as UnwrapRef<T>;
    } catch(err) {
      if (err instanceof Error) {
        error.value = err as NoteszError;
      } else {
        error.value = new NoteszError('Failed to get resource', {
          cause: err
        });
      }
    } finally {
      isFetching.value = false;
      if (put && data.value !== undefined) {
        startUpdateWatch();
      }
    }
  }

  async function _put(newValue: UnwrapRef<T>) {
    if (!put) return;
    // console.log('useFromDb _put');
    lastPutTime = Date.now();
    error.value = undefined;
    try {
      await put(toRaw(newValue));
    } catch(err: any) {
      console.error('useFromDb put failed', err);
      error.value = err as Error;
    }
  }

  function startUpdateWatch() {
    // console.log('startUpdateWatch');
    if (!put) return;
    updateWatchStopHandler = watch(data, function updateWatchHandler(newValue) {
      if (newValue !== undefined && newValue !== null) {
        const elapsed = Date.now() - lastPutTime;

        if (putThrottlingTimer) {
          clearTimeout(putThrottlingTimer);
          putThrottlingTimer = undefined;
          throttledPut = undefined;
        }

        if (elapsed >= putThrottling) {
          _put(newValue);
        } else {
          throttledPut = () => _put(newValue);
          putThrottlingTimer = setTimeout(throttledPut, putThrottling - elapsed);
        }
      }
    }, {
      deep: true
    });
  }

  async function stopUpdateWatch() {
    // console.log('stopUpdateWatch');
    if (updateWatchStopHandler) {
      updateWatchStopHandler();
    }
    updateWatchStopHandler = undefined;
  }

  async function flushThrottledPut() {
    if (throttledPut) {
      const throttledPutCopy = throttledPut;
      throttledPut = undefined;
      await throttledPutCopy();
    }
  }

  return reactive({
    data,
    error,
    isFetching,
    refetch: _get,
    put: _put,
    flushThrottledPut
  });
}
