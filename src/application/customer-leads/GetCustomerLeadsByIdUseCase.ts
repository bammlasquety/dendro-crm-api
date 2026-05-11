/**
 * Application Layer — GetCustomerLeadByIdUseCase
 *
 * Fetches a single lead by UUID.
 * Raises a domain-safe NotFoundError when the record does not exist.
 */

import type { ICustomerLeadRepository } from '../../domain/customer-leads/ICustomerLeadRepository';
import type { CustomerLead } from '../../domain/customer-leads/CustomerLead';
import { NotFoundError } from '../errors/NotFoundError';

export interface GetCustomerLeadByIdInput {
  id: string;
}

export class GetCustomerLeadByIdUseCase {
  constructor(private readonly repo: ICustomerLeadRepository) {}

  async execute(input: GetCustomerLeadByIdInput): Promise<CustomerLead> {
    const lead = await this.repo.findById(input.id);

    if (!lead) {
      throw new NotFoundError(`Customer lead with id "${input.id}" was not found.`);
    }

    return lead;
  }
}
