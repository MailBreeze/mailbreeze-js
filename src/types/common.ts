/**
 * Pagination information returned with list endpoints.
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated list response.
 */
export interface PaginatedList<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * Common query parameters for list endpoints.
 */
export interface ListParams {
  page?: number;
  limit?: number;
}

/**
 * SDK configuration options.
 */
export interface MailBreezeConfig {
  /** Your MailBreeze API key (starts with sk_) */
  apiKey: string;

  /** Base URL for the API (defaults to https://api.mailbreeze.com) */
  baseUrl?: string;

  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;

  /** Maximum number of retries for failed requests (defaults to 3) */
  maxRetries?: number;

  /** Authentication style: 'header' uses X-API-Key, 'bearer' uses Authorization header */
  authStyle?: "header" | "bearer";
}

/**
 * Domain context header for multi-tenant operations.
 */
export interface DomainContext {
  domainId: string;
}
