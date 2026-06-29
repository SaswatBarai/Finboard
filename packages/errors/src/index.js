export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function httpError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
