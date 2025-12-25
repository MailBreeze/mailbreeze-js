import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ValidationError,
} from "../../src/http/errors";
import { Fetcher, type FetcherConfig } from "../../src/http/fetcher";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Fetcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createFetcher = (config: Partial<FetcherConfig> = {}): Fetcher => {
    return new Fetcher({
      apiKey: "sk_test_123456",
      baseUrl: "https://api.mailbreeze.com",
      timeout: 30000,
      maxRetries: 3,
      ...config,
    });
  };

  describe("request construction", () => {
    it("should set correct headers for API key auth", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: "1" } }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await fetcher.request("GET", "/emails/1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mailbreeze.com/emails/1",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-API-Key": "sk_test_123456",
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should use Authorization header when configured", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
        headers: new Headers(),
      });

      const fetcher = new Fetcher({
        apiKey: "sk_test_123456",
        baseUrl: "https://api.mailbreeze.com",
        timeout: 30000,
        maxRetries: 3,
        authStyle: "bearer",
      });
      await fetcher.request("GET", "/test");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer sk_test_123456");
      expect(headers["X-API-Key"]).toBeUndefined();
    });

    it("should set User-Agent header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await fetcher.request("GET", "/test");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers["User-Agent"]).toMatch(/^mailbreeze-js\//);
    });

    it("should serialize JSON body for POST requests", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: { id: "email_123" } }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await fetcher.request("POST", "/emails", { to: "test@example.com", subject: "Hello" });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("POST");
      expect(options.body).toBe(JSON.stringify({ to: "test@example.com", subject: "Hello" }));
    });

    it("should not include body for GET requests", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await fetcher.request("GET", "/emails");

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.body).toBeUndefined();
    });

    it("should append query params to URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await fetcher.request("GET", "/emails", undefined, { page: 1, limit: 10, status: "sent" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mailbreeze.com/emails?page=1&limit=10&status=sent",
        expect.anything(),
      );
    });

    it("should skip undefined query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await fetcher.request("GET", "/emails", undefined, { page: 1, status: undefined });

      expect(mockFetch).toHaveBeenCalledWith("https://api.mailbreeze.com/emails?page=1", expect.anything());
    });

    it("should set idempotency key header when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: {} }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await fetcher.request("POST", "/emails", { to: "test@example.com" }, undefined, {
        idempotencyKey: "idem_123",
      });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers["X-Idempotency-Key"]).toBe("idem_123");
    });

    it("should reject idempotency key with newlines (security)", async () => {
      const fetcher = createFetcher();

      await expect(
        fetcher.request("POST", "/emails", { to: "test@example.com" }, undefined, {
          idempotencyKey: "idem\n123",
        }),
      ).rejects.toThrow("Invalid idempotency key");
    });

    it("should reject idempotency key with carriage returns (security)", async () => {
      const fetcher = createFetcher();

      await expect(
        fetcher.request("POST", "/emails", { to: "test@example.com" }, undefined, {
          idempotencyKey: "idem\r123",
        }),
      ).rejects.toThrow("Invalid idempotency key");
    });
  });

  describe("response parsing", () => {
    it("should return data from success response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: "email_123", status: "sent" } }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      const result = await fetcher.request<{ id: string; status: string }>("GET", "/emails/123");

      expect(result).toEqual({ id: "email_123", status: "sent" });
    });

    it("should handle success: false in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          error: { code: "INVALID_EMAIL", message: "Email address is invalid" },
        }),
        headers: new Headers({ "X-Request-Id": "req_123" }),
      });

      const fetcher = createFetcher();
      await expect(fetcher.request("POST", "/emails")).rejects.toThrow(ValidationError);
    });

    it("should extract request ID from response headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Bad request" },
        }),
        headers: new Headers({ "X-Request-Id": "req_abc123" }),
      });

      const fetcher = createFetcher();

      try {
        await fetcher.request("POST", "/emails");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).requestId).toBe("req_abc123");
      }
    });
  });

  describe("error handling", () => {
    it("should throw AuthenticationError for 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: "INVALID_API_KEY", message: "API key is invalid" },
        }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await expect(fetcher.request("GET", "/emails")).rejects.toThrow(AuthenticationError);
    });

    it("should throw ValidationError for 400", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Missing required field" },
        }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await expect(fetcher.request("POST", "/emails")).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError for 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: "NOT_FOUND", message: "Email not found" },
        }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await expect(fetcher.request("GET", "/emails/unknown")).rejects.toThrow(NotFoundError);
    });

    it("should throw RateLimitError for 429 with retryAfter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: { code: "RATE_LIMIT", message: "Too many requests" },
        }),
        headers: new Headers({ "Retry-After": "60" }),
      });

      const fetcher = createFetcher({ maxRetries: 0 }); // Disable retry for this test

      try {
        await fetcher.request("GET", "/emails");
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });

    it("should throw ServerError for 500", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
        }),
        headers: new Headers(),
      });

      const fetcher = createFetcher({ maxRetries: 0 });
      await expect(fetcher.request("GET", "/emails")).rejects.toThrow(ServerError);
    });

    it("should handle non-JSON error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
        text: async () => "Internal Server Error",
        headers: new Headers(),
      });

      const fetcher = createFetcher({ maxRetries: 0 });
      await expect(fetcher.request("GET", "/emails")).rejects.toThrow(ServerError);
    });
  });

  describe("retry logic", () => {
    it("should retry on 500 errors", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ success: false, error: { code: "ERROR", message: "Error" } }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: "1" } }),
          headers: new Headers(),
        });

      const fetcher = createFetcher({ maxRetries: 3 });
      const promise = fetcher.request("GET", "/emails");

      // Advance past first retry delay (1 second)
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result).toEqual({ id: "1" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should retry on 503 errors", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ success: false, error: { code: "UNAVAILABLE", message: "Unavailable" } }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: {} }),
          headers: new Headers(),
        });

      const fetcher = createFetcher({ maxRetries: 3 });
      const promise = fetcher.request("GET", "/test");

      await vi.advanceTimersByTimeAsync(1000);

      await promise;
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should use exponential backoff (1s, 2s, 4s)", async () => {
      // All attempts fail
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: { code: "ERROR", message: "Error" } }),
        headers: new Headers(),
      });

      const fetcher = createFetcher({ maxRetries: 3 });
      let error: Error | undefined;
      const promise = fetcher.request("GET", "/emails").catch((e) => {
        error = e;
      });

      // First attempt happens immediately
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // After 1s - second attempt
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // After 2s - third attempt
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // After 4s - fourth attempt (last retry)
      await vi.advanceTimersByTimeAsync(4000);
      expect(mockFetch).toHaveBeenCalledTimes(4);

      await promise;
      expect(error).toBeInstanceOf(ServerError);
    });

    it("should NOT retry on 400 errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: { code: "VALIDATION", message: "Invalid" } }),
        headers: new Headers(),
      });

      const fetcher = createFetcher({ maxRetries: 3 });
      await expect(fetcher.request("POST", "/emails")).rejects.toThrow(ValidationError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should NOT retry on 401 errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: { code: "AUTH", message: "Unauthorized" } }),
        headers: new Headers(),
      });

      const fetcher = createFetcher({ maxRetries: 3 });
      await expect(fetcher.request("GET", "/emails")).rejects.toThrow(AuthenticationError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should NOT retry on 404 errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, error: { code: "NOT_FOUND", message: "Not found" } }),
        headers: new Headers(),
      });

      const fetcher = createFetcher({ maxRetries: 3 });
      await expect(fetcher.request("GET", "/emails/123")).rejects.toThrow(NotFoundError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should retry on network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error")).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: "1" } }),
        headers: new Headers(),
      });

      const fetcher = createFetcher({ maxRetries: 3 });
      const promise = fetcher.request("GET", "/emails");

      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result).toEqual({ id: "1" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should respect Retry-After header on 429", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ success: false, error: { code: "RATE_LIMIT", message: "Rate limited" } }),
          headers: new Headers({ "Retry-After": "5" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: "1" } }),
          headers: new Headers(),
        });

      const fetcher = createFetcher({ maxRetries: 3 });
      const promise = fetcher.request("GET", "/emails");

      // Should wait 5 seconds as per Retry-After
      await vi.advanceTimersByTimeAsync(5000);

      const result = await promise;
      expect(result).toEqual({ id: "1" });
    });

    it("should exhaust retries and throw final error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: { code: "ERROR", message: "Server error" } }),
        headers: new Headers(),
      });

      const fetcher = createFetcher({ maxRetries: 2 });
      let caughtError: Error | undefined;
      const promise = fetcher.request("GET", "/emails").catch((e) => {
        caughtError = e;
      });

      // Advance through all retries (1s + 2s = 3s for 2 retries)
      await vi.advanceTimersByTimeAsync(3000);

      await promise;
      expect(caughtError).toBeInstanceOf(ServerError);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  describe("timeout handling", () => {
    it("should abort request after timeout", async () => {
      // Mock fetch to wait for the abort signal
      mockFetch.mockImplementation((_url, options: RequestInit) => {
        return new Promise((_, reject) => {
          const signal = options.signal;
          if (signal) {
            signal.addEventListener("abort", () => {
              const abortError = new Error("Aborted");
              abortError.name = "AbortError";
              reject(abortError);
            });
          }
        });
      });

      const fetcher = createFetcher({ timeout: 5000, maxRetries: 0 });
      let caughtError: Error | undefined;
      const promise = fetcher.request("GET", "/emails").catch((e) => {
        caughtError = e;
      });

      // Advance time to trigger timeout
      await vi.advanceTimersByTimeAsync(5000);

      await promise;
      expect(caughtError).toBeDefined();
      expect(caughtError?.message).toBe("Request timeout");
    });

    it("should clean up AbortController after successful request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: "1" } }),
        headers: new Headers(),
      });

      const fetcher = createFetcher({ timeout: 30000 });
      await fetcher.request("GET", "/emails");

      // Verify AbortController was passed to fetch
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(options.signal).toBeDefined();
      expect(options.signal?.aborted).toBe(false);
    });

    it("should use custom timeout per request", async () => {
      // Mock fetch to wait for the abort signal
      mockFetch.mockImplementation((_url, options: RequestInit) => {
        return new Promise((_, reject) => {
          const signal = options.signal;
          if (signal) {
            signal.addEventListener("abort", () => {
              const abortError = new Error("Aborted");
              abortError.name = "AbortError";
              reject(abortError);
            });
          }
        });
      });

      const fetcher = createFetcher({ timeout: 30000, maxRetries: 0 });
      let caughtError: Error | undefined;
      const promise = fetcher.request("GET", "/slow-endpoint", undefined, undefined, { timeout: 1000 }).catch((e) => {
        caughtError = e;
      });

      await vi.advanceTimersByTimeAsync(1000);

      await promise;
      expect(caughtError).toBeDefined();
      expect(caughtError?.message).toBe("Request timeout");
    });
  });

  describe("edge cases", () => {
    it("should handle empty response body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error("No content");
        },
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      const result = await fetcher.request("DELETE", "/emails/123");

      expect(result).toBeUndefined();
    });

    it("should handle trailing slash in baseUrl", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
        headers: new Headers(),
      });

      const fetcher = new Fetcher({
        apiKey: "sk_test",
        baseUrl: "https://api.mailbreeze.com/",
        timeout: 30000,
        maxRetries: 3,
      });
      await fetcher.request("GET", "/emails");

      expect(mockFetch).toHaveBeenCalledWith("https://api.mailbreeze.com/emails", expect.anything());
    });

    it("should handle path without leading slash", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await fetcher.request("GET", "emails");

      expect(mockFetch).toHaveBeenCalledWith("https://api.mailbreeze.com/emails", expect.anything());
    });

    it("should handle special characters in query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
        headers: new Headers(),
      });

      const fetcher = createFetcher();
      await fetcher.request("GET", "/search", undefined, { q: "hello world", email: "test+1@example.com" });

      // URL encoding should be applied
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("q=hello+world");
      expect(url).toContain("email=test%2B1%40example.com");
    });
  });
});
