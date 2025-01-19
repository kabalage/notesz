/**
 * It's like _.keyBy, but returns a Map
 */
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

/**
 * It's like Array.prototype.filter, but works with Maps
 */
export function filterMap<K, V, T extends V = V>(
  map: Map<K, V>,
  predicate: ((value: V, key: K) => value is T) | ((value: V, key: K) => boolean)
) {
  const result: Map<K, T> = new Map();
  for (const [key, value] of map) {
    if (predicate(value, key)) {
      result.set(key, value as T);
    }
  }
  return result;
}
