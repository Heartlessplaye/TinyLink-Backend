// AppError Class Constructor
export default class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "Fail" : "Error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
