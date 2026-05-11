/**
 * Domain Layer — ICustomerLeadRepository
 *
 * Repository contract owned by the domain.
 * Infrastructure implements this; the application layer depends only on this interface.
 * This inverts the dependency so the domain stays pure (Dependency Inversion Principle).
 */

import type { CustomerLead } from './CustomerLead';
import type { LeadStatus, ContactStatus } from './CustomerLead';

// ─── Query Filters ────────────────────────────────────────────────────────────

export interface CustomerLeadFilters {
  status?: ContactStatus;
  leadStatus?: LeadStatus;
  region?: string;
  webinarAttended?: boolean;
  optinNewsletter?: boolean;
  search?: string; // full-text search on name / email
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationOptions {
  page: number; // 1-based
  limit: number; // max rows per page
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Repository Contract ──────────────────────────────────────────────────────

export interface ICustomerLeadRepository {
  /**
   * Return a paginated, filtered list of leads.
   */
  findAll(
    filters: CustomerLeadFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<CustomerLead>>;

  /**
   * Fetch a single lead by its primary key.
   * Returns null when not found.
   */
  findById(id: string): Promise<CustomerLead | null>;

  /**
   * Persist updates to an existing lead.
   * Returns the updated entity.
   */
  update(id: string, partial: Partial<CustomerLead>): Promise<CustomerLead>;

  /**
   * Hard-delete a lead record.
   */
  delete(id: string): Promise<void>;
}
