import { describe, expect, it } from "vitest";
import {
  AuthenticationError,
  createErrorFromResponse,
  MailBreezeError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ValidationError,
} from "../../src/http/errors";

describe("MailBreezeError", () => {
  it("should create error with all properties", () => {
    const error = new MailBreezeError("Something went wrong", "UNKNOWN_ERROR", 500, "req_123", { field: "email" });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MailBreezeError);
    expect(error.message).toBe("Something went wrong");
    expect(error.code).toBe("UNKNOWN_ERROR");
    expect(error.statusCode).toBe(500);
    expect(error.requestId).toBe("req_123");
    expect(error.details).toEqual({ field: "email" });
    expect(error.name).toBe("MailBreezeError");
  });

  it("should create error with minimal properties", () => {
    const error = new MailBreezeError("Minimal error", "MINIMAL");

    expect(error.message).toBe("Minimal error");
    expect(error.code).toBe("MINIMAL");
    expect(error.statusCode).toBeUndefined();
    expect(error.requestId).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it("should be serializable to JSON", () => {
    const error = new MailBreezeError("Test error", "TEST_CODE", 400, "req_456", { hint: "check input" });
    const json = error.toJSON();

    expect(json).toEqual({
      name: "MailBreezeError",
      message: "Test error",
      code: "TEST_CODE",
      statusCode: 400,
      requestId: "req_456",
      details: { hint: "check input" },
    });
  });

  it("should have proper stack trace", () => {
    const error = new MailBreezeError("Stack test", "STACK_TEST");
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("MailBreezeError");
  });
});

describe("AuthenticationError", () => {
  it("should create with correct defaults", () => {
    const error = new AuthenticationError("Invalid API key");

    expect(error).toBeInstanceOf(MailBreezeError);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe("Invalid API key");
    expect(error.code).toBe("AUTHENTICATION_ERROR");
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe("AuthenticationError");
  });

  it("should accept custom code and requestId", () => {
    const error = new AuthenticationError("Token expired", "TOKEN_EXPIRED", "req_789");

    expect(error.code).toBe("TOKEN_EXPIRED");
    expect(error.requestId).toBe("req_789");
  });
});

describe("ValidationError", () => {
  it("should create with correct defaults", () => {
    const error = new ValidationError("Invalid email format");

    expect(error).toBeInstanceOf(MailBreezeError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe("Invalid email format");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe("ValidationError");
  });

  it("should accept details for field-level errors", () => {
    const error = new ValidationError("Validation failed", "INVALID_FIELDS", "req_abc", {
      fields: [
        { field: "email", message: "Invalid email format" },
        { field: "subject", message: "Subject too long" },
      ],
    });

    expect(error.details).toEqual({
      fields: [
        { field: "email", message: "Invalid email format" },
        { field: "subject", message: "Subject too long" },
      ],
    });
  });
});

describe("NotFoundError", () => {
  it("should create with correct defaults", () => {
    const error = new NotFoundError("Resource not found");

    expect(error).toBeInstanceOf(MailBreezeError);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe("Resource not found");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("NotFoundError");
  });

  it("should accept custom code for specific resources", () => {
    const error = new NotFoundError("Email not found", "EMAIL_NOT_FOUND", "req_def");

    expect(error.code).toBe("EMAIL_NOT_FOUND");
    expect(error.requestId).toBe("req_def");
  });
});

describe("RateLimitError", () => {
  it("should create with correct defaults", () => {
    const error = new RateLimitError("Rate limit exceeded");

    expect(error).toBeInstanceOf(MailBreezeError);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.message).toBe("Rate limit exceeded");
    expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(error.statusCode).toBe(429);
    expect(error.name).toBe("RateLimitError");
    expect(error.retryAfter).toBeUndefined();
  });

  it("should accept retryAfter value", () => {
    const error = new RateLimitError("Too many requests", "RATE_LIMIT_EXCEEDED", "req_rate", 60);

    expect(error.retryAfter).toBe(60);
  });

  it("should include retryAfter in toJSON", () => {
    const error = new RateLimitError("Too many requests", "RATE_LIMIT_EXCEEDED", "req_rate", 120);
    const json = error.toJSON();

    expect(json.retryAfter).toBe(120);
  });
});

describe("ServerError", () => {
  it("should create with correct defaults", () => {
    const error = new ServerError("Internal server error");

    expect(error).toBeInstanceOf(MailBreezeError);
    expect(error).toBeInstanceOf(ServerError);
    expect(error.message).toBe("Internal server error");
    expect(error.code).toBe("SERVER_ERROR");
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe("ServerError");
  });

  it("should accept custom status code for 5xx errors", () => {
    const error = new ServerError("Service unavailable", "SERVICE_UNAVAILABLE", 503, "req_srv");

    expect(error.statusCode).toBe(503);
    expect(error.code).toBe("SERVICE_UNAVAILABLE");
    expect(error.requestId).toBe("req_srv");
  });
});

describe("createErrorFromResponse", () => {
  it("should create AuthenticationError for 401", () => {
    const error = createErrorFromResponse(401, {
      code: "INVALID_API_KEY",
      message: "API key is invalid",
    });

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe("API key is invalid");
    expect(error.code).toBe("INVALID_API_KEY");
  });

  it("should create ValidationError for 400", () => {
    const error = createErrorFromResponse(400, {
      code: "VALIDATION_ERROR",
      message: "Email is required",
      details: { field: "email" },
    });

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe("Email is required");
    expect(error.details).toEqual({ field: "email" });
  });

  it("should create NotFoundError for 404", () => {
    const error = createErrorFromResponse(404, {
      code: "CONTACT_NOT_FOUND",
      message: "Contact does not exist",
    });

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe("Contact does not exist");
    expect(error.code).toBe("CONTACT_NOT_FOUND");
  });

  it("should create RateLimitError for 429 with retryAfter", () => {
    const error = createErrorFromResponse(
      429,
      {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests",
      },
      "req_limit",
      30,
    );

    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfter).toBe(30);
  });

  it("should create ServerError for 500", () => {
    const error = createErrorFromResponse(500, {
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    });

    expect(error).toBeInstanceOf(ServerError);
    expect(error.statusCode).toBe(500);
  });

  it("should create ServerError for 502", () => {
    const error = createErrorFromResponse(502, {
      code: "BAD_GATEWAY",
      message: "Bad gateway",
    });

    expect(error).toBeInstanceOf(ServerError);
    expect(error.statusCode).toBe(502);
  });

  it("should create ServerError for 503", () => {
    const error = createErrorFromResponse(503, {
      code: "SERVICE_UNAVAILABLE",
      message: "Service temporarily unavailable",
    });

    expect(error).toBeInstanceOf(ServerError);
    expect(error.statusCode).toBe(503);
  });

  it("should create MailBreezeError for unknown status codes", () => {
    const error = createErrorFromResponse(418, {
      code: "IM_A_TEAPOT",
      message: "I am a teapot",
    });

    expect(error).toBeInstanceOf(MailBreezeError);
    expect(error.statusCode).toBe(418);
  });

  it("should handle missing error body gracefully", () => {
    const error = createErrorFromResponse(500, undefined);

    expect(error).toBeInstanceOf(ServerError);
    expect(error.message).toBe("Unknown error");
    expect(error.code).toBe("UNKNOWN_ERROR");
  });

  it("should handle null error body gracefully", () => {
    const error = createErrorFromResponse(400, null);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe("Unknown error");
  });

  it("should preserve requestId", () => {
    const error = createErrorFromResponse(
      401,
      {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      },
      "req_123456",
    );

    expect(error.requestId).toBe("req_123456");
  });
});
