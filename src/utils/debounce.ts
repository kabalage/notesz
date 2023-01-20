type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never;

export default function debounce<T extends (...args: any[]) => any>(
  fun: T,
  wait: number
) {
  let timeout: number | undefined = undefined;
  let debouncedArgs: ArgumentsType<T> | undefined = undefined;
  const debounced = function (...args: ArgumentsType<T>) {
    debouncedArgs = args;
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      timeout = undefined;
      debouncedArgs = undefined;
      fun(...args);
    }, wait);
  };
  debounced.cancel = function () {
    if (timeout === undefined) return;
    window.clearTimeout(timeout);
    timeout = undefined;
    debouncedArgs = undefined;
  };
  debounced.flush = function () {
    if (timeout === undefined || debouncedArgs === undefined) return;
    window.clearTimeout(timeout);
    timeout = undefined;
    const debouncedArgsCopy = debouncedArgs;
    debouncedArgs = undefined;
    fun(...debouncedArgsCopy);
  };
  return debounced;
}
