import type { Fetcher, RequestOptions } from "../http/fetcher";
import type { ListParams, PaginatedList } from "../types/common";

/**
 * Base class for all API resources.
 * Provides common functionality for making API requests.
 */
export abstract class BaseResource {
  protected readonly fetcher: Fetcher;
  protected readonly domainId?: string;

  constructor(fetcher: Fetcher, domainId?: string) {
    this.fetcher = fetcher;
    if (domainId !== undefined) this.domainId = domainId;
  }

  /**
   * Make a GET request.
   */
  protected _get<T>(path: string, query?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.fetcher.request<T>("GET", this.buildPath(path), undefined, this.addDomainId(query), options);
  }

  /**
   * Make a POST request.
   */
  protected _post<T>(
    path: string,
    body?: object,
    query?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T> {
    return this.fetcher.request<T>(
      "POST",
      this.buildPath(path),
      body as Record<string, unknown>,
      this.addDomainId(query),
      options,
    );
  }

  /**
   * Make a PUT request.
   */
  protected _put<T>(
    path: string,
    body?: object,
    query?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T> {
    return this.fetcher.request<T>(
      "PUT",
      this.buildPath(path),
      body as Record<string, unknown>,
      this.addDomainId(query),
      options,
    );
  }

  /**
   * Make a PATCH request.
   */
  protected _patch<T>(
    path: string,
    body?: object,
    query?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T> {
    return this.fetcher.request<T>(
      "PATCH",
      this.buildPath(path),
      body as Record<string, unknown>,
      this.addDomainId(query),
      options,
    );
  }

  /**
   * Make a DELETE request.
   */
  protected _delete<T>(path: string, query?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.fetcher.request<T>("DELETE", this.buildPath(path), undefined, this.addDomainId(query), options);
  }

  /**
   * Build the full path including any base path for the resource.
   */
  protected buildPath(path: string): string {
    return path;
  }

  /**
   * Add domain ID to query params if configured.
   */
  private addDomainId(query?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!this.domainId) {
      return query;
    }
    return { ...query, domainId: this.domainId };
  }

  /**
   * Helper to extract pagination from list response.
   */
  protected extractPaginatedList<T>(
    response: { data: T[]; pagination: PaginatedList<T>["pagination"] } | T[],
  ): PaginatedList<T> {
    if (Array.isArray(response)) {
      return {
        data: response,
        pagination: {
          page: 1,
          limit: response.length,
          total: response.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    return {
      data: response.data,
      pagination: response.pagination,
    };
  }

  /**
   * Convert list params to query object.
   */
  protected listParamsToQuery(params?: ListParams): Record<string, unknown> | undefined {
    if (!params) return undefined;
    const query: Record<string, unknown> = {};
    if (params.page !== undefined) query.page = params.page;
    if (params.limit !== undefined) query.limit = params.limit;
    return Object.keys(query).length > 0 ? query : undefined;
  }
}
