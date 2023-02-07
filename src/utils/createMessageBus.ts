export default function createMessageBus<MessageTypes extends { [topic: string]: any }>() {
  type Callback = (data: MessageTypes[keyof MessageTypes]) => void;
  const subscribers: Map<keyof MessageTypes, Set<Callback>> = new Map();

  function on<T extends keyof MessageTypes>(
    topic: T | T[],
    callback: (data: MessageTypes[T]) => void
  ) {
    const topicList = Array.isArray(topic) ? topic : [topic];

    topicList.forEach((topic) => {
      if (!subscribers.has(topic)) {
        subscribers.set(topic, new Set());
      }
      subscribers.get(topic)!.add(callback as Callback);
    });
  }

  function emit<T extends keyof MessageTypes>(topic: T, data: MessageTypes[T]): void;
  function emit<T extends keyof MessageTypes>(
    topic: MessageTypes[T] extends void ? T : never): void;
  function emit<T extends keyof MessageTypes>(topic: T, data?: MessageTypes[T]) {
    if (subscribers.has(topic)) {
      subscribers.get(topic)!.forEach(subscriber => subscriber(data as MessageTypes[T]));
    }
  }

  function off<T extends keyof MessageTypes>(
    topic: T | T[],
    callback: (data: MessageTypes[T]) => void
  ) {
    const topicList = Array.isArray(topic) ? topic : [topic];

    topicList.forEach((topic) => {
      if (subscribers.has(topic)) {
        subscribers.get(topic)!.delete(callback as Callback);
        if (subscribers.get(topic)!.size === 0) {
          subscribers.delete(topic);
        }
      }
    });
  }

  function destroy() {
    subscribers.clear();
  }

  return {
    on,
    off,
    emit,
    destroy,
    subscribers
  };

}

// interface NoteszMessageTypes {
//   topic1: string;
//   topic2: number;
//   topic3: boolean;
//   topic4: Date
//   topicWithNoData: void;
// }

// const bus = createMessageBus<NoteszMessageTypes>();

// bus.on('topic1', (data) => {});
// bus.on('topic1', (data: number) => {});
// bus.on('topic2', (data) => {});
// bus.on('topic3', (data) => {});
// bus.on(['topic1', 'topic2'], (data) => {});
// bus.on('topic6', (data) => {});

// const subscriberA = (data: string) => {};
// const subscriberB = (data: number) => {};

// bus.off('topic1', subscriberA);
// bus.off('topic1', subscriberB);

// bus.emit('topic2', 123);
// bus.emit('topic2', '123');
// bus.emit('topic21', '123');
// bus.emit('topic6', new Date());

// bus.emit('topicWithNoData');
// bus.emit('topicWithNoData', 123);
