/**
 * An error class that allows setting `cause` and `code` properties
 */
export class NoteszError extends Error {
  cause?: any;
  code?: string;

  /**
   * @param message The error message
   * @param options.cause The cause of the error, by the spec: can be of any type
   * @param options.code A code that can be used to identify the error. This is a useful property
   *   that normally only exists in Node.js.
   */
  constructor(message: string, options?: { cause?: any, code?: string }) {
    super(message);
    this.cause = options?.cause;
    this.code = options?.code;
  }
}
