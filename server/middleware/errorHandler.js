export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "ApiError";
  }
}

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error, req, res, next) => {
  const statusCode =
    error.statusCode || (error.name === "ValidationError" ? 400 : 500);
  const details =
    error.details ||
    (error.name === "ValidationError" ? error.errors : undefined);

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code:
        error.code ||
        (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR"),
      message:
        statusCode >= 500 ? "An unexpected error occurred" : error.message,
      ...(details ? { details } : {}),
    },
  });
};
