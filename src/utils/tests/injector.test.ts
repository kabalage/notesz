import { defineService, useService, useServiceDeferred, provideServices } from '@/utils/injector';
import { defineComponent, computed, reactive, ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

describe('injector', () => {

  const ServiceA = defineService({
    name: 'ServiceA',
    setup() {
      return {
        foo: 1
      };
    }
  });

  const ServiceB = defineService({
    name: 'ServiceB',
    dependencies: [ServiceA],
    setup({ serviceA }) {
      return reactive({
        foo: computed(() => serviceA.foo * 2)
      });
    }
  });

  const ServiceC = defineService({
    name: 'ServiceC',
    dependencies: [ServiceB],
    setup({ serviceB }) {
      return reactive({
        foo: computed(() => serviceB.foo * 2)
      });
    }
  });

  describe('defineService', () => {

    it('should throw both compilation and runtime errors when trying to modify a service', () => {
      const Service = defineService({
        name: 'Service',
        setup() {
          return {
            foo: 1
          };
        }
      });

      expect(() =>
        // @ts-expect-error changing not allowed
        Service.name = 'Service2'
      ).toThrow();
      expect(() =>
        // @ts-expect-error changing not allowed
        Service.setup = () => ({ foo: 2 })
      ).toThrow();
      expect(() =>
        // @ts-expect-error changing not allowed
        Service.dependencies = []
      ).toThrow();
      expect(() =>
        // @ts-expect-error changing not allowed
        Service.dependencies.push(Service)
      ).toThrow();

    });

  });

  describe('provideServices', () => {

    it('should throw an error when trying to use a service outside of setup', () => {
      expect(() => provideServices([ServiceA, ServiceB, ServiceC])).toThrow();
    });

    it('should provide services return them with uncapitalized names', async () => {
      const TestComponent = defineComponent({
        template: '<div></div>',
        setup() {
          return provideServices([ServiceA, ServiceB]);
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      expect(wrapper.vm.serviceA.foo).toBe(1);
      expect(wrapper.vm.serviceB.foo).toBe(2);
      wrapper.unmount();
    });

    it('should should figure out the order to instantiate services', async () => {
      const TestComponent = defineComponent({
        template: '<div></div>',
        setup() {
          return provideServices([ServiceA, ServiceB, ServiceC]);
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      expect(wrapper.vm.serviceA.foo).toBe(1);
      expect(wrapper.vm.serviceB.foo).toBe(2);
      expect(wrapper.vm.serviceC.foo).toBe(4);
      wrapper.unmount();
    });

    // eslint-disable-next-line max-len
    it('should provide the same service in the same component only once even if requested multiple times (same call)', async () => {
      const SpiedService = defineService({
        name: 'SpiedService',
        setup: vi.fn(() => {
          return {
            foo: 1
          };
        })
      });

      const TestComponent = defineComponent({
        template: '<div></div>',
        setup() {
          return provideServices([SpiedService, SpiedService]);
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      expect(wrapper.vm.spiedService.foo).toBe(1);
      expect(SpiedService.setup).toHaveBeenCalledTimes(1);
      wrapper.unmount();
    });

    // eslint-disable-next-line max-len
    it('should provide the same service in the same component only once even if requested multiple times (separate call)', async () => {
      const SpiedService = defineService({
        name: 'SpiedService',
        setup: vi.fn(() => {
          return {
            foo: 1
          };
        })
      });

      const TestComponent = defineComponent({
        template: '<div></div>',
        setup() {
          const { spiedService } = provideServices([SpiedService]);
          const { spiedService: spiedService2 } = provideServices([SpiedService]);
          return {
            spiedService,
            spiedService2
          };
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      expect(wrapper.vm.spiedService).toStrictEqual(wrapper.vm.spiedService2);
      expect(SpiedService.setup).toHaveBeenCalledTimes(1);
      wrapper.unmount();
    });

    // eslint-disable-next-line max-len
    it('should allow providing the same service multiple times in different components', async () => {
      const SpiedService = defineService({
        name: 'SpiedService',
        setup: vi.fn(() => {
          return {
            foo: 1
          };
        })
      });
      const ChildComponent = defineComponent({
        template: '<div></div>',
        setup() {
          return provideServices([SpiedService]);
        }
      });
      const TestComponent = defineComponent({
        template: '<div><ChildComponent ref="child"/></div>',
        components: {
          ChildComponent
        },
        setup() {
          return {
            ...provideServices([SpiedService]),
            child: ref<InstanceType<typeof ChildComponent>>()
          };
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      expect(wrapper.vm.spiedService.foo).toBe(1);
      wrapper.vm.spiedService.foo = 2;
      expect(wrapper.vm.spiedService.foo).toBe(2);
      expect(wrapper.vm.child?.spiedService.foo).toBe(1);
      expect(SpiedService.setup).toHaveBeenCalledTimes(2);
      wrapper.unmount();
    });

  });

  describe('useService', () => {

    it('should work in the same component after `provideServices`', async () => {
      const TestComponent = defineComponent({
        template: '<div></div>',
        setup() {
          provideServices([ServiceA]);
          return {
            serviceA: useService(ServiceA)
          };
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      expect(wrapper.vm.serviceA.foo).toBe(1);
      wrapper.unmount();
    });

    it('should throw an error when trying to use a service outside of setup', async () => {
      const TestComponent = defineComponent({
        template: '<div></div>',
        setup() {
          provideServices([ServiceA]);
          return {
            useLater() { return useService(ServiceA); }
          };
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      expect(() => wrapper.vm.useLater()).toThrow();
      wrapper.unmount();
    });

    it('should throw an error when trying to use a service that is not provided', async () => {
      const TestComponent = defineComponent({
        template: '<div></div>',
        setup() {
          let error: any;
          try {
            useService(ServiceA);
          } catch (err) {
            error = err;
          }
          return {
            error
          };
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      expect(wrapper.vm.error).toBeDefined();
      wrapper.unmount();
    });

    it('should work in child component if a parent provides the service', async () => {
      const ChildComponent = defineComponent({
        template: '<div></div>',
        setup() {
          return {
            serviceA: useService(ServiceA)
          };
        }
      });
      const TestComponent = defineComponent({
        template: '<div><ChildComponent ref="child"/></div>',
        components: {
          ChildComponent
        },
        setup() {
          return {
            ...provideServices([ServiceA]),
            child: ref<InstanceType<typeof ChildComponent>>()
          };
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      wrapper.vm.serviceA.foo = 2;
      expect(wrapper.vm.child?.serviceA.foo).toBe(2);
      wrapper.unmount();
    });

    // eslint-disable-next-line max-len
    it('should use the service provided by the current component instead of the parent\'s', async () => {
      const ChildComponent = defineComponent({
        template: '<div></div>',
        setup() {
          provideServices([ServiceA]);
          return {
            serviceA: useService(ServiceA)
          };
        }
      });
      const TestComponent = defineComponent({
        template: '<div><ChildComponent ref="child"/></div>',
        components: {
          ChildComponent
        },
        setup() {
          return {
            ...provideServices([ServiceA]),
            child: ref<InstanceType<typeof ChildComponent>>()
          };
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      wrapper.vm.serviceA.foo = 2;
      expect(wrapper.vm.child?.serviceA.foo).toBe(1);
      wrapper.unmount();
    });

  });

  describe('useServiceDeferred', () => {

    it('should allow injecting a service asynchronously', async () => {
      const CircularA = defineService({
        name: 'CircularA',
        dependencies: [],
        setup() {
          const circularB = useServiceDeferred(async () => CircularB);
          const foo = ref(1);
          const doubleOther = computed((): number => (circularB.value?.foo ?? 0) * 2);
          return reactive({
            foo,
            doubleOther
          });
        }
      });
      const CircularB = defineService({
        name: 'CircularB',
        dependencies: [CircularA],
        setup({ circularA }) {
          const foo = ref(2);
          const doubleOther = computed(() => (circularA.foo ?? 0) * 2);
          return reactive({
            foo,
            doubleOther
          });
        }
      });
      const TestComponent = defineComponent({
        template: '<div></div>',
        setup() {
          return provideServices([CircularA, CircularB]);
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      expect(wrapper.vm.circularA.doubleOther).toBe(4);
      expect(wrapper.vm.circularB.doubleOther).toBe(2);
      wrapper.unmount();
    });

    it('should also allow resolving with a module with a default export', async () => {
      const CircularA = defineService({
        name: 'CircularA',
        dependencies: [],
        setup() {
          const circularB = useServiceDeferred(async () => ({ 'default': CircularB }));
          const foo = ref(1);
          const doubleOther = computed((): number => (circularB.value?.foo ?? 0) * 2);
          return reactive({
            foo,
            doubleOther
          });
        }
      });
      const CircularB = defineService({
        name: 'CircularB',
        dependencies: [CircularA],
        setup({ circularA }) {
          const foo = ref(2);
          const doubleOther = computed(() => (circularA.foo ?? 0) * 2);
          return reactive({
            foo,
            doubleOther
          });
        }
      });
      const TestComponent = defineComponent({
        template: '<div></div>',
        setup() {
          return provideServices([CircularA, CircularB]);
        }
      });
      const wrapper = mount(TestComponent);
      await flushPromises();
      expect(wrapper.vm.circularA.doubleOther).toBe(4);
      expect(wrapper.vm.circularB.doubleOther).toBe(2);
      wrapper.unmount();
    });

  });
});
