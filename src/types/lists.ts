import type { ListParams } from "./common";

/**
 * Parameters for creating a contact list.
 */
export interface CreateListParams {
  /** List name */
  name: string;

  /** Optional description */
  description?: string;

  /** Custom field definitions */
  customFields?: CustomFieldDefinition[];
}

/**
 * Parameters for updating a contact list.
 */
export interface UpdateListParams {
  /** List name */
  name?: string;

  /** Optional description */
  description?: string;

  /** Custom field definitions */
  customFields?: CustomFieldDefinition[];
}

/**
 * Custom field definition for a contact list.
 */
export interface CustomFieldDefinition {
  /** Field key (used in API) */
  key: string;

  /** Display label */
  label: string;

  /** Field type */
  type: "text" | "number" | "date" | "boolean" | "select";

  /** Whether field is required */
  required?: boolean;

  /** Default value */
  defaultValue?: unknown;

  /** Options for select type */
  options?: string[];
}

/**
 * Contact list record.
 */
export interface ContactList {
  id: string;
  name: string;
  description?: string;
  customFields: CustomFieldDefinition[];
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parameters for listing contact lists.
 */
export type ListListsParams = ListParams;

/**
 * Contact list statistics.
 */
export interface ListStats {
  totalContacts: number;
  activeContacts: number;
  unsubscribedContacts: number;
  bouncedContacts: number;
  complainedContacts: number;
  suppressedContacts: number;
}
