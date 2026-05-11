/**
 * Application Layer — GetCustomerLeadsUseCase
 *
 * Orchestrates the "list customer leads" feature.
 * Depends on the domain repository interface, never on infrastructure.
 *
 * Single Responsibility : one use-case class, one public method.
 * Open/Closed           : extend behaviour via new use-case classes.
 * Dependency Inversion  : depends on ICustomerLeadRepository abstraction.
 */

import type {
  ICustomerLeadRepository,
  CustomerLeadFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/customer-leads/ICustomerLeadRepository';
import type { CustomerLead } from '../../domain/customer-leads/CustomerLead';

// ─── Input DTO ────────────────────────────────────────────────────────────────

export interface GetCustomerLeadsInput {
  filters: CustomerLeadFilters;
  pagination: PaginationOptions;
}

// ─── Output DTO ───────────────────────────────────────────────────────────────

export type GetCustomerLeadsOutput = PaginatedResult<CustomerLead>;

// ─── Use Case ─────────────────────────────────────────────────────────────────

export class GetCustomerLeadsUseCase {
  constructor(private readonly repo: ICustomerLeadRepository) {}

  async execute(input: GetCustomerLeadsInput): Promise<GetCustomerLeadsOutput> {
    const { filters, pagination } = input;

    // Clamp pagination to safe defaults
    const safePagination: PaginationOptions = {
      page: Math.max(1, pagination.page),
      limit: Math.min(100, Math.max(1, pagination.limit)),
    };

    return this.repo.findAll(filters, safePagination);
  }
}
