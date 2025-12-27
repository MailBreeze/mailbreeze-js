import type {
  Attachment,
  ConfirmAttachmentParams,
  CreateAttachmentUploadParams,
  CreateAttachmentUploadResult,
} from "../types";
import { BaseResource } from "./base";

/**
 * Email attachment handling.
 *
 * Attachments use a two-step process:
 * 1. Create an upload URL with `createUpload()`
 * 2. Upload the file directly to the URL
 * 3. Confirm the upload with `confirm()`
 * 4. Use the attachment ID when sending emails
 *
 * @example
 * ```ts
 * // Create upload
 * const { attachmentId, uploadUrl, uploadToken } = await mailbreeze.attachments.createUpload({
 *   fileName: "report.pdf",
 *   contentType: "application/pdf",
 *   fileSize: 1024000,
 * });
 *
 * // Upload file directly
 * await fetch(uploadUrl, {
 *   method: "PUT",
 *   body: fileBuffer,
 *   headers: { "Content-Type": "application/pdf" },
 * });
 *
 * // Confirm upload
 * const attachment = await mailbreeze.attachments.confirm({
 *   uploadToken,
 * });
 *
 * // Use in email
 * await mailbreeze.emails.send({
 *   from: "hello@yourdomain.com",
 *   to: "user@example.com",
 *   subject: "Your report",
 *   html: "<p>Please find the report attached.</p>",
 *   attachmentIds: [attachmentId],
 * });
 * ```
 */
export class Attachments extends BaseResource {
  /**
   * Create a presigned URL for uploading an attachment.
   *
   * @param params - Attachment metadata
   * @returns Upload URL and attachment ID
   *
   * @example
   * ```ts
   * const { attachmentId, uploadUrl, uploadToken, expiresAt } =
   *   await mailbreeze.attachments.createUpload({
   *     fileName: "document.pdf",
   *     contentType: "application/pdf",
   *     fileSize: 2048000,
   *   });
   * ```
   */
  async createUpload(params: CreateAttachmentUploadParams): Promise<CreateAttachmentUploadResult> {
    return this._post<CreateAttachmentUploadResult>("/attachments/presigned-url", {
      filename: params.fileName,
      contentType: params.contentType,
      size: params.fileSize,
      inline: params.inline,
    });
  }

  /**
   * Confirm that an attachment has been uploaded.
   *
   * Must be called after uploading the file to the presigned URL.
   * The attachment is only available for use after confirmation.
   *
   * @param params - Confirmation parameters including upload token
   * @returns Confirmed attachment record
   *
   * @example
   * ```ts
   * const attachment = await mailbreeze.attachments.confirm({
   *   uploadToken: "token_xxx",
   * });
   * console.log(attachment.status); // "uploaded"
   * ```
   */
  async confirm(params: ConfirmAttachmentParams): Promise<Attachment> {
    // Backend expects the attachment ID in the URL path
    const attachmentId = params.uploadToken || params.attachmentId;
    return this._post<Attachment>(`/attachments/${attachmentId}/confirm`, {});
  }
}
