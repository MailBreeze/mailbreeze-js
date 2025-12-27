/**
 * Parameters for creating an attachment upload.
 */
export interface CreateAttachmentUploadParams {
  /** Original filename */
  fileName: string;

  /** MIME type of the file */
  contentType: string;

  /** File size in bytes */
  fileSize: number;

  /** Whether this is an inline attachment (embedded image) */
  inline?: boolean;
}

/**
 * Result of creating an attachment upload.
 */
export interface CreateAttachmentUploadResult {
  /** Attachment ID to use when sending emails */
  attachmentId: string;

  /** Presigned URL for uploading the file */
  uploadUrl: string;

  /** Upload token for confirmation */
  uploadToken: string;

  /** Expiration time for the upload URL */
  expiresAt: string;
}

/**
 * Parameters for confirming an attachment upload.
 */
export interface ConfirmAttachmentParams {
  /** Upload token received from createUpload (same as attachmentId) */
  uploadToken?: string;

  /** Attachment ID (alternative to uploadToken) */
  attachmentId?: string;
}

/**
 * Attachment record.
 */
export interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  status: "pending" | "uploaded" | "expired";
  createdAt: string;
  expiresAt: string;
}
