/**
 * Domain Layer — CustomerLead Entity
 *
 * Pure domain model. Zero framework / library dependencies.
 * Enforces business invariants via value objects and factory method.
 */

// ─── Value Objects ────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'qualified'
  | 'contacted'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'partner';

export type ContactStatus = 'active' | 'inactive';

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'qualified',
  'contacted',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
  'partner',
];

export const CONTACT_STATUSES: ContactStatus[] = ['active', 'inactive'];

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface CustomerLeadProps {
  id: string;
  subscriberId: string | null;
  companyId: string | null;
  name: string;
  email: string;
  contactNumber: string | null;
  jobTitle: string | null;
  farmLocation: string | null;
  region: string | null;
  status: ContactStatus;
  leadStatus: LeadStatus;
  label: string | null;
  webinarAttended: boolean;
  webinarDateAttended: string | null; // ISO date string
  optinNewsletter: boolean;
  optinWebinar: boolean;
  potentialDealValuePhp: number | null;
  notes: string | null;
  farmNotes: string | null;
  unsubscribedAt: string | null; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

export class CustomerLead {
  private constructor(private readonly props: CustomerLeadProps) {}

  // ── Factory ────────────────────────────────────────────────────────────────

  static create(props: CustomerLeadProps): CustomerLead {
    CustomerLead.assertValidLeadStatus(props.leadStatus);
    CustomerLead.assertValidContactStatus(props.status);
    CustomerLead.assertValidEmail(props.email);

    return new CustomerLead({ ...props });
  }

  // ── Guards ─────────────────────────────────────────────────────────────────

  private static assertValidLeadStatus(value: string): asserts value is LeadStatus {
    if (!LEAD_STATUSES.includes(value as LeadStatus)) {
      throw new Error(`Invalid lead_status "${value}". Allowed: ${LEAD_STATUSES.join(', ')}.`);
    }
  }

  private static assertValidContactStatus(value: string): asserts value is ContactStatus {
    if (!CONTACT_STATUSES.includes(value as ContactStatus)) {
      throw new Error(`Invalid status "${value}". Allowed: ${CONTACT_STATUSES.join(', ')}.`);
    }
  }

  private static assertValidEmail(email: string): void {
    if (!email || !email.includes('@')) {
      throw new Error(`Invalid email address: "${email}".`);
    }
  }

  // ── Business queries ───────────────────────────────────────────────────────

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  get isUnsubscribed(): boolean {
    return this.props.unsubscribedAt !== null;
  }

  get isClosed(): boolean {
    return this.props.leadStatus === 'closed_won' || this.props.leadStatus === 'closed_lost';
  }

  get hasEngaged(): boolean {
    return this.props.webinarAttended || this.props.optinNewsletter;
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get id(): string {
    return this.props.id;
  }
  get subscriberId(): string | null {
    return this.props.subscriberId;
  }
  get companyId(): string | null {
    return this.props.companyId;
  }
  get name(): string {
    return this.props.name;
  }
  get email(): string {
    return this.props.email;
  }
  get contactNumber(): string | null {
    return this.props.contactNumber;
  }
  get jobTitle(): string | null {
    return this.props.jobTitle;
  }
  get farmLocation(): string | null {
    return this.props.farmLocation;
  }
  get region(): string | null {
    return this.props.region;
  }
  get status(): ContactStatus {
    return this.props.status;
  }
  get leadStatus(): LeadStatus {
    return this.props.leadStatus;
  }
  get label(): string | null {
    return this.props.label;
  }
  get webinarAttended(): boolean {
    return this.props.webinarAttended;
  }
  get webinarDateAttended(): string | null {
    return this.props.webinarDateAttended;
  }
  get optinNewsletter(): boolean {
    return this.props.optinNewsletter;
  }
  get optinWebinar(): boolean {
    return this.props.optinWebinar;
  }
  get potentialDealValuePhp(): number | null {
    return this.props.potentialDealValuePhp;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get farmNotes(): string | null {
    return this.props.farmNotes;
  }
  get unsubscribedAt(): string | null {
    return this.props.unsubscribedAt;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }
  get updatedAt(): string {
    return this.props.updatedAt;
  }

  toJSON(): CustomerLeadProps {
    return { ...this.props };
  }
}
