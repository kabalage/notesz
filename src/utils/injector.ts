import {
  effectScope,
  inject,
  getCurrentScope,
  shallowRef,
  onScopeDispose,
  type EffectScope,
  type InjectionKey,
  type ShallowRef,
  type App
} from 'vue';

const injectorKey: InjectionKey<ReturnType<typeof createInjector>> = Symbol('Injector');

interface ServiceOptions {
  autoDispose?: boolean;
}

export function defineService<Service>(
  name: string,
  composable: () => Service,
  options: ServiceOptions = {}
): (() => Service) & { defer: () => ShallowRef<Service | undefined> } {

  const useService = () => {
    const injector = inject(injectorKey);
    if (!injector) {
      throw new Error('No injector found');
    }
    return injector.useService(name, composable, options);
  };

  /**
   * Returns a shallow ref that is populated with the service instance after the next tick.
   * This is useful to resolve circular dependencies.
   */
  useService.defer = () => {
    const injector = inject(injectorKey);
    if (!injector) {
      throw new Error('No injector found');
    }
    const result = shallowRef<Service>();
    const scope = getCurrentScope();
    setTimeout(() => {
      scope?.run(() => {
        result.value = injector.useService(name, composable, options);
      });
    });
    return result;
  };

  return useService;
}

// In DEV mode, we expose the services on the window object so they can be inspected in the console
declare global {
  interface Window {
    $svc: Record<string, unknown>;
  }
}

type ServiceState<Service> = {
  name: string;
  provider: () => Service;
  options: ServiceOptions;
  instance: Service;
  subscribers: number;
  autoDisposeTimeout?: number;
  scope: EffectScope;
}

export function createInjector() {
  const services = new Map<string, ServiceState<any>>();
  const provideInProgress = new Set<string>();

  if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => {
      for (const [name,] of services) {
        disposeService(name);
      }
    });
  }

  if (import.meta.env.DEV) {
    updateDevtools();
  }

  function updateDevtools() {
    if (import.meta.env.DEV) {
      window.$svc = Object.fromEntries(services);
    }
  }

  function disposeService(name: string) {
    const service = services.get(name);
    if (!service) {
      return;
    }
    console.log(`🧹 Disposing service: "${name}"`);
    services.delete(name);
    service.scope.stop();
    updateDevtools();
  }

  function useService<Service>(
    name: string,
    provider: () => Service,
    options: ServiceOptions
  ) {
    const existingService = services.get(name);
    if (existingService && existingService.provider !== provider) {
      throw new Error(`A different service provider for "${name}" already exists`);
    }
    const currentScope = getCurrentScope();
    if (!currentScope) {
      throw new Error('Must be called from within an effect scope');
    }
    if (existingService === undefined) {
      console.log(`🚀 Creating service: ${name}`);
      const circularDependency = provideInProgress.has(name);
      if (circularDependency) {
        throw new Error(`Circular dependency detected for service "${name}"`);
      }
      provideInProgress.add(name);
      const scope = effectScope(true);
      const instance = scope.run(provider) as Service;
      provideInProgress.delete(name);
      const service: ServiceState<Service> = {
        name,
        provider,
        options,
        instance,
        subscribers: 0,
        scope
      };
      services.set(name, service);
      updateDevtools();
    }
    const service = services.get(name)!;
    if (service.options.autoDispose) {
      service.subscribers += 1;
      console.log(`➕ Subscribing service: ${name} (${service.subscribers} subscribers)`);
      onScopeDispose(() => {
        const service = services.get(name);
        if (!service) {
          // HMR disposes every service before the component instances are disposed, so the service
          // may have already been disposed
          return;
        }
        service.subscribers -= 1;
        console.log(`➖ Unsubscribing service: ${name} (${service.subscribers} subscribers)`);
        window.clearTimeout(service.autoDisposeTimeout);
        if (service.subscribers <= 0) {
          // delay disposal to allow for re-subscription on UI navigation
          service.autoDisposeTimeout = window.setTimeout(() => {
            if (service.subscribers <= 0) {
              disposeService(name);
            }
          }, 1000);
        }
      });
    }
    return service.instance;
  }

  const injector = {
    install(app: App) {
      app.provide(injectorKey, injector);
    },
    useService
  };

  return injector;
}
