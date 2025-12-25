import { Fetcher } from "./http/fetcher";
import { Attachments, Automations, Contacts, Emails, Lists, Verification } from "./resources";
import type { MailBreezeConfig } from "./types/common";

const DEFAULT_BASE_URL = "https://api.mailbreeze.com";
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_RETRIES = 3;

/**
 * MailBreeze SDK client.
 *
 * Create a client with your API key to access all MailBreeze APIs.
 *
 * @example
 * ```ts
 * import { MailBreeze } from "mailbreeze";
 *
 * const mailbreeze = new MailBreeze({
 *   apiKey: "sk_live_xxx",
 * });
 *
 * // Send an email
 * const result = await mailbreeze.emails.send({
 *   from: "hello@yourdomain.com",
 *   to: "user@example.com",
 *   subject: "Hello!",
 *   html: "<h1>Welcome!</h1>",
 * });
 *
 * // Create a contact
 * const contacts = mailbreeze.contacts("list_xxx");
 * const contact = await contacts.create({
 *   email: "user@example.com",
 *   firstName: "John",
 * });
 * ```
 */
export class MailBreeze {
  /**
   * Email sending and management.
   */
  public readonly emails: Emails;

  /**
   * Email attachment handling.
   */
  public readonly attachments: Attachments;

  /**
   * Contact list management.
   */
  public readonly lists: Lists;

  /**
   * Email verification services.
   */
  public readonly verification: Verification;

  /**
   * Automation enrollment management.
   */
  public readonly automations: Automations;

  private readonly fetcher: Fetcher;
  private readonly domainId?: string;

  /**
   * Create a new MailBreeze client.
   *
   * @param config - Client configuration
   *
   * @example
   * ```ts
   * // Basic usage
   * const mailbreeze = new MailBreeze({
   *   apiKey: "sk_live_xxx",
   * });
   *
   * // With custom options
   * const mailbreeze = new MailBreeze({
   *   apiKey: "sk_live_xxx",
   *   baseUrl: "https://api.eu.mailbreeze.com",
   *   timeout: 60000,
   *   maxRetries: 5,
   * });
   * ```
   */
  constructor(config: MailBreezeConfig) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }

    this.fetcher = new Fetcher({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      authStyle: config.authStyle ?? "header",
    });

    // Initialize resources
    this.emails = new Emails(this.fetcher, this.domainId);
    this.attachments = new Attachments(this.fetcher, this.domainId);
    this.lists = new Lists(this.fetcher, this.domainId);
    this.verification = new Verification(this.fetcher, this.domainId);
    this.automations = new Automations(this.fetcher, this.domainId);
  }

  /**
   * Get a contacts resource for a specific list.
   *
   * @param listId - Contact list ID
   * @returns Contacts resource bound to the list
   *
   * @example
   * ```ts
   * const contacts = mailbreeze.contacts("list_xxx");
   *
   * // Create a contact in this list
   * const contact = await contacts.create({
   *   email: "user@example.com",
   * });
   *
   * // List contacts in this list
   * const { data } = await contacts.list();
   * ```
   */
  contacts(listId: string): Contacts {
    return new Contacts(this.fetcher, listId, this.domainId);
  }
}
