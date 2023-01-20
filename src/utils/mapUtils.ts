export function keyByMap<K, V>(
  iterable: Iterable<V>,
  keySelector: (value: V) => K | undefined
) {
  const result: Map<K, V> = new Map();
  for (const value of iterable) {
    const key = keySelector(value);
    if (key !== undefined) {
      result.set(key, value);
    }
  }
  return result;
}

export function filterMap<K, V, V2 extends V>(
  map: Map<K, V>,
  predicate: ((value: V, key: K) => value is V2) | ((value: V, key: K) => boolean)
) {
  const result: Map<K, V2> = new Map();
  for (const [key, value] of map) {
    if (predicate(value, key)) {
      result.set(key, value);
    }
  }
  return result;
}

export function updateMapValue<K, V>(
  map: Map<K, V>, key: K,
  updater: (value: V | undefined, key: K) => V
) {
  const newValue = updater(map.get(key), key);
  map.set(key, newValue);
}
