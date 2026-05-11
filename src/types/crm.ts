export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost'
export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sending' | 'Sent' | 'Failed'

export interface Company {
  id: string
  name: string
  industry?: string | null
  website?: string | null
  address?: string | null
  region?: string | null
  deal_value: number
  currency_code: string
  active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  company_id?: string | null
  company_name?: string | null
  full_name: string
  job_title?: string | null
  farm_location?: string | null
  address?: string | null
  region?: string | null
  email: string
  phone?: string | null
  interested_in_webinar: boolean
  attended_webinar: boolean
  attended_at?: string | null
  active: boolean
  lead_status: LeadStatus
  last_activity_at?: string | null
  last_engagement_at?: string | null
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  campaign_type: 'WebinarWeekly' | 'NewsletterMonthly' | 'Custom'
  segment_json: Record<string, unknown>
  status: CampaignStatus
  scheduled_at?: string | null
  created_at: string
  updated_at: string
}
