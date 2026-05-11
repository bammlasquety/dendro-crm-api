/**
 * Infrastructure Layer — CustomerLead Mapper
 *
 * Bidirectional translation between:
 *   - Supabase snake_case DB rows  ↔  camelCase domain entities
 *
 * Keeping mapping logic here means neither the domain nor the
 * HTTP layer needs to know about DB column naming conventions.
 */

import { CustomerLead } from '../../domain/customer-leads/CustomerLead';
import type { CustomerLeadRow } from '../supabase/CustomerLeadRow';

export const customerLeadMapper = {
  /**
   * DB row → Domain entity
   */
  toDomain(row: CustomerLeadRow): CustomerLead {
    return CustomerLead.create({
      id: row.id,
      subscriberId: row.subscriber_id,
      companyId: row.company_id,
      name: row.name,
      email: row.email,
      contactNumber: row.contact_number,
      jobTitle: row.job_title,
      farmLocation: row.farm_location,
      region: row.region,
      status: row.status,
      leadStatus: row.lead_status,
      label: row.label,
      webinarAttended: row.webinar_attended,
      webinarDateAttended: row.webinar_date_attended,
      optinNewsletter: row.optin_newsletter,
      optinWebinar: row.optin_webinar ?? false,
      potentialDealValuePhp: row.potential_deal_value_php,
      notes: row.notes,
      unsubscribedAt: row.unsubscribed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  },

  /**
   * Partial domain props → DB patch object (snake_case)
   * Used in update operations — only include defined keys.
   */
  toRow(partial: Partial<CustomerLead>): Partial<CustomerLeadRow> {
    const patch: Partial<CustomerLeadRow> = {};

    if (partial.name !== undefined) patch.name = partial.name;
    if (partial.email !== undefined) patch.email = partial.email;
    if (partial.contactNumber !== undefined) patch.contact_number = partial.contactNumber;
    if (partial.jobTitle !== undefined) patch.job_title = partial.jobTitle;
    if (partial.farmLocation !== undefined) patch.farm_location = partial.farmLocation;
    if (partial.region !== undefined) patch.region = partial.region;
    if (partial.status !== undefined) patch.status = partial.status;
    if (partial.leadStatus !== undefined) patch.lead_status = partial.leadStatus;
    if (partial.label !== undefined) patch.label = partial.label;
    if (partial.webinarAttended !== undefined) patch.webinar_attended = partial.webinarAttended;
    if (partial.webinarDateAttended !== undefined)
      patch.webinar_date_attended = partial.webinarDateAttended;
    if (partial.optinNewsletter !== undefined) patch.optin_newsletter = partial.optinNewsletter;
    if (partial.optinWebinar !== undefined) patch.optin_webinar = partial.optinWebinar;
    if (partial.potentialDealValuePhp !== undefined)
      patch.potential_deal_value_php = partial.potentialDealValuePhp;
    if (partial.notes !== undefined) patch.notes = partial.notes;

    return patch;
  },

  /**
   * Domain entity → JSON-safe response DTO for API responses.
   * Keeps API shape stable even if domain internals change.
   */
  toResponseDto(lead: CustomerLead) {
    return {
      id: lead.id,
      subscriberId: lead.subscriberId,
      companyId: lead.companyId,
      name: lead.name,
      email: lead.email,
      contactNumber: lead.contactNumber,
      jobTitle: lead.jobTitle,
      farmLocation: lead.farmLocation,
      region: lead.region,
      status: lead.status,
      leadStatus: lead.leadStatus,
      label: lead.label,
      webinarAttended: lead.webinarAttended,
      webinarDateAttended: lead.webinarDateAttended,
      optinNewsletter: lead.optinNewsletter,
      optinWebinar: lead.optinWebinar,
      potentialDealValuePhp: lead.potentialDealValuePhp,
      notes: lead.notes,
      unsubscribedAt: lead.unsubscribedAt,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      // Derived / computed fields exposed to the UI
      isActive: lead.isActive,
      isClosed: lead.isClosed,
      hasEngaged: lead.hasEngaged,
    };
  },
};
