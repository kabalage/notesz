import { tryOnScopeDispose } from '@vueuse/shared';

export default function createMessageBus<MessageTypes extends { [topic: string]: any }>() {
  type Callback = (data: MessageTypes[keyof MessageTypes]) => void;
  type TabMessage<T extends keyof MessageTypes> = {
    id: number;
    topic: T;
    data?: MessageTypes[T];
  };
  const subscribers: Map<keyof MessageTypes, Set<Callback>> = new Map();

  window.addEventListener('storage', storageHandler);

  function on<T extends keyof MessageTypes>(
    topic: T | T[],
    callback: (data: MessageTypes[T]) => void
  ) {
    const topicList = Array.isArray(topic) ? topic : [topic];

    for (const topic of topicList) {
      if (!subscribers.has(topic)) {
        subscribers.set(topic, new Set());
      }
      subscribers.get(topic)!.add(callback as Callback);
    }
    // if the scope is destroyed from where on is called, unsubscribe the callback
    tryOnScopeDispose(() => {
      off(topic, callback);
    });
  }

  function emit<T extends keyof MessageTypes>(topic: T, data: MessageTypes[T]): void;
  function emit<T extends keyof MessageTypes>(
    topic: MessageTypes[T] extends void ? T : never): void;
  function emit<T extends keyof MessageTypes>(topic: T, data?: MessageTypes[T]) {
    if (subscribers.has(topic)) {
      for (const subscriber of subscribers.get(topic)!) {
        subscriber(data as MessageTypes[T]);
      }
    }
    const tabMessage: TabMessage<T> = {
      id: Date.now(),
      topic,
      data
    };
    localStorage.tabMessage = JSON.stringify(tabMessage);
  }

  function off<T extends keyof MessageTypes>(
    topic: T | T[],
    callback: (data: MessageTypes[T]) => void
  ) {
    const topicList = Array.isArray(topic) ? topic : [topic];

    for (const topic of topicList) {
      if (subscribers.has(topic)) {
        subscribers.get(topic)!.delete(callback as Callback);
        if (subscribers.get(topic)!.size === 0) {
          subscribers.delete(topic);
        }
      }
    }
  }

  function storageHandler(event: StorageEvent) {
    if (event.key === 'tabMessage' && event.newValue) {
      // console.log('tabMessage', event.newValue);
      const message = JSON.parse(localStorage.tabMessage) as TabMessage<keyof MessageTypes>;
      if (subscribers.has(message.topic)) {
        for (const subscriber of subscribers.get(message.topic)!) {
          subscriber(message.data as MessageTypes[keyof MessageTypes]);
          // Negligent typing, but the original sender is the emit above which has type checks.
        }
      }
    }
  }

  function destroy() {
    subscribers.clear();
    window.removeEventListener('storage', storageHandler);
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
