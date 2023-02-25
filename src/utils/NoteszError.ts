export class NoteszError extends Error {
  cause?: any;
  code?: string;

  constructor(message: string, options?: { cause?: any, code?: string }) {
    super(message);
    this.cause = options?.cause;
    this.code = options?.code;
  }
}
