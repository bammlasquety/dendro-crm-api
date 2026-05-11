/**
 * Infrastructure Layer — SupabaseCustomerLeadRepository
 *
 * Concrete implementation of ICustomerLeadRepository using Supabase / PostgREST.
 *
 * Responsibilities:
 *  - Translate domain query objects → Supabase query builder calls
 *  - Map raw DB rows → CustomerLead domain entities (via mapper)
 *  - Handle Supabase-specific errors and re-throw as domain errors
 *
 * This is the ONLY place in the codebase that knows about Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomerLead } from '../../domain/customer-leads/CustomerLead';
import type {
  ICustomerLeadRepository,
  CustomerLeadFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/customer-leads/ICustomerLeadRepository';
import { NotFoundError } from '../../application/errors/NotFoundError';
import { customerLeadMapper } from '../supabase/CustomerLeadMapper';
import type { CustomerLeadRow } from '../supabase/CustomerLeadRow';

const TABLE = 'customer_leads' as const;

export class SupabaseCustomerLeadRepository implements ICustomerLeadRepository {
  constructor(private readonly db: SupabaseClient) {}

  // ─── findAll ──────────────────────────────────────────────────────────────

  async findAll(
    filters: CustomerLeadFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<CustomerLead>> {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Start query — request count for pagination metadata
    let query = this.db
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // ── Apply optional filters ─────────────────────────────────────────────

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.leadStatus) {
      query = query.eq('lead_status', filters.leadStatus);
    }

    if (filters.region) {
      query = query.ilike('region', `%${filters.region}%`);
    }

    if (filters.webinarAttended !== undefined) {
      query = query.eq('webinar_attended', filters.webinarAttended);
    }

    if (filters.optinNewsletter !== undefined) {
      query = query.eq('optin_newsletter', filters.optinNewsletter);
    }

    if (filters.search) {
      // PostgREST `or` for name / email substring search
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`[SupabaseCustomerLeadRepository.findAll] ${error.message}`);
    }

    const rows = (data ?? []) as CustomerLeadRow[];
    const total = count ?? 0;

    return {
      data: rows.map((row) => customerLeadMapper.toDomain(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── findById ─────────────────────────────────────────────────────────────

  async findById(id: string): Promise<CustomerLead | null> {
    const { data, error } = await this.db
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle<CustomerLeadRow>();

    if (error) {
      throw new Error(`[SupabaseCustomerLeadRepository.findById] ${error.message}`);
    }

    if (!data) return null;

    return customerLeadMapper.toDomain(data);
  }

  // ─── update ───────────────────────────────────────────────────────────────

  async update(id: string, partial: Partial<CustomerLead>): Promise<CustomerLead> {
    const patch = customerLeadMapper.toRow(partial);

    const { data, error } = await this.db
      .from(TABLE)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle<CustomerLeadRow>();

    if (error) {
      throw new Error(`[SupabaseCustomerLeadRepository.update] ${error.message}`);
    }

    if (!data) {
      throw new NotFoundError(`Customer lead "${id}" not found during update.`);
    }

    return customerLeadMapper.toDomain(data);
  }

  // ─── delete ───────────────────────────────────────────────────────────────

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from(TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(`[SupabaseCustomerLeadRepository.delete] ${error.message}`);
    }
  }
}
