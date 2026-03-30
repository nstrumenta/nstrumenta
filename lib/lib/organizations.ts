// Organization, invitation, and billing types for multi-tenant nstrumenta

export type OrgRole = 'owner' | 'admin' | 'member';
export type ProjectRole = 'owner' | 'admin' | 'viewer';
export type ProjectVisibility = 'public' | 'private';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type BillingPlan = 'free_trial' | 'pro' | 'enterprise';

export const INITIAL_CREDIT_CENTS = 2500; // $25.00

// Firestore: organizations/{orgId}
export interface Organization {
  name: string;
  slug: string; // URL-friendly identifier (unique)
  createdAt: number;
  createdBy: string; // userId
  avatarUrl?: string;
  description?: string;
}

// Firestore: organizations/{orgId}/members/{userId}
export interface OrgMember {
  role: OrgRole;
  addedAt: number;
  addedBy: string; // userId who invited
  email?: string; // denormalized for display
  displayName?: string; // denormalized for display
}

// Firestore: organizations/{orgId}/invitations/{invitationId}
export interface Invitation {
  email: string;
  role: OrgRole;
  invitedBy: string; // userId
  status: InvitationStatus;
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  acceptedBy?: string; // userId who accepted
}

// Firestore: organizations/{orgId}/billing
export interface OrgBilling {
  plan: BillingPlan;
  creditBalanceCents: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentMethodAttached: boolean;
  createdAt: number;
  updatedAt: number;
}

// Firestore: organizations/{orgId}/billing/usage/{YYYY-MM}
export interface MonthlyUsage {
  period: string; // YYYY-MM
  storageBytes: number;
  apiCalls: number;
  computeSeconds: number;
  dataTransferBytes: number;
  totalCostCents: number;
  lastUpdated: number;
}

// Extension to existing project model
// Firestore: projects/{projectId} (added fields)
export interface ProjectOrgFields {
  orgId: string;
  visibility: ProjectVisibility;
}

// Firestore: users/{userId} (added fields)
export interface UserProfileFields {
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  defaultOrgId?: string;
}

// API request/response types
export interface CreateOrgRequest {
  name: string;
  slug?: string; // auto-generated from name if not provided
}

export interface CreateOrgResponse {
  orgId: string;
  name: string;
  slug: string;
}

export interface InviteMemberRequest {
  email: string;
  role: OrgRole;
}

export interface InviteMemberResponse {
  invitationId: string;
  email: string;
  status: InvitationStatus;
  existingUser: boolean; // true if user already has an account
}

export interface AcceptInvitationRequest {
  invitationId: string;
  orgId: string;
}
