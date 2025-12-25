import { createErrorFromResponse, MailBreezeError, RateLimitError, ServerError } from "./errors";

const SDK_VERSION = "0.1.0";

export interface FetcherConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  authStyle?: "header" | "bearer";
}

export interface RequestOptions {
  idempotencyKey?: string;
  timeout?: number;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * HTTP client for making requests to the MailBreeze API.
 * Handles authentication, retries, timeouts, and error mapping.
 */
export class Fetcher {
  private readonly config: FetcherConfig;

  constructor(config: FetcherConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/$/, ""), // Remove trailing slash
    };
  }

  /**
   * Make an HTTP request to the API.
   *
   * @param method - HTTP method
   * @param path - API path (will be appended to baseUrl)
   * @param body - Request body (for POST/PUT/PATCH)
   * @param query - Query parameters
   * @param options - Additional request options
   * @returns Parsed response data
   */
  async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, query);
    const headers = this.buildHeaders(options?.idempotencyKey);
    const timeout = options?.timeout ?? this.config.timeout;

    let lastError: MailBreezeError | undefined;
    let attempt = 0;
    const maxAttempts = this.config.maxRetries + 1;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        const result = await this.executeRequest<T>(method, url, headers, body, timeout);
        return result;
      } catch (error) {
        lastError = error as MailBreezeError;

        // Don't retry on client errors (4xx except 429) or abort errors
        if (!this.isRetryable(lastError, error)) {
          throw lastError;
        }

        // Check if we have retries left
        if (attempt >= maxAttempts) {
          throw lastError;
        }

        // Calculate delay
        const delay = this.getRetryDelay(lastError, attempt);
        await this.sleep(delay);
      }
    }

    // This line should never be reached due to the retry logic above
    // but TypeScript needs a return path for safety
    throw lastError ?? new MailBreezeError("Unexpected error during request", "UNEXPECTED_ERROR");
  }

  private async executeRequest<T>(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: Record<string, unknown>,
    timeout?: number,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : undefined;

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body && method !== "GET" && method !== "HEAD") {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      return await this.handleResponse<T>(response);
    } catch (error) {
      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new MailBreezeError("Request timeout", "TIMEOUT_ERROR", 0);
      }

      // Network errors - wrap for retry handling
      if (error instanceof Error && !(error instanceof MailBreezeError)) {
        throw new ServerError(`Network error: ${error.message}`, "NETWORK_ERROR", 0);
      }

      throw error;
    } finally {
      // Clean up timeout to prevent memory leaks
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const requestId = response.headers.get("X-Request-Id") ?? undefined;
    const retryAfter = response.headers.get("Retry-After");
    const retryAfterSeconds = retryAfter ? Number.parseInt(retryAfter, 10) : undefined;

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    let body: ApiResponse<T>;
    try {
      body = (await response.json()) as ApiResponse<T>;
    } catch {
      // JSON parsing failed
      if (!response.ok) {
        throw createErrorFromResponse(response.status, undefined, requestId);
      }
      return undefined as T;
    }

    // Handle API error in body
    if (!body.success) {
      const errorBody = (body as ApiErrorResponse).error;
      // Use 400 as default for success: false with ok response (validation errors)
      const statusCode = response.ok ? 400 : response.status;
      throw createErrorFromResponse(statusCode, errorBody, requestId, retryAfterSeconds);
    }

    // Handle HTTP error even if success field is missing
    if (!response.ok) {
      throw createErrorFromResponse(response.status, undefined, requestId, retryAfterSeconds);
    }

    return (body as ApiSuccessResponse<T>).data;
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.config.baseUrl}${normalizedPath}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private buildHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": `mailbreeze-js/${SDK_VERSION}`,
    };

    // Authentication
    if (this.config.authStyle === "bearer") {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    } else {
      headers["X-API-Key"] = this.config.apiKey;
    }

    // Idempotency - validate to prevent header injection
    if (idempotencyKey) {
      // Ensure key doesn't contain newlines or control characters
      if (/[\r\n]/.test(idempotencyKey)) {
        throw new MailBreezeError("Invalid idempotency key: contains invalid characters", "INVALID_IDEMPOTENCY_KEY");
      }
      headers["X-Idempotency-Key"] = idempotencyKey;
    }

    return headers;
  }

  private isRetryable(error: MailBreezeError, originalError: unknown): boolean {
    // Don't retry abort errors (timeouts)
    if (originalError instanceof Error && originalError.name === "AbortError") {
      return false;
    }

    // Retry on 429 (rate limit) and 5xx (server errors)
    if (error.statusCode === 429 || (error.statusCode !== undefined && error.statusCode >= 500)) {
      return true;
    }

    // Retry on network errors (statusCode 0)
    if (error.statusCode === 0 && error.code === "NETWORK_ERROR") {
      return true;
    }

    return false;
  }

  private getRetryDelay(error: MailBreezeError, attempt: number): number {
    // Use Retry-After header if available (for rate limits)
    if (error instanceof RateLimitError && error.retryAfter) {
      return error.retryAfter * 1000;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s...
    return 2 ** (attempt - 1) * 1000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
