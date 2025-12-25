import type { ListParams } from "./common";

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
