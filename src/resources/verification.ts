import type {
  BatchVerifyParams,
  BatchVerifyResult,
  ListVerificationsParams,
  PaginatedList,
  VerificationStats,
  VerificationStatus,
  VerifyEmailParams,
  VerifyEmailResult,
} from "../types";
import { BaseResource } from "./base";

/**
 * Email verification services.
 *
 * Verify email addresses before sending to reduce bounces
 * and protect sender reputation.
 *
 * @example
 * ```ts
 * // Verify a single email
 * const result = await mailbreeze.verification.verify({ email: "user@example.com" });
 * if (result.isValid) {
 *   // Safe to send
 * }
 *
 * // Batch verification
 * const batch = await mailbreeze.verification.batch({
 *   emails: ["user1@example.com", "user2@example.com"],
 * });
 *
 * // Poll for results (if async)
 * if (batch.verificationId) {
 *   const status = await mailbreeze.verification.get(batch.verificationId);
 * }
 * ```
 */
export class Verification extends BaseResource {
  /**
   * Verify a single email address.
   *
   * This is a synchronous operation - the result is returned immediately.
   * Results are cached for 24 hours.
   *
   * @param params - Object containing email address to verify
   * @returns Verification result
   *
   * @example
   * ```ts
   * const result = await mailbreeze.verification.verify({ email: "test@example.com" });
   * console.log(result.isValid); // true
   * console.log(result.result); // "valid"
   * console.log(result.details?.isDisposable); // false
   * ```
   */
  async verify(params: VerifyEmailParams): Promise<VerifyEmailResult> {
    return this._post<VerifyEmailResult>("/email-verification/single", params);
  }

  /**
   * Start batch verification.
   *
   * Submits a batch of emails for verification. For large batches,
   * results are processed asynchronously - poll with `get()` for status.
   *
   * If all emails are cached, results are returned immediately.
   *
   * @param params - Batch parameters including emails array
   * @returns Batch verification result with ID for polling
   *
   * @example
   * ```ts
   * const batch = await mailbreeze.verification.batch({
   *   emails: ["user1@example.com", "user2@example.com", "user3@example.com"],
   * });
   *
   * if (batch.results) {
   *   // All cached - results available immediately
   *   console.log(batch.results);
   * } else {
   *   // Poll for results
   *   const status = await mailbreeze.verification.get(batch.verificationId);
   * }
   * ```
   */
  async batch(params: BatchVerifyParams): Promise<BatchVerifyResult> {
    return this._post<BatchVerifyResult>("/email-verification/batch", params);
  }

  /**
   * Get verification batch status and results.
   *
   * @param verificationId - Verification batch ID
   * @returns Current status and results when complete
   *
   * @example
   * ```ts
   * const status = await mailbreeze.verification.get("ver_xxx");
   * if (status.status === "completed") {
   *   console.log(status.results);
   *   console.log(status.analytics);
   * }
   * ```
   */
  async get(verificationId: string): Promise<VerificationStatus> {
    return this._get<VerificationStatus>(`/email-verification/${verificationId}`, {
      includeResults: true,
    });
  }

  /**
   * List verification batches.
   *
   * @param params - Filter and pagination options
   * @returns Paginated list of verification batches
   *
   * @example
   * ```ts
   * const { data, pagination } = await mailbreeze.verification.list({
   *   status: "completed",
   *   page: 1,
   * });
   * ```
   */
  async list(params?: ListVerificationsParams): Promise<PaginatedList<VerificationStatus>> {
    const query: Record<string, unknown> = {
      ...this.listParamsToQuery(params),
    };

    if (params?.status) query.status = params.status;

    const response = await this._get<{
      data: VerificationStatus[];
      pagination: PaginatedList<VerificationStatus>["pagination"];
    }>("/email-verification", Object.keys(query).length > 0 ? query : undefined);

    return this.extractPaginatedList(response);
  }

  /**
   * Get verification statistics.
   *
   * @returns Aggregate verification stats
   *
   * @example
   * ```ts
   * const stats = await mailbreeze.verification.stats();
   * console.log(`Verified: ${stats.totalVerified}, Valid: ${stats.valid}`);
   * ```
   */
  async stats(): Promise<VerificationStats> {
    return this._get<VerificationStats>("/email-verification/stats");
  }
}
