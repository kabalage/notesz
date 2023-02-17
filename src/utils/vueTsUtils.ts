import type {
  Component,
  AllowedComponentProps,
  VNodeProps
} from 'vue';

/**
 * Extracts the props type of a Vue component.
 * (Thanks https://stackoverflow.com/a/73784241/21081453)
 *
 * @example type MyProps = PropTypes<typeof MyComponent>
 *
 */
export type PropsType<C extends Component> = C extends new (...args: any) => any
  ? Omit<InstanceType<C>['$props'], keyof VNodeProps | keyof AllowedComponentProps>
  : never;

/**
 * Extracts the type of an event from a Vue component.
 * @example type MyEvent = EventType<typeof MyComponent, 'myEvent'>
 */
export type EventType<C extends Component, T extends string> = C extends new (...args: any) => any
  ? Exclude<PropsType<C>[`on${Capitalize<T>}`], undefined> extends (value: infer P) => any ? P : never
  : never;

/**
 * Helper to allow a component `C` to be used only if it has an event of type `T`.
 * Returns type `C` if it has an event of type `T`, otherwise returns `never`.
 */
export type ComponentWithEvent<C extends Component, T extends string> =
  EventType<C, T> extends never ? never: C;
