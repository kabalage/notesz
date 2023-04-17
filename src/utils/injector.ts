/*
  # Vue service injector

  A state management solution similar to Pinia, but with a twist of Angular's dependency injection
  built on top of Vue's `provide` and `inject` APIs.

  ## Notable features

  - Think of services as stores but they are available only to the component and its children where
    they are created with `provideServices` and its lifecycle is tied to the providing component's
    lifecycle. You may have multiple instances of a service with different parameters when they're
    provided in every component of a list for example. To provide a service to the whole app, you
    can use `provideServices` in the root component.
  - Services may depend on other services, and these are automatically injected into the service.
  - Services can be anything. They aren't restricted to be a collection of refs, computeds,
    and functions. Just return the thing you want when you define the service with `defineService`.
  - Services can be used with `useService` in any component where that service is available.
  - Supports circular dependencies with `useServiceDeferred`
  - During development, you can browse the available services in the browser console with
    `window.$services`.

  ## Example

  `@/services/ServiceA.ts`:
  ```ts
    import { reactive, ref, computed } from 'vue';
    import { defineService } from '@/utils/injector';
    import { ServiceB } from '@/services/ServiceB';

    export const ServiceA = defineService({
      name: 'ServiceA',
      dependencies: [ServiceB],
      setup({ serviceB }) {
        const foo = ref(0);
        const doubleFoo = computed(() => foo.value * 2);
        const doubleOther = computed(() => serviceB.foo * 2);

        return reactive({
          foo,
          doubleFoo,
          doubleOther
        });
      }
    });
  ```

  `App.vue`:
  ```ts
    import { ServiceA } from '@/services/ServiceA';
    import { ServiceB } from '@/services/ServiceB';
    import { ServiceC } from '@/services/ServiceC';
    import { ServiceD } from '@/services/ServiceD';
    import { provideServices, useService } from '@/utils/injector';

    const { serviceA } = provideServices([ServiceA, ServiceB, ServiceC, ServiceD]);
  ```

  `ChildView.vue`:
  ```ts
    import { ServiceA } from '@/services/ServiceA';
    import { useService } from '@/utils/injector';

    const serviceA = useService(ServiceA);
  ```

*/

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

const scheduler = typeof setImmediate === 'function' ? setImmediate : setTimeout;

type ExtendedComponentInternalInstance = {
  provides: Record<string | symbol, any>;
} & ComponentInternalInstance;

// In development mode, we expose the services on the window object so they can be inspected in
// the console.
declare global {
  interface Window {
    $svc: Record<string, unknown>;
  }
}

export type ServiceDefinition<
  Service, Name extends string,
  Dependencies extends readonly ServiceDefinition<any, string, readonly any[]>[]
> = {
  readonly name: Name;
  readonly dependencies: Dependencies;
  readonly setup: (dependencies: InjectResult<Dependencies>) => Service;
  readonly key: InjectionKey<Service>,
  readonly addInstanceToDevtools:
    (componentInstance: ExtendedComponentInternalInstance, serviceInstance: Service) => void,
  readonly removeInstanceFromDevtools:
    (componentInstance: ExtendedComponentInternalInstance) => void

};

export type ServiceInstance<S extends ServiceDefinition<any, string, readonly any[]>>
  = ReturnType<S['setup']>;

export type InjectResult<T extends readonly ServiceDefinition<any, string, readonly any[]>[]> = {
  [E in T[number] as Uncapitalize<E['name']>]: ReturnType<E['setup']>;
};

/**
 * Creates a service definition.
 *
 * @param options
 * @param options.name The name of the service.
 * @param options.dependencies An array of service definitions that this service depends on.
 * @param options.setup A factory function that should return the service instance. It receives an
 *   object with the dependencies as properties. The keys are the names of the dependencies
 *   uncapitalized. When the setup function is not defined inlined, you can use the `InjectResult`
 *   type to type the dependencies object.
 *   (e.g. `setup({ serviceA }: InjectResult<typeof depedencies>)`
 * @returns The service definition.
 */
export function defineService<
  Service, Name extends string,
  Dependencies extends readonly ServiceDefinition<any, string, readonly any[]>[]
>(options: {
  name: Name,
  dependencies?: Dependencies,
  setup: (dependencies: InjectResult<Dependencies>) => Service
}): ServiceDefinition<Service, Name, Dependencies> {
  const key = Symbol(options.name) as InjectionKey<Service>;
  const provides = new Map<ExtendedComponentInternalInstance, Service>();

  function addInstanceToDevtools(
    componentInstance: ExtendedComponentInternalInstance,
    serviceInstance: Service
  ) {
    provides.set(componentInstance, serviceInstance);
    updateDevtools();
  }

  function removeInstanceFromDevtools(
    componentInstance: ExtendedComponentInternalInstance
  ) {
    provides.delete(componentInstance);
    updateDevtools();
  }

  function updateDevtools() {
    if (!window.$svc) {
      window.$svc = {};
    }
    window.$svc[uncapitalize(options.name)] = provides.size > 1
      ? [...provides.entries()].map(([component, service]) => ({
        component,
        el: component.vnode.el,
        service
      }))
      : [...provides.values()][0];
  }

  return Object.freeze({
    name: options.name,
    dependencies: Object.freeze(options.dependencies || []  as unknown as Dependencies),
    setup: options.setup,
    key,
    addInstanceToDevtools,
    removeInstanceFromDevtools
  });
}

function uncapitalize(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Provides services in the current component that can be injected with `useService` in descendant
 * components.
 *
 * Like vue's `provide()`, this function must be called synchronously during a component's `setup()`
 * phase.
 *
 * @param serviceDefinitions An array of service definitions.
 * @returns An object with the service instances as properties. The keys are the names of the
 *  services uncapitalized.
 */
export function provideServices<
  ServiceDefinitions extends ServiceDefinition<any, string, readonly any[]>[]
>(serviceDefinitions: ServiceDefinitions) {
  const componentInstance = getCurrentInstance() as ExtendedComponentInternalInstance | null;
  if (!componentInstance) {
    throw new Error('Can only provide services inside setup()');
  }

  if (import.meta.env.DEV) {
    for (const serviceDefinition of serviceDefinitions) {
      if ((serviceDefinition.key as symbol) in componentInstance.provides) {
        console.warn(`Cannot provide a service "${serviceDefinition.name}" multiple times in the same component`);
      }
    }
  }

  const sortedServices = reverseTopologicalSort(
    serviceDefinitions,
    (serviceDefinition) => (serviceDefinition.dependencies || []),
    (serviceDefinition) => serviceDefinition.name
  );

  const serviceInstances = sortedServices.reduce((serviceInstances, serviceDefinition) => {
    // hasOwnPropery is not working it tests, because `provides` is created with Object.create(null)
    // at root level
    // https://github.com/vuejs/core/blob/3.2/packages/runtime-core/src/apiInject.ts#L23
    const parentComponentInstance
      = componentInstance.parent as ExtendedComponentInternalInstance | null;
    const serviceAlreadyProvidedInCurrentComponent =
      parentComponentInstance?.provides[serviceDefinition.key as symbol]
      !== componentInstance.provides[serviceDefinition.key as symbol];
    if (serviceAlreadyProvidedInCurrentComponent) {
      serviceInstances[uncapitalize(serviceDefinition.name)]
        = componentInstance.provides[serviceDefinition.key as symbol];
      return serviceInstances;
    }
    const dependencyInstances = serviceDefinition.dependencies.reduce((result, dependency) => {
      result[uncapitalize(dependency.name)] =
        injectFromComponentInstance(dependency, componentInstance);
      return result;
    }, {}) as InjectResult<typeof serviceDefinition.dependencies>;
    const serviceInstance = serviceDefinition.setup(dependencyInstances);
    if (import.meta.env.DEV) {
      console.log(`🚀 Creating service: ${serviceDefinition.name}`);
    }
    provide(serviceDefinition.key, serviceInstance);

    if (import.meta.env.DEV) {
      onMounted(() => serviceDefinition.addInstanceToDevtools(componentInstance, serviceInstance));
    }
    onScopeDispose(() => {
      if (import.meta.env.DEV) {
        console.log(`🧹 Disposing service: "${serviceDefinition.name}"`);
        serviceDefinition.removeInstanceFromDevtools(componentInstance);
      }
    });
    serviceInstances[uncapitalize(serviceDefinition.name)] = serviceInstance;
    return serviceInstances;
  }, {} as Record<string, unknown>);

  return serviceInstances as InjectResult<ServiceDefinitions>;
}

/**
 * Injects a service provided by the current component or an ancestor.
 *
 * Like vue's `inject()`, this function must be called synchronously during a component's `setup()`
 * phase. Note that this differs from vue's `inject`, as that only injects values provided by
 * ancestors.
 *
 * @param serviceDefinition
 * @returns The service instance.
 */
export function useService<
  Service, Name extends string,
  Dependencies extends readonly ServiceDefinition<any, string, readonly any[]>[]
>(serviceDefinition: ServiceDefinition<Service, Name, Dependencies>): Service {
  const componentInstance = getCurrentInstance() as ExtendedComponentInternalInstance | null;
  if (!componentInstance) {
    throw new Error('Can only use services inside setup()');
  }
  return injectFromComponentInstance(serviceDefinition, componentInstance);
}

/**
 * Injects a service that is not yet available, but will be available after the current component's
 * `setup` phase has finished has finished. Unlike `useService`, this function returns a `Ref` that
 * will be updated after the `setup()`.
 *
 * Like vue's `inject()`, this function must be called synchronously during a component's `setup()`
 * phase.
 *
 * @param loader A function that returns a promise that resolves to the service definition.
 * @returns A `Ref` to the service instance that will be set after the `setup()` phase has finished.
 *
 */
export function useServiceDeferred<
  Service, Name extends string,
  Dependencies extends readonly ServiceDefinition<any, string, readonly any[]>[]
>(
  loader: () => Promise<
    { default: ServiceDefinition<Service, Name, Dependencies> }
    | ServiceDefinition<Service, Name, Dependencies>
  >
): ShallowRef<Service | undefined> {
  const result = shallowRef<Service>();
  const componentInstance = getCurrentInstance() as ExtendedComponentInternalInstance | null;
  if (!componentInstance) {
    throw new Error('Can only use services inside setup()');
  }
  scheduler(async() => {
    const loadedModule = await loader();
    const serviceDefinition = 'default' in loadedModule ? loadedModule.default : loadedModule;
    result.value = injectFromComponentInstance(serviceDefinition, componentInstance);
  }, 0);
  return result;
}

function injectFromComponentInstance<
  Service, Name extends string,
  Dependencies extends readonly ServiceDefinition<any, string, readonly any[]>[]
>(
  serviceDefinition: ServiceDefinition<Service, Name, Dependencies>,
  componentInstance: ExtendedComponentInternalInstance
) {
  if (!((serviceDefinition.key as symbol) in componentInstance.provides)) {
    throw new Error(`Could not inject "${serviceDefinition.name}". You need to provide it before using it.`);
  }
  const instance = componentInstance.provides[serviceDefinition.key as symbol] as Service;
  return instance;
}

function reverseTopologicalSort<T>(
  elements: T[],
  getDependencies: (element: T) => readonly T[],
  getName: (element: T) => string
): T[] {
  const discovered = new Set<T>();
  // reverse topological ordering with depth first search
  // https://www.youtube.com/watch?v=yV8gPO5nTzQ&t=308s
  return elements.reduce((sorted, element) => {
    if (!discovered.has(element)) {
      return [...sorted, ...traverse(element)];
    } else {
      return sorted;
    }
  }, [] as T[]);

  function traverse(element: T, stack: T[] = []): T[] {
    discovered.add(element);
    const dependencies = getDependencies(element);
    const sorted = dependencies.reduce((sorted, dependency) => {
      if (elements.indexOf(dependency) >= 0 && !discovered.has(dependency)) {
        return [...sorted, ...traverse(dependency, [...stack, dependency])];
      } else {
        if (stack.indexOf(dependency) >= 0) {
          // This should never happen, because:
          // - Passing ServiceA to ServiceB in `dependencies` and vice versa is impossible
          // - Changing the `dependencies` in a ServiceDefinition after creation is not allowed
          throw new Error(`Circular dependency found: ${getName(element)} -> ${getName(dependency)}`);
        }
        return sorted;
      }
    }, [] as T[]);

    return [...sorted, element];
  }
}
