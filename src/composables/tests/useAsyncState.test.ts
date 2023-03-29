import { ref, nextTick } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { useAsyncState } from '../useAsyncState';

describe('useAsyncState with `get`', () => {

  it('should immediately get state with `get` and update status flags', async () => {
    const get = vi.fn(async () => {
      return { foo: 'bar' };
    });
    const resource = useAsyncState({
      get
    });
    expect(resource.data).toBeUndefined();
    expect(resource.isGetting).toBe(true);
    await flushPromises();
    expect(resource.data).toEqual({ foo: 'bar' });
    expect(resource.isGetting).toBe(false);
    expect(resource.isReady).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('should immediately get state with `get` and update status flags while using `watch`',
    async () => {
      const get = vi.fn(async () => {
        return { foo: 'bar' };
      });
      const resource = useAsyncState({
        watch() {
          return 1;
        },
        get
      });
      expect(resource.data).toBeUndefined();
      expect(resource.isGetting).toBe(true);
      await flushPromises();
      expect(resource.data).toEqual({ foo: 'bar' });
      expect(resource.isGetting).toBe(false);
      expect(resource.isReady).toBe(true);
      expect(get).toHaveBeenCalledTimes(1);
    }
  );

  it('should pass the `watch` value to `get`', async () => {
    const i = ref(0);
    const resource = useAsyncState({
      watch() {
        return i.value;
      },
      async get(params){
        return { foo: params };
      }
    });
    await flushPromises();
    expect(resource.data).toEqual({ foo: 0 });
    i.value++;
    expect(resource.isGetting).toBe(false);
    await nextTick();
    expect(resource.isGetting).toBe(true);
    await flushPromises();
    expect(resource.data).toEqual({ foo: 1 });
  });

  it('should refetch automatically when the `watch` value changes', async () => {
    const i = ref(0);
    const get = vi.fn(async (params) => {
      return { foo: params };
    });
    const resource = useAsyncState({
      watch() {
        return i.value;
      },
      get
    });
    await flushPromises();
    expect(resource.data).toEqual({ foo: 0 });
    expect(resource.isGetting).toBe(false);
    i.value++;
    expect(resource.isGetting).toBe(false);
    await nextTick();
    expect(resource.isGetting).toBe(true);
    await flushPromises();
    expect(resource.isGetting).toBe(false);
    expect(resource.data).toEqual({ foo: 1 });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('should refetch state with `refetch` and update status flags', async () => {
    let i = 0;
    const get = vi.fn(async () => {
      return { foo: i++ };
    });
    const resource = useAsyncState({
      get
    });
    await flushPromises();
    expect(resource.data).toEqual({ foo: 0 });
    expect(resource.isGetting).toBe(false);
    expect(resource.isReady).toBe(true);
    resource.refetch();
    expect(resource.data).toEqual({ foo: 0 });
    expect(resource.isGetting).toBe(true);
    expect(resource.isReady).toBe(true);
    await flushPromises();
    expect(resource.data).toEqual({ foo: 1 });
    expect(resource.isGetting).toBe(false);
    expect(resource.isReady).toBe(true);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('should pass `refetch` params to `get`', async () => {
    const resource = useAsyncState({
      async get(params) {
        return { foo: params };
      }
    });
    await flushPromises();
    expect(resource.data).toEqual({ foo: undefined });
    resource.refetch(1);
    await flushPromises();
    expect(resource.data).toEqual({ foo: 1 });
  });

  it('should resolve `refetch` promise when `get` is done', async () => {
    let refetchTime = 0;
    vi.useFakeTimers();
    const resource = useAsyncState({
      async get() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { time: Date.now() };
      }
    });
    vi.advanceTimersByTime(1000);
    await flushPromises();
    const refetchPromise = resource.refetch().then(() => {
      refetchTime = Date.now();
    });
    vi.advanceTimersByTime(1000);
    await flushPromises();
    expect(resource.data).toHaveProperty('time');
    expect(resource.data!.time).toBeTypeOf('number');
    const getTime = resource.data!.time;
    await refetchPromise;
    const timeDiff = refetchTime - getTime;
    // console.log('timeDiff', timeDiff);
    expect(timeDiff >= 0 && timeDiff < 10).toBe(true);
    vi.useRealTimers();
  });

  it('should set `error` when `get` throws', async () => {
    const get = vi.fn(async () => {
      throw new Error('foo');
    });
    const resource = useAsyncState({
      get
    });
    await flushPromises();
    expect(resource.error).toBeInstanceOf(Error);
    expect(resource.error!.message).toBe('foo');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('should infer `data` type from `get`', async () => {
    const resource = useAsyncState({
      async get() {
        return false;
      }
    });
    assertType<boolean | undefined>(resource.data);
  });

  it('should infer `refetch` params type from `get` params type', async () => {
    useAsyncState({
      watch() {
        return 1;
      },
      async get(params) {
        assertType<number | undefined>(params);
        return params;
      }
    });
  });

});

describe('useAsyncState with `get` and `put`', () => {

  it('should automatically `put` state when data changes and update status flags', async () => {
    let remoteValue = 'a';
    const get = vi.fn(async () => {
      return remoteValue;
    });
    const put = vi.fn(async (data) => {
      remoteValue = data;
    });
    const resource = useAsyncState({
      get,
      put
    });
    expect(resource.data).toBeUndefined();
    expect(resource.isGetting).toBe(true);
    await flushPromises();
    expect(resource.data).toEqual('a');
    expect(resource.isPutting).toBe(false);
    expect(resource.isReady).toBe(true);
    resource.data = 'b';
    await nextTick();
    expect(resource.data).toEqual('b');
    expect(resource.isPutting).toBe(true);
    expect(resource.isReady).toBe(true);
    await flushPromises();
    expect(resource.data).toEqual('b');
    expect(resource.isPutting).toBe(false);
    expect(resource.isReady).toBe(true);
    expect(remoteValue).toEqual('b');
    expect(get).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(1);
  });

  it('should queue `put` after `get`', async () => {
    let remoteValue = 'a';
    vi.useFakeTimers();
    const get = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return remoteValue;
    });
    const put = vi.fn(async (data) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      remoteValue = data;
    });
    const resource = useAsyncState({
      get,
      put
    });
    expect(resource.data).toBeUndefined();
    expect(resource.isGetting).toBe(true);
    vi.advanceTimersByTime(1000);
    await flushPromises();
    // initial get is done
    expect(resource.isGetting).toBe(false);

    // trigger a refetch and request a put during the get
    resource.refetch();
    await flushPromises();
    expect(resource.isGetting).toBe(true);
    vi.advanceTimersByTime(500);
    await flushPromises();
    resource.data = 'b';
    await nextTick();
    vi.advanceTimersByTime(500);
    await flushPromises();
    expect(resource.isGetting).toBe(false);
    expect(resource.isPutting).toBe(true);
    expect(resource.data).toEqual('b');
    expect(remoteValue).toEqual('a');
    // wait for the put to finish
    vi.advanceTimersByTime(1000);
    await flushPromises();
    expect(resource.isPutting).toBe(false);
    expect(resource.data).toEqual('b');
    expect(remoteValue).toBe('b');

    expect(get).toHaveBeenCalledTimes(2);
    expect(put).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('should queue `get` after `put`', async () => {
    let remoteValue = 'a';
    vi.useFakeTimers();
    const get = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return remoteValue;
    });
    const put = vi.fn(async (data) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      remoteValue = data;
    });
    const resource = useAsyncState({
      get,
      put
    });
    expect(resource.data).toBeUndefined();
    expect(resource.isGetting).toBe(true);
    vi.advanceTimersByTime(1000);
    await flushPromises();
    // initial get is done
    expect(resource.isGetting).toBe(false);

    // trigger a put and request a refetch during the put
    resource.data = 'b';
    await nextTick();
    vi.advanceTimersByTime(500);
    await flushPromises();
    resource.refetch();
    await flushPromises();
    expect(resource.isGetting).toBe(false);
    expect(resource.isPutting).toBe(true);
    vi.advanceTimersByTime(500);
    await flushPromises();
    // put is done and refetch is executed, but probably it won't change result in data change
    expect(resource.data).toEqual('b');
    expect(remoteValue).toEqual('b');
    expect(resource.isPutting).toBe(false);
    expect(resource.isGetting).toBe(true);
    await flushPromises();
    expect(resource.data).toEqual('b');
    expect(remoteValue).toEqual('b');

    expect(get).toHaveBeenCalledTimes(2);
    expect(put).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('should ignore automatic `put` during the initial `get`', async () => {
    let remoteValue = 'a';
    vi.useFakeTimers();
    const get = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return remoteValue;
    });
    const put = vi.fn(async (data) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      remoteValue = data;
    });
    const resource = useAsyncState({
      get,
      put
    });
    expect(resource.data).toBeUndefined();
    expect(resource.isGetting).toBe(true);
    vi.advanceTimersByTime(500);
    await flushPromises();
    resource.data = 'b';
    await nextTick();
    vi.advanceTimersByTime(500);
    await flushPromises();
    expect(resource.data).toEqual('a');
    expect(resource.isPutting).toBe(false);
    expect(resource.isReady).toBe(true);
    expect(remoteValue).toEqual('a');
    expect(get).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(0);
    vi.useRealTimers();
  });

  it('should throw when explicit `put` is requested during the initial `get`', async () => {
    let remoteValue = 'a';
    vi.useFakeTimers();
    const get = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return remoteValue;
    });
    const put = vi.fn(async (data) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      remoteValue = data;
    });
    const resource = useAsyncState({
      get,
      put
    });
    expect(resource.data).toBeUndefined();
    expect(resource.isGetting).toBe(true);
    vi.advanceTimersByTime(500);
    await flushPromises();
    await expect(() => resource.put('b')).rejects.toThrow();
    vi.advanceTimersByTime(500);
    await flushPromises();
    expect(resource.data).toEqual('a');
    vi.useRealTimers();
  });

  it('should throw when `put` is used but no `put` function is provided', async () => {
    const resource = useAsyncState({
      async get() {
        return 'a';
      }
    });
    await flushPromises();
    await expect(() => resource.put('b')).rejects.toThrow();
  });

  it('should throttle `put`', async () => {
    vi.useFakeTimers();
    let remoteValue = 'a';
    const get = vi.fn(async () => {
      return remoteValue;
    });
    const put = vi.fn(async (data) => {
      remoteValue = data;
    });
    const resource = useAsyncState({
      get,
      put,
      putThrottling: 1000
    });
    await flushPromises();
    resource.data = 'b';
    await nextTick();
    expect(resource.isPutting).toEqual(true);
    await flushPromises();
    expect(resource.isPutting).toEqual(false);
    expect(remoteValue).toEqual('b');
    resource.data = 'c';
    await nextTick();
    expect(resource.isPutting).toEqual(false);
    expect(remoteValue).toEqual('b');
    resource.data = 'd';
    await nextTick();
    expect(resource.isPutting).toEqual(false);
    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(resource.isPutting).toEqual(true);
    await flushPromises();
    expect(remoteValue).toEqual('d');
    expect(get).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should not throttle `put` when `putThrottling` is 0', async () => {
    vi.useFakeTimers();
    let remoteValue = 'a';
    const get = vi.fn(async () => {
      return remoteValue;
    });
    const put = vi.fn(async (data) => {
      remoteValue = data;
    });
    const resource = useAsyncState({
      get,
      put,
      putThrottling: 0
    });
    await flushPromises();
    resource.data = 'b';
    await nextTick();
    expect(resource.isPutting).toEqual(true);
    await flushPromises();
    expect(resource.isPutting).toEqual(false);
    expect(remoteValue).toEqual('b');
    resource.data = 'c';
    await nextTick();
    expect(resource.isPutting).toEqual(true);
    await flushPromises();
    expect(resource.isPutting).toEqual(false);
    expect(remoteValue).toEqual('c');
    expect(get).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should flush throttled `put` with `flushThrottledPut`', async () => {
    vi.useFakeTimers();
    let remoteValue = 'a';
    const get = vi.fn(async () => {
      return remoteValue;
    });
    const put = vi.fn(async (data) => {
      remoteValue = data;
    });
    const resource = useAsyncState({
      get,
      put,
      putThrottling: 1000
    });
    await flushPromises();
    resource.data = 'b';
    await nextTick();
    expect(resource.isPutting).toEqual(true);
    await flushPromises();
    expect(resource.isPutting).toEqual(false);
    expect(remoteValue).toEqual('b');
    resource.data = 'c';
    await nextTick();
    expect(resource.isPutting).toEqual(false); // it's throttled
    vi.advanceTimersByTime(200);
    await flushPromises();
    const flushTime = Date.now();
    await resource.flushThrottledPut();
    expect(Date.now() - flushTime).toBeLessThan(100);
    expect(resource.isPutting).toEqual(false);
    expect(remoteValue).toEqual('c');

    expect(get).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should resolve `flushThrottledPut` when there is no throttled `put`', async () => {
    vi.useFakeTimers();
    let remoteValue = 'a';
    const get = vi.fn(async () => {
      return remoteValue;
    });
    const put = vi.fn(async (data) => {
      remoteValue = data;
    });
    const resource = useAsyncState({
      get,
      put,
      putThrottling: 1000
    });
    await flushPromises();
    await resource.flushThrottledPut();
    expect(get).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(0);
    vi.useRealTimers();
  });

  it('should queue `put` requests', async () => {
    vi.useFakeTimers();
    let remoteValue = 'a';
    const get = vi.fn(async () => {
      return remoteValue;
    });
    const put = vi.fn(async (data) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      remoteValue = data;
    });
    const resource = useAsyncState({
      get,
      put,
      putThrottling: 0 // should try to put all changes
    });
    await flushPromises();
    resource.data = 'b';
    await nextTick();
    expect(resource.isPutting).toEqual(true);
    await flushPromises();
    expect(resource.isPutting).toEqual(true); // still putting because of timeout
    resource.data = 'c';
    await nextTick();
    await flushPromises();
    expect(remoteValue).toBe('a'); // still on the first put
    resource.data = 'd';
    await nextTick();
    await flushPromises();
    expect(remoteValue).toBe('a'); // still on the first put
    vi.advanceTimersByTime(1000);
    await flushPromises();
    expect(remoteValue).toBe('b'); // first put finished
    expect(resource.isPutting).toEqual(true); // 2nd put is skipped, last put is relevant
    vi.advanceTimersByTime(1000);
    await flushPromises();
    expect(remoteValue).toBe('d');
    expect(resource.isPutting).toEqual(false);

    expect(get).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should queue `get` requests', async () => {
    vi.useFakeTimers();
    let remoteValue = 0;
    const get = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return remoteValue++;
    });
    const resource = useAsyncState({
      get
    });
    vi.advanceTimersByTime(500);
    await flushPromises();
    expect(resource.data).toBeUndefined();
    expect(resource.isGetting).toEqual(true);
    resource.refetch();
    vi.advanceTimersByTime(500);
    await flushPromises();
    expect(resource.data).toEqual(0);
    expect(resource.isGetting).toEqual(true); // still getting because of refetch
    vi.advanceTimersByTime(1000);
    await flushPromises();
    expect(resource.data).toEqual(1);
    expect(resource.isGetting).toEqual(false);
    expect(get).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should infer `put` params type from the return type of `get`', async () => {
    let remoteData = { foo: 1 };
    const resource = useAsyncState({
      async get() {
        return remoteData;
      },
      put(data) {
        assertType<typeof remoteData>(data);
        remoteData = data;
      }
    });
    await flushPromises();
    resource.put({ foo: 2 });
    // @ts-expect-error wrong type
    resource.put({ bar: 2 });
  });

});
