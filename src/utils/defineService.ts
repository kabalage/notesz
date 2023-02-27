import {
  provide,
  getCurrentInstance,
  shallowRef,
  onScopeDispose,
  onMounted,
  type ShallowRef,
  type InjectionKey,
  type ComponentInternalInstance
} from 'vue';

type ExtendedComponentInternalInstance = {
  provides: Record<string | symbol, any>;
} & ComponentInternalInstance;

// In development mode, we expose the services on the window object so they can be inspected in
// the console.
declare global {
  interface Window {
    $services: Record<string, unknown>;
  }
}

/**
 * Creates global state that can be injected into components.
 * (It's based on https://vueuse.org/createInjectionState)
 *
 * Differences:
 * - While vue's `inject()` only injects the provided values from the parents, this utility allows
 *   you to inject from the same component level. Keep in mind that the order of the `useService()`
 *   calls is important.
 * - Provided values are exposed with `window.$services` in development mode.
 * - Allows deferred injection with `useService.defer()` to resolve circular dependencies.
 */
export function defineService<Arguments extends Array<any>, Service>(
  name: string,
  composable: (...args: Arguments) => Service,
): readonly [
  provideService: (...args: Arguments) => Service,
  useService: (() => Service) & { defer: () => ShallowRef<Service | undefined> }
] {
  const key: string | InjectionKey<Service> = Symbol(name);
  const provides = new Map<ExtendedComponentInternalInstance, Service>();

  function provideService(...args: Arguments) {
    const componentInstance = getCurrentInstance() as ExtendedComponentInternalInstance | null;
    if (!componentInstance) {
      throw new Error('Can only provide services inside setup()');
    }
    const serviceInstance = composable(...args);
    console.log(`🚀 Creating service: ${name}`);
    provide(key, serviceInstance);

    if (import.meta.env.DEV) {
      onMounted(() => addToDevtools(componentInstance, serviceInstance));
    }
    onScopeDispose(() => {
      console.log(`🧹 Disposing service: "${name}"`);
      if (import.meta.env.DEV) {
        removeFromDevtools(componentInstance);
      }
    });
    return serviceInstance;
  }

  function useService() {
    const componentInstance = getCurrentInstance() as ExtendedComponentInternalInstance | null;
    if (!componentInstance) {
      throw new Error('Can only use services inside setup()');
    }
    return _inject(componentInstance);
  }

  /**
   * Returns a shallow ref that is populated with the service instance on the next tick.
   * This is useful to resolve circular dependencies.
   */
  useService.defer = () => {
    const result = shallowRef<Service>();
    const componentInstance = getCurrentInstance() as ExtendedComponentInternalInstance | null;
    if (!componentInstance) {
      throw new Error('Can only use services inside setup()');
    }
    setTimeout(() => {
      result.value = _inject(componentInstance);
    }, 0);
    return result;
  };

  function _inject(componentInstance: ExtendedComponentInternalInstance) {
    const instance = componentInstance.provides[key as symbol] as Service | undefined;
    if (instance === undefined) {
      throw new Error(`Could not inject "${name}". You need to provide it before using it.`);
    }
    return instance;
  }

  function addToDevtools(
    componentInstance: ExtendedComponentInternalInstance,
    serviceInstance: Service
  ) {
    provides.set(componentInstance, serviceInstance);
    updateDevtools();
  }

  function removeFromDevtools(
    componentInstance: ExtendedComponentInternalInstance
  ) {
    provides.delete(componentInstance);
    updateDevtools();
  }

  function updateDevtools() {
    if (!window.$services) {
      window.$services = {};
    }
    window.$services[name] = provides.size > 1
      ? [...provides.entries()].map(([component, service]) => ({
        component,
        el: component.vnode.el,
        service
      }))
      : [...provides.values()][0];
  }

  return [provideService, useService];
}
