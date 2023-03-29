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
