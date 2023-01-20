import NoteszError from './NoteszError';

export default function trial<T>(
  fun: () => Promise<T>
): Promise<[T, undefined] | [undefined, Error]>;
export default function trial<T>(fun: () => T): [T, undefined] | [undefined, Error];
export default function trial<T>(
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
// export default async function trial<T>(
//   fun: () => T | Promise<T>
// ): Promise<[T, undefined] | [undefined, Error]> {
//   try {
//     return [await fun(), undefined];
//   } catch (error) {
//     if (error instanceof Error) {
//       return [undefined, error];
//     }
//     return [undefined, new NoteszError(`Non-error thrown: ${error}`, {
//       cause: error
//     })];
//   }
// }
