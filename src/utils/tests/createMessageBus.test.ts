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
    assertType<(topic: 'foo', cb: (data: string) => void) => void>(messages.on);
    assertType<(topic: 'bar', cb: (data: number) => void) => void>(messages.on);
    assertType<(topic: 'baz', cb: (data: boolean) => void) => void>(messages.on);
  });

  it('should infer the correct union type for the payload when subscribing multiple topics', () => {
    assertType<(topic: ['foo', 'bar'], cb: (data: string | number) => void) => void>(messages.on);
  });

  it('should produce a compile time error when the callback expects the wrong payload type', () => {
    // @ts-expect-error wrong type
    assertType<(topic: 'foo', cb: (data: boolean) => void) => void>(messages.on);

  });

  it('should produce a compile time error when subscribing a topic that does not exist', () => {
    // @ts-expect-error wrong type
    assertType<(topic: 'missingTopic', cb: (data: boolean) => void) => void>(messages.on);
  });

});
