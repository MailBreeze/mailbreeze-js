import type { Email, EmailStats, ListEmailsParams, PaginatedList, SendEmailParams, SendEmailResult } from "../types";
import { BaseResource } from "./base";

/**
 * Email sending and management.
 *
 * @example
 * ```ts
 * // Send an email
 * const result = await mailbreeze.emails.send({
 *   from: "hello@yourdomain.com",
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   html: "<h1>Welcome to our platform!</h1>",
 * });
 *
 * // Send with a template
 * const result = await mailbreeze.emails.send({
 *   from: "hello@yourdomain.com",
 *   to: "user@example.com",
 *   templateId: "welcome-template",
 *   variables: { name: "John", plan: "Pro" },
 * });
 * ```
 */
export class Emails extends BaseResource {
  /**
   * Send an email.
   *
   * @param params - Email parameters
   * @returns Send result with email ID and status
   *
   * @example
   * ```ts
   * const result = await mailbreeze.emails.send({
   *   from: "hello@yourdomain.com",
   *   to: "user@example.com",
   *   subject: "Hello",
   *   html: "<p>Hello World!</p>",
   * });
   * console.log(result.messageId); // msg_xxx
   * ```
   */
  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const { idempotencyKey, ...body } = params;

    // Normalize 'to' to always be an array
    const normalizedBody = {
      ...body,
      to: Array.isArray(body.to) ? body.to : [body.to],
      cc: body.cc ? (Array.isArray(body.cc) ? body.cc : [body.cc]) : undefined,
      bcc: body.bcc ? (Array.isArray(body.bcc) ? body.bcc : [body.bcc]) : undefined,
    };

    return this._post<SendEmailResult>(
      "/emails",
      normalizedBody,
      undefined,
      idempotencyKey ? { idempotencyKey } : undefined,
    );
  }

  /**
   * List sent emails with optional filtering.
   *
   * @param params - Filter and pagination options
   * @returns Paginated list of emails
   *
   * @example
   * ```ts
   * const { data, pagination } = await mailbreeze.emails.list({
   *   status: "delivered",
   *   page: 1,
   *   limit: 20,
   * });
   * ```
   */
  async list(params?: ListEmailsParams): Promise<PaginatedList<Email>> {
    const query: Record<string, unknown> = {
      ...this.listParamsToQuery(params),
    };

    if (params?.status) query.status = params.status;
    if (params?.to) query.to = params.to;
    if (params?.from) query.from = params.from;
    if (params?.startDate) query.startDate = params.startDate;
    if (params?.endDate) query.endDate = params.endDate;

    const response = await this._get<{ emails: Email[]; pagination: PaginatedList<Email>["pagination"] }>(
      "/emails",
      Object.keys(query).length > 0 ? query : undefined,
    );

    return {
      data: response.emails,
      pagination: response.pagination,
    };
  }

  /**
   * Get a single email by ID.
   *
   * @param id - Email ID
   * @returns Email record
   *
   * @example
   * ```ts
   * const email = await mailbreeze.emails.get("email_xxx");
   * console.log(email.status); // "delivered"
   * ```
   */
  async get(id: string): Promise<Email> {
    return this._get<Email>(`/emails/${id}`);
  }

  /**
   * Get email statistics for the domain.
   *
   * @returns Email statistics including success rate
   *
   * @example
   * ```ts
   * const stats = await mailbreeze.emails.stats();
   * console.log(stats.successRate); // 100
   * console.log(stats.total); // 71
   * ```
   */
  async stats(): Promise<EmailStats> {
    const response = await this._get<{ stats: EmailStats }>("/emails/stats");
    return response.stats;
  }
}
