import type { ListParams } from "./common";

/**
 * Result of verifying a single email.
 */
export interface VerifyEmailResult {
  /** The email address that was verified */
  email: string;

  /** Whether the email is valid and deliverable */
  isValid: boolean;

  /** Detailed result category */
  result: "valid" | "invalid" | "risky" | "unknown";

  /** Reason for the result */
  reason: string;

  /** Whether this was a cached result */
  cached: boolean;

  /** Risk score (0-100, lower is better) */
  riskScore?: number;

  /** Additional details */
  details?: {
    isFreeProvider?: boolean;
    isDisposable?: boolean;
    isRoleAccount?: boolean;
    hasMxRecords?: boolean;
    isSpamTrap?: boolean;
  };
}

/**
 * Parameters for batch verification.
 */
export interface BatchVerifyParams {
  /** Array of email addresses to verify (max 1000) */
  emails: string[];
}

/**
 * Result of starting a batch verification.
 */
export interface BatchVerifyResult {
  /** Verification batch ID for polling */
  verificationId: string;

  /** Total emails in batch */
  totalEmails: number;

  /** Credits deducted for this batch */
  creditsDeducted: number;

  /** Current status */
  status: "pending" | "processing" | "completed" | "failed";

  /** Results (only populated when all emails are cached) */
  results?: VerifyEmailResult[];
}

/**
 * Batch verification status response.
 */
export interface VerificationStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalEmails: number;
  processedEmails: number;
  creditsDeducted: number;
  createdAt: string;
  completedAt?: string;

  /** Results when completed */
  results?: VerifyEmailResult[];

  /** Analytics summary when completed */
  analytics?: {
    valid: number;
    invalid: number;
    risky: number;
    unknown: number;
  };
}

/**
 * Parameters for listing verifications.
 */
export interface ListVerificationsParams extends ListParams {
  /** Filter by status */
  status?: "pending" | "processing" | "completed" | "failed";
}

/**
 * Verification statistics.
 */
export interface VerificationStats {
  totalVerified: number;
  valid: number;
  invalid: number;
  risky: number;
  unknown: number;
  cached: number;
  creditsUsed: number;
}
