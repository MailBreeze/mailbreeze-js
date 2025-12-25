import type {
  CancelEnrollmentResult,
  Enrollment,
  EnrollParams,
  EnrollResult,
  ListEnrollmentsParams,
  PaginatedList,
} from "../types";
import { BaseResource } from "./base";

/**
 * Automation enrollment management.
 *
 * Enroll contacts in automations, list enrollments, and cancel them.
 *
 * @example
 * ```ts
 * // Enroll a contact
 * const enrollment = await mailbreeze.automations.enroll({
 *   automationId: "auto_xxx",
 *   contactId: "contact_xxx",
 *   variables: { couponCode: "WELCOME10" },
 * });
 *
 * // List active enrollments
 * const { data } = await mailbreeze.automations.enrollments.list({
 *   status: "active",
 * });
 * ```
 */
export class Automations extends BaseResource {
  /**
   * Enrollments sub-resource for listing and cancelling.
   */
  public readonly enrollments: AutomationEnrollments;

  constructor(fetcher: import("../http/fetcher").Fetcher, domainId?: string) {
    super(fetcher, domainId);
    this.enrollments = new AutomationEnrollments(fetcher, domainId);
  }

  /**
   * Enroll a contact in an automation.
   *
   * @param params - Enrollment parameters
   * @returns Enrollment result
   *
   * @example
   * ```ts
   * const enrollment = await mailbreeze.automations.enroll({
   *   automationId: "auto_welcome",
   *   contactId: "contact_xxx",
   *   variables: { firstName: "John" },
   * });
   * console.log(enrollment.enrollmentId);
   * ```
   */
  async enroll(params: EnrollParams): Promise<EnrollResult> {
    return this._post<EnrollResult>(`/automations/${params.automationId}/enroll`, {
      contactId: params.contactId,
      variables: params.variables,
    });
  }
}

/**
 * Automation enrollments sub-resource.
 */
class AutomationEnrollments extends BaseResource {
  /**
   * List automation enrollments.
   *
   * @param params - Filter and pagination options
   * @returns Paginated list of enrollments
   *
   * @example
   * ```ts
   * const { data, pagination } = await mailbreeze.automations.enrollments.list({
   *   automationId: "auto_xxx",
   *   status: "active",
   * });
   * ```
   */
  async list(params?: ListEnrollmentsParams): Promise<PaginatedList<Enrollment>> {
    const query: Record<string, unknown> = {
      ...this.listParamsToQuery(params),
    };

    if (params?.automationId) query.automationId = params.automationId;
    if (params?.status) query.status = params.status;

    const response = await this._get<{
      data: Enrollment[];
      pagination: PaginatedList<Enrollment>["pagination"];
    }>("/automation-enrollments", Object.keys(query).length > 0 ? query : undefined);

    return this.extractPaginatedList(response);
  }

  /**
   * Cancel an enrollment.
   *
   * The contact will stop receiving emails from this automation.
   *
   * @param enrollmentId - Enrollment ID
   * @returns Cancellation result
   *
   * @example
   * ```ts
   * const result = await mailbreeze.automations.enrollments.cancel("enroll_xxx");
   * console.log(result.cancelled); // true
   * ```
   */
  async cancel(enrollmentId: string): Promise<CancelEnrollmentResult> {
    return this._post<CancelEnrollmentResult>(`/automation-enrollments/${enrollmentId}/cancel`, {});
  }
}
