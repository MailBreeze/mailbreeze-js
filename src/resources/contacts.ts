import type { Fetcher } from "../http/fetcher";
import type {
  Contact,
  CreateContactParams,
  ListContactsParams,
  PaginatedList,
  SuppressReason,
  UpdateContactParams,
} from "../types";
import { BaseResource } from "./base";

/**
 * Contact management within a list.
 *
 * All contact operations require a list context. Get a contacts instance
 * by calling `mailbreeze.contacts(listId)`.
 *
 * @example
 * ```ts
 * const contacts = mailbreeze.contacts("list_xxx");
 *
 * // Create a contact
 * const contact = await contacts.create({
 *   email: "user@example.com",
 *   firstName: "John",
 *   lastName: "Doe",
 *   customFields: { company: "Acme Inc" },
 * });
 *
 * // List contacts
 * const { data, pagination } = await contacts.list({ status: "active" });
 * ```
 */
export class Contacts extends BaseResource {
  private readonly listId: string;

  constructor(fetcher: Fetcher, listId: string, domainId?: string) {
    super(fetcher, domainId);
    this.listId = listId;
  }

  protected override buildPath(path: string): string {
    return `/contact-lists/${this.listId}/contacts${path}`;
  }

  /**
   * Create a new contact in the list.
   *
   * @param params - Contact data
   * @returns Created contact record
   *
   * @example
   * ```ts
   * const contact = await contacts.create({
   *   email: "user@example.com",
   *   firstName: "Jane",
   *   lastName: "Smith",
   *   customFields: { plan: "pro" },
   * });
   * ```
   */
  async create(params: CreateContactParams): Promise<Contact> {
    return this._post<Contact>("", params);
  }

  /**
   * List contacts in the list.
   *
   * @param params - Filter and pagination options
   * @returns Paginated list of contacts
   *
   * @example
   * ```ts
   * const { data, pagination } = await contacts.list({
   *   status: "active",
   *   page: 1,
   *   limit: 50,
   * });
   * ```
   */
  async list(params?: ListContactsParams): Promise<PaginatedList<Contact>> {
    const query: Record<string, unknown> = {
      ...this.listParamsToQuery(params),
    };

    if (params?.status) query.status = params.status;

    const response = await this._get<{ contacts: Contact[]; pagination: PaginatedList<Contact>["pagination"] }>(
      "",
      Object.keys(query).length > 0 ? query : undefined,
    );

    return {
      data: response.contacts,
      pagination: response.pagination,
    };
  }

  /**
   * Get a contact by ID.
   *
   * @param id - Contact ID
   * @returns Contact record
   *
   * @example
   * ```ts
   * const contact = await contacts.get("contact_xxx");
   * ```
   */
  async get(id: string): Promise<Contact> {
    return this._get<Contact>(`/${id}`);
  }

  /**
   * Update a contact.
   *
   * @param id - Contact ID
   * @param params - Fields to update
   * @returns Updated contact record
   *
   * @example
   * ```ts
   * const contact = await contacts.update("contact_xxx", {
   *   firstName: "Updated Name",
   *   customFields: { plan: "enterprise" },
   * });
   * ```
   */
  async update(id: string, params: UpdateContactParams): Promise<Contact> {
    return this._put<Contact>(`/${id}`, params);
  }

  /**
   * Delete a contact.
   *
   * @param id - Contact ID
   * @returns void
   *
   * @example
   * ```ts
   * await contacts.delete("contact_xxx");
   * ```
   */
  async delete(id: string): Promise<void> {
    await this._delete<void>(`/${id}`);
  }

  /**
   * Suppress a contact.
   *
   * Suppressed contacts will not receive any emails.
   * This is different from unsubscribing - suppression is
   * typically used for bounces, complaints, or manual removal.
   *
   * @param id - Contact ID
   * @param reason - Reason for suppression
   * @returns void
   *
   * @example
   * ```ts
   * await contacts.suppress("contact_xxx", "manual");
   * ```
   */
  async suppress(id: string, reason: SuppressReason): Promise<void> {
    await this._post<void>(`/${id}/suppress`, { reason });
  }
}
