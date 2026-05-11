/**
 * Infrastructure — Supabase Row Types
 *
 * Mirrors the exact column names and types returned by PostgREST.
 * Keep in sync with your Supabase schema.
 */

export interface CustomerLeadRow {
  id: string;
  subscriber_id: string | null;
  company_id: string | null;
  name: string;
  email: string;
  contact_number: string | null;
  job_title: string | null;
  farm_location: string | null;
  region: string | null;
  status: 'active' | 'inactive';
  lead_status:
    | 'new'
    | 'qualified'
    | 'contacted'
    | 'proposal'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';
  label: string | null;
  webinar_attended: boolean;
  webinar_date_attended: string | null;
  optin_newsletter: boolean;
  optin_webinar: boolean | null;
  potential_deal_value_php: number | null;
  notes: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}
