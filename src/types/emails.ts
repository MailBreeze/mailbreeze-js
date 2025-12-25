import type { ListParams } from "./common";

/**
 * Parameters for sending an email.
 */
export interface SendEmailParams {
  /** Sender email address (must match verified domain) */
  from: string;

  /** Recipient email address(es) */
  to: string | string[];

  /** Email subject line */
  subject?: string;

  /** HTML content of the email */
  html?: string;

  /** Plain text content of the email */
  text?: string;

  /** Template ID to use instead of raw content */
  templateId?: string;

  /** Variables to substitute in the template */
  variables?: Record<string, unknown>;

  /** IDs of uploaded attachments to include */
  attachmentIds?: string[];

  /** Optional CC recipients */
  cc?: string | string[];

  /** Optional BCC recipients */
  bcc?: string | string[];

  /** Optional reply-to address */
  replyTo?: string;

  /** Custom headers to include */
  headers?: Record<string, string>;

  /** Idempotency key for safe retries */
  idempotencyKey?: string;
}

/**
 * Result of sending an email.
 */
export interface SendEmailResult {
  /** Unique email ID */
  id: string;

  /** Current status */
  status: "queued" | "sent" | "delivered" | "bounced" | "failed";

  /** Message ID (SMTP) */
  messageId?: string;

  /** Timestamp when queued */
  createdAt: string;
}

/**
 * Email record returned from list/get.
 */
export interface Email {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  status: "queued" | "sent" | "delivered" | "bounced" | "failed";
  messageId?: string;
  templateId?: string;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

/**
 * Parameters for listing emails.
 */
export interface ListEmailsParams extends ListParams {
  /** Filter by status */
  status?: "queued" | "sent" | "delivered" | "bounced" | "failed";

  /** Filter by recipient email */
  to?: string;

  /** Filter by sender email */
  from?: string;

  /** Filter by date range start */
  startDate?: string;

  /** Filter by date range end */
  endDate?: string;
}

/**
 * Email statistics.
 */
export interface EmailStats {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  complained: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}
