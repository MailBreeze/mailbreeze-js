import type { ListParams } from "./common";

/**
 * Type of consent obtained from the contact (NDPR compliance).
 */
export type ConsentType = "explicit" | "implicit" | "legitimate_interest";

/**
 * Parameters for creating a contact.
 */
export interface CreateContactParams {
  /** Contact's email address */
  email: string;

  /** First name */
  firstName?: string;

  /** Last name */
  lastName?: string;

  /** Phone number */
  phoneNumber?: string;

  /** Custom fields defined in the contact list */
  customFields?: Record<string, unknown>;

  /** Source of the contact (e.g., 'api', 'import', 'form') */
  source?: string;

  /** Type of consent obtained (NDPR compliance) */
  consentType?: ConsentType;

  /** Where consent was collected (e.g., 'signup_form', 'import', 'api') */
  consentSource?: string;

  /** When consent was given (ISO 8601 datetime) */
  consentTimestamp?: string;

  /** IP address from which consent was given */
  consentIpAddress?: string;
}

/**
 * Parameters for updating a contact.
 */
export interface UpdateContactParams {
  /** First name */
  firstName?: string;

  /** Last name */
  lastName?: string;

  /** Phone number */
  phoneNumber?: string;

  /** Custom fields defined in the contact list */
  customFields?: Record<string, unknown>;

  /** Type of consent obtained (NDPR compliance) */
  consentType?: ConsentType;

  /** Where consent was collected (e.g., 'signup_form', 'import', 'api') */
  consentSource?: string;

  /** When consent was given (ISO 8601 datetime) */
  consentTimestamp?: string;

  /** IP address from which consent was given */
  consentIpAddress?: string;
}

/**
 * Contact record.
 */
export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  customFields?: Record<string, unknown>;
  status: "active" | "unsubscribed" | "bounced" | "complained" | "suppressed";
  source: string;
  createdAt: string;
  updatedAt: string;
  subscribedAt?: string;
  unsubscribedAt?: string;
  /** Type of consent obtained (NDPR compliance) */
  consentType?: ConsentType | null;
  /** Where consent was collected */
  consentSource?: string;
  /** When consent was given (ISO 8601 datetime) */
  consentTimestamp?: string;
  /** IP address from which consent was given */
  consentIpAddress?: string;
}

/**
 * Parameters for listing contacts.
 */
export interface ListContactsParams extends ListParams {
  /** Filter by status */
  status?: "active" | "unsubscribed" | "bounced" | "complained" | "suppressed";
}

/**
 * Reason for suppressing a contact.
 */
export type SuppressReason = "manual" | "unsubscribed" | "bounced" | "complained" | "spam_trap";
