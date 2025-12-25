import type { ListParams } from "./common";

/**
 * Parameters for enrolling a contact in an automation.
 */
export interface EnrollParams {
  /** Automation ID to enroll in */
  automationId: string;

  /** Contact ID to enroll */
  contactId: string;

  /** Optional variables to pass to the automation */
  variables?: Record<string, unknown>;
}

/**
 * Result of enrolling a contact.
 */
export interface EnrollResult {
  /** Enrollment ID */
  enrollmentId: string;

  /** Current status */
  status: "active" | "paused" | "completed" | "cancelled";

  /** When enrolled */
  enrolledAt: string;
}

/**
 * Enrollment record.
 */
export interface Enrollment {
  id: string;
  automationId: string;
  automationName: string;
  contactId: string;
  contactEmail: string;
  status: "active" | "paused" | "completed" | "cancelled";
  currentStep: number;
  totalSteps: number;
  variables?: Record<string, unknown>;
  enrolledAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

/**
 * Parameters for listing enrollments.
 */
export interface ListEnrollmentsParams extends ListParams {
  /** Filter by automation ID */
  automationId?: string;

  /** Filter by status */
  status?: "active" | "paused" | "completed" | "cancelled";
}

/**
 * Result of cancelling an enrollment.
 */
export interface CancelEnrollmentResult {
  /** Whether cancellation was successful */
  cancelled: boolean;

  /** Cancellation timestamp */
  cancelledAt: string;
}
