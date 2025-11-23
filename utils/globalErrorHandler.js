import HttpStatusCodes from "../constants/httpCodes.js";

import AppError from "./errorHandler.js";

// Error Handler For Development Environment
const devError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

//Error Handler For Production Environment
const prodError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "Error",
      message: "Something went very wrong!",
    });
  }
};

// Cast Error Handler
const castErrorHandler = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(HttpStatusCodes.BAD_REQUEST, message);
};

// Duplicate Error Handler
const duplicateErrorHandler = (err) => {
  // const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Field value: ${Object.values(err.keyValue).join(
    ", "
  )} already exists. Please use another value`;
  return new AppError(HttpStatusCodes.BAD_REQUEST, message);
};

// Validation Error Handler
const validationErrorHandler = (err) => {
  const errors = Object.values(err.errors).map((el) => {
    if (el.kind === "enum") {
      return `Invalid value for ${el.path}: '${
        el.value
      }'. Allowed values are: ${el.properties.enumValues.join(", ")}.`;
    }
    if (el.kind === "min") {
      return `${el.path} should not be less than ${el.properties.min}.`;
    }
    if (el.kind === "max") {
      return `${el.path} should not exceed ${el.properties.max}.`;
    }
    return el.message; // Default message for other types of validation errors
  });

  const message = `Invalid input data ~ ${errors.join(". ")}`;
  return new AppError(HttpStatusCodes.BAD_REQUEST, message);
};

//Global Error Handler
const globalErrorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "Error";
  if (process.env.NODE_ENV === "development") {
    devError(err, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.name === "CastError") err = castErrorHandler(err);
    if (err.code === 11000) err = duplicateErrorHandler(err);
    if (err.name === "ValidationError") err = validationErrorHandler(err);

    prodError(err, res);
  }
};

export default globalErrorHandler;
