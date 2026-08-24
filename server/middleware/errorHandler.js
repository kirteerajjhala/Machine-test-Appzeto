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
  if (error?.code?.startsWith?.("LIMIT_") || error?.name === "MulterError") {
    return res.status(400).json({
      success: false,
      error: {
        code: error.code || "FILE_UPLOAD_ERROR",
        message:
          error.code === "LIMIT_UNEXPECTED_FILE"
            ? "Unexpected file upload field"
            : error.code === "LIMIT_FILE_SIZE"
              ? "Uploaded file is too large (max 10MB)"
              : error.message || "Invalid file upload",
      },
    });
  }
  const statusCode =
    error.statusCode ||
    (error.code === 11000
      ? 409
      : error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : 500);
  const details =
    error.details ||
    (error.name === "ValidationError"
      ? error.errors
      : error.name === "CastError"
        ? { path: error.path }
        : undefined);

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
