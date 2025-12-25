import type {
  ContactList,
  CreateListParams,
  ListListsParams,
  ListStats,
  PaginatedList,
  UpdateListParams,
} from "../types";
import { BaseResource } from "./base";

/**
 * Contact list management.
 *
 * @example
 * ```ts
 * // Create a list
 * const list = await mailbreeze.lists.create({
 *   name: "Newsletter Subscribers",
 *   description: "Weekly newsletter recipients",
 *   customFields: [
 *     { key: "company", label: "Company", type: "text" },
 *     { key: "plan", label: "Plan", type: "select", options: ["free", "pro", "enterprise"] },
 *   ],
 * });
 *
 * // Get list stats
 * const stats = await mailbreeze.lists.stats(list.id);
 * console.log(stats.activeContacts);
 * ```
 */
export class Lists extends BaseResource {
  /**
   * Create a new contact list.
   *
   * @param params - List configuration
   * @returns Created list record
   *
   * @example
   * ```ts
   * const list = await mailbreeze.lists.create({
   *   name: "VIP Customers",
   *   customFields: [
   *     { key: "tier", label: "Tier", type: "select", options: ["gold", "platinum"] },
   *   ],
   * });
   * ```
   */
  async create(params: CreateListParams): Promise<ContactList> {
    return this._post<ContactList>("/contact-lists", params);
  }

  /**
   * List all contact lists.
   *
   * @param params - Pagination options
   * @returns Paginated list of contact lists
   *
   * @example
   * ```ts
   * const { data, pagination } = await mailbreeze.lists.list({ page: 1, limit: 10 });
   * ```
   */
  async list(params?: ListListsParams): Promise<PaginatedList<ContactList>> {
    const response = await this._get<{ data: ContactList[]; pagination: PaginatedList<ContactList>["pagination"] }>(
      "/contact-lists",
      this.listParamsToQuery(params),
    );
    return this.extractPaginatedList(response);
  }

  /**
   * Get a contact list by ID.
   *
   * @param id - List ID
   * @returns Contact list record
   *
   * @example
   * ```ts
   * const list = await mailbreeze.lists.get("list_xxx");
   * ```
   */
  async get(id: string): Promise<ContactList> {
    return this._get<ContactList>(`/contact-lists/${id}`);
  }

  /**
   * Update a contact list.
   *
   * @param id - List ID
   * @param params - Fields to update
   * @returns Updated list record
   *
   * @example
   * ```ts
   * const list = await mailbreeze.lists.update("list_xxx", {
   *   name: "Updated List Name",
   * });
   * ```
   */
  async update(id: string, params: UpdateListParams): Promise<ContactList> {
    return this._patch<ContactList>(`/contact-lists/${id}`, params);
  }

  /**
   * Delete a contact list.
   *
   * Warning: This will also delete all contacts in the list.
   *
   * @param id - List ID
   * @returns void
   *
   * @example
   * ```ts
   * await mailbreeze.lists.delete("list_xxx");
   * ```
   */
  async delete(id: string): Promise<void> {
    await this._delete<void>(`/contact-lists/${id}`);
  }

  /**
   * Get statistics for a contact list.
   *
   * @param id - List ID
   * @returns List statistics
   *
   * @example
   * ```ts
   * const stats = await mailbreeze.lists.stats("list_xxx");
   * console.log(`Active: ${stats.activeContacts}, Bounced: ${stats.bouncedContacts}`);
   * ```
   */
  async stats(id: string): Promise<ListStats> {
    return this._get<ListStats>(`/contact-lists/${id}/stats`);
  }
}
