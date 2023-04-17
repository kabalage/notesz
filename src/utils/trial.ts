import { NoteszError } from './NoteszError';

/**
 * Utility function for go-like error handling.
 *
 * This is very handy because normally you have to define your results with `let` and then
 * assign them in the `try` block, which means you have to guard against `undefined` values in
 * certain cases, which is annoying.
 *
 * @param fun A function that may throw an error or return a promise that rejects
 * @returns An array with the result of the function as the first element and the error as
 *  the second
 */
export function trial<T>(
  fun: () => Promise<T>
): Promise<[T, undefined] | [undefined, Error]>;
export function trial<T>(fun: () => T): [T, undefined] | [undefined, Error];
export function trial<T>(
  fun: (() => T) | (() => Promise<T>)
): [T, undefined] | [undefined, Error] | Promise<[T, undefined] | [undefined, Error]> {
  try {
    const result = fun();
    if (result instanceof Promise) {
      return result
        .then((value) => [value, undefined] as [T, undefined])
        .catch((error) => {
          if (error instanceof Error) {
            return [undefined, error];
          }
          return [undefined, new NoteszError(`Non-error thrown: ${error}`, {
            cause: error
          })];
        });
    } else {
      return [result, undefined];
    }
  } catch (error) {
    if (error instanceof Error) {
      return [undefined, error];
    }
    return [undefined, new NoteszError(`Non-error thrown: ${error}`, {
      cause: error
    })];
  }
}
