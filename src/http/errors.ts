/**
 * Base error class for all MailBreeze SDK errors.
 * All API-related errors extend from this class.
 */
export class MailBreezeError extends Error {
  /** Error code for programmatic handling */
  public readonly code: string;

  /** HTTP status code (if applicable) */
  public readonly statusCode?: number;

  /** Unique request ID for debugging with support */
  public readonly requestId?: string;

  /** Additional error details (e.g., field-level validation errors) */
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    requestId?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "MailBreezeError";
    this.code = code;
    if (statusCode !== undefined) this.statusCode = statusCode;
    if (requestId !== undefined) this.requestId = requestId;
    if (details !== undefined) this.details = details;

    // Maintains proper stack trace for where our error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize error to JSON-friendly object.
   * Useful for logging and error reporting.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      requestId: this.requestId,
      details: this.details,
    };
  }
}

/**
 * Authentication failed (401).
 * Thrown when API key is missing, invalid, or expired.
 */
export class AuthenticationError extends MailBreezeError {
  constructor(message: string, code = "AUTHENTICATION_ERROR", requestId?: string) {
    super(message, code, 401, requestId);
    this.name = "AuthenticationError";
  }
}

/**
 * Validation failed (400).
 * Thrown when request data fails validation.
 */
export class ValidationError extends MailBreezeError {
  constructor(message: string, code = "VALIDATION_ERROR", requestId?: string, details?: Record<string, unknown>) {
    super(message, code, 400, requestId, details);
    this.name = "ValidationError";
  }
}

/**
 * Resource not found (404).
 * Thrown when the requested resource does not exist.
 */
export class NotFoundError extends MailBreezeError {
  constructor(message: string, code = "NOT_FOUND", requestId?: string) {
    super(message, code, 404, requestId);
    this.name = "NotFoundError";
  }
}

/**
 * Rate limit exceeded (429).
 * Thrown when too many requests are made in a time window.
 */
export class RateLimitError extends MailBreezeError {
  /** Seconds to wait before retrying */
  public readonly retryAfter?: number;

  constructor(message: string, code = "RATE_LIMIT_EXCEEDED", requestId?: string, retryAfter?: number) {
    super(message, code, 429, requestId);
    this.name = "RateLimitError";
    if (retryAfter !== undefined) this.retryAfter = retryAfter;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Server error (5xx).
 * Thrown when the API encounters an internal error.
 */
export class ServerError extends MailBreezeError {
  constructor(message: string, code = "SERVER_ERROR", statusCode = 500, requestId?: string) {
    super(message, code, statusCode, requestId);
    this.name = "ServerError";
  }
}

/**
 * Error response body from the API
 */
interface ErrorResponseBody {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Factory function to create the appropriate error class from an HTTP response.
 * Maps status codes to specific error types.
 */
export function createErrorFromResponse(
  statusCode: number,
  body: ErrorResponseBody | null | undefined,
  requestId?: string,
  retryAfter?: number,
): MailBreezeError {
  const message = body?.message ?? "Unknown error";
  const code = body?.code ?? "UNKNOWN_ERROR";
  const details = body?.details;

  switch (statusCode) {
    case 400:
      return new ValidationError(message, code, requestId, details);
    case 401:
      return new AuthenticationError(message, code, requestId);
    case 404:
      return new NotFoundError(message, code, requestId);
    case 429:
      return new RateLimitError(message, code, requestId, retryAfter);
    default:
      if (statusCode >= 500) {
        return new ServerError(message, code, statusCode, requestId);
      }
      return new MailBreezeError(message, code, statusCode, requestId, details);
  }
}
