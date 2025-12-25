// Main client
export { MailBreeze } from "./client";

// Errors
export {
  AuthenticationError,
  MailBreezeError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ValidationError,
} from "./http/errors";

// Types
export type {
  Attachment,
  BatchVerifyParams,
  BatchVerifyResult,
  CancelEnrollmentResult,
  ConfirmAttachmentParams,
  Contact,
  ContactList,
  // Attachments
  CreateAttachmentUploadParams,
  CreateAttachmentUploadResult,
  // Contacts
  CreateContactParams,
  // Lists
  CreateListParams,
  CustomFieldDefinition,
  DomainContext,
  Email,
  EmailStats,
  Enrollment,
  // Automations
  EnrollParams,
  EnrollResult,
  ListContactsParams,
  ListEmailsParams,
  ListEnrollmentsParams,
  ListListsParams,
  ListParams,
  ListStats,
  ListVerificationsParams,
  // Common
  MailBreezeConfig,
  PaginatedList,
  Pagination,
  // Emails
  SendEmailParams,
  SendEmailResult,
  SuppressReason,
  UpdateContactParams,
  UpdateListParams,
  VerificationStats,
  VerificationStatus,
  // Verification
  VerifyEmailResult,
} from "./types";
