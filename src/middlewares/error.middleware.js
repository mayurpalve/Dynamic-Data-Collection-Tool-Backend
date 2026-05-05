const getErrorDetails = (err) => {
  if (err?.name === "ValidationError") {
    const message = Object.values(err.errors || {})
      .map((item) => item.message)
      .filter(Boolean)
      .join(", ");

    return {
      statusCode: 400,
      message: message || "Validation failed",
    };
  }

  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});

    return {
      statusCode: 400,
      message: fields.length
        ? `${fields.join(", ")} already exists`
        : "Duplicate value detected",
    };
  }

  if (err?.name === "CastError") {
    return {
      statusCode: 400,
      message: "Invalid record reference",
    };
  }

  if (err?.type === "entity.parse.failed") {
    return {
      statusCode: 400,
      message: "Invalid JSON payload",
    };
  }

  if (err?.name === "MulterError") {
    return {
      statusCode: 400,
      message: err.message || "File upload failed",
    };
  }

  return {
    statusCode: err?.statusCode || err?.status || 500,
    message: err?.message || "Internal Server Error",
  };
};

export const errorHandler = (err, req, res, next) => {
  const { statusCode, message } = getErrorDetails(err);

  if (statusCode >= 500) {
    console.error("Unhandled server error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
