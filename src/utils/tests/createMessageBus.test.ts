import { createMessageBus } from '../createMessageBus';

type MessageTypes = {
  foo: string;
  bar: number;
  baz: boolean;
};

describe('createMessageBus', () => {

  let messages: ReturnType<typeof createMessageBus<MessageTypes>>;

  beforeEach(() => {
    messages = createMessageBus<MessageTypes>();
  });

  afterEach(() => {
    messages!.destroy();
  });

  it('should allow subscribing', () => {
    const cb = vi.fn();
    messages.on('foo', cb);
    messages.emit('foo', 'hello');
    expect(cb).toBeCalledTimes(1);
    expect(cb).toBeCalledWith('hello');
  });

  it('should allow unsubscribing', () => {
    const cb = vi.fn();
    messages.on('foo', cb);
    messages.emit('foo', 'hello');
    expect(cb).toBeCalledTimes(1);
    expect(cb).toBeCalledWith('hello');
    messages.off('foo', cb);
    messages.emit('foo', 'hello');
    expect(cb).toBeCalledTimes(1);
  });

  it('should allow subscribing to multiple topics', () => {
    const cb = vi.fn();
    messages.on(['foo', 'bar'], cb);
    messages.emit('foo', 'hello');
    expect(cb).toBeCalledTimes(1);
    expect(cb).toBeCalledWith('hello');
    messages.emit('bar', 66);
    expect(cb).toBeCalledTimes(2);
    expect(cb).toBeCalledWith(66);
    messages.off(['foo', 'bar'], cb);
    messages.emit('foo', 'hello');
    expect(cb).toBeCalledTimes(2);
  });

  it('should not work after destroy', () => {
    const cb = vi.fn();
    messages.on('foo', cb);
    messages.destroy();
    expect(() => messages.emit('foo', 'hello')).toThrow();
    expect(() => messages.on('foo', cb)).toThrow();
    expect(() => messages.off('foo', cb)).not.toThrow();
    expect(() => messages.destroy()).not.toThrow();
  });

  it('should infer the correct payload type', () => {
    expectTypeOf(messages.on).toMatchTypeOf<(topic: 'foo', cb: (data: string) => void) => void>();
    expectTypeOf(messages.on).toMatchTypeOf<(topic: 'bar', cb: (data: number) => void) => void>();
    expectTypeOf(messages.on).toMatchTypeOf<(topic: 'baz', cb: (data: boolean) => void) => void>();
  });

  it('should infer the correct union type for the payload when subscribing multiple topics', () => {
    expectTypeOf(messages.on).toMatchTypeOf<
      (topic: ['foo', 'bar'], cb: (data: string | number) => void) => void
    >();
  });

  it('should produce a compile time error when the callback expects the wrong payload type', () => {
    expectTypeOf(messages.on).not.toMatchTypeOf<
      (topic: 'foo', cb: (data: boolean) => void) => void
    >();
  });

  it('should produce a compile time error when subscribing a topic that does not exist', () => {
    expectTypeOf(messages.on).not.toMatchTypeOf<
      (topic: 'missingTopic', cb: (data: boolean) => void) => void
    >();
  });

});
