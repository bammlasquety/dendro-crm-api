/**
 * Interface Layer — Query Validator Middleware
 */

import type { Request, Response, NextFunction } from 'express';
import type {
  CustomerLeadFilters,
  PaginationOptions,
} from '../../../domain/customer-leads/ICustomerLeadRepository';
import { LEAD_STATUSES, CONTACT_STATUSES } from '../../../domain/customer-leads/CustomerLead';

declare module 'express-serve-static-core' {
  interface Locals {
    filters: CustomerLeadFilters;
    pagination: PaginationOptions;
  }
}

export function validateCustomerLeadsQuery(req: Request, res: Response, next: NextFunction): void {
  const errors: string[] = [];
  const q = req.query;

  // ── Pagination ─────────────────────────────────────────────────────────────

  const page = q['page'] ? Number(q['page']) : 1;
  const limit = q['limit'] ? Number(q['limit']) : 25;

  if (!Number.isInteger(page) || page < 1) errors.push('`page` must be a positive integer.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    errors.push('`limit` must be between 1 and 100.');

  // ── Narrow all query params to string | undefined ──────────────────────────
  // req.query values are string | ParsedQs | string[] | ParsedQs[]
  // typeof guard is the only way to satisfy @typescript-eslint/no-base-to-string

  const status = typeof q['status'] === 'string' ? q['status'] : undefined;
  const leadStatus = typeof q['leadStatus'] === 'string' ? q['leadStatus'] : undefined;
  const region = typeof q['region'] === 'string' ? q['region'] : undefined;
  const webinarAttended =
    typeof q['webinarAttended'] === 'string' ? q['webinarAttended'] : undefined;
  const optinNewsletter =
    typeof q['optinNewsletter'] === 'string' ? q['optinNewsletter'] : undefined;
  const search = typeof q['search'] === 'string' ? q['search'] : undefined;

  // ── Filters ────────────────────────────────────────────────────────────────

  const filters: CustomerLeadFilters = {};

  if (status) {
    if (!CONTACT_STATUSES.includes(status as (typeof CONTACT_STATUSES)[number])) {
      errors.push(`\`status\` must be one of: ${CONTACT_STATUSES.join(', ')}.`);
    } else {
      filters.status = status as (typeof CONTACT_STATUSES)[number];
    }
  }

  if (leadStatus) {
    if (!LEAD_STATUSES.includes(leadStatus as (typeof LEAD_STATUSES)[number])) {
      errors.push(`\`leadStatus\` must be one of: ${LEAD_STATUSES.join(', ')}.`);
    } else {
      filters.leadStatus = leadStatus as (typeof LEAD_STATUSES)[number];
    }
  }

  if (region) {
    filters.region = region.trim();
  }

  if (webinarAttended !== undefined) {
    const v = webinarAttended.toLowerCase();
    if (v !== 'true' && v !== 'false') {
      errors.push('`webinarAttended` must be "true" or "false".');
    } else {
      filters.webinarAttended = v === 'true';
    }
  }

  if (optinNewsletter !== undefined) {
    const v = optinNewsletter.toLowerCase();
    if (v !== 'true' && v !== 'false') {
      errors.push('`optinNewsletter` must be "true" or "false".');
    } else {
      filters.optinNewsletter = v === 'true';
    }
  }

  if (search) {
    if (search.trim().length > 100) {
      errors.push('`search` must not exceed 100 characters.');
    } else {
      filters.search = search.trim();
    }
  }

  // ── Return errors or continue ──────────────────────────────────────────────

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters.', details: errors },
    });
    return;
  }

  res.locals['filters'] = filters;
  res.locals['pagination'] = { page, limit };

  next();
}
