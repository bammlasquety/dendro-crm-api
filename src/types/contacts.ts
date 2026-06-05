/**
 * Shared contact / lead types used across ContactsList, ContactEditDialog, and CustomerLeads.
 */

export type LeadStatus =
  | 'new'
  | 'qualified'
  | 'contacted'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'partner'

export interface ContactRow {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  leadStatus: LeadStatus
  webinarOptIn: boolean
  webinarAttended: boolean
  newsletterOptIn: boolean
  createdAt: string           // ISO timestamp from created_at
  // Optional — must be omitted (not set to undefined) when absent
  contactNumber?: string
  jobTitle?: string
  farmLocation?: string
  region?: string
  companyName?: string
  label?: string
}
