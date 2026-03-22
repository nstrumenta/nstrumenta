// Organization, invitation, and billing models for the frontend
import { DocumentData } from 'firebase/firestore';

export type OrgRole = 'owner' | 'admin' | 'member';
export type ProjectVisibility = 'public' | 'private';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type BillingPlan = 'free_trial' | 'pro' | 'enterprise';

export const INITIAL_CREDIT_CENTS = 2500; // $25.00

export interface OrganizationDoc extends DocumentData {
  id?: string;
  name: string;
  slug: string;
  createdAt: number;
  createdBy: string;
  avatarUrl?: string;
  description?: string;
}

export interface OrgMemberDoc extends DocumentData {
  id?: string; // userId
  role: OrgRole;
  addedAt: number;
  addedBy: string;
  email?: string;
  displayName?: string;
}

export interface InvitationDoc extends DocumentData {
  id?: string;
  email: string;
  role: OrgRole;
  invitedBy: string;
  status: InvitationStatus;
  createdAt: number;
  expiresAt: number;
}

export interface OrgBillingDoc extends DocumentData {
  plan: BillingPlan;
  creditBalanceCents: number;
  stripeCustomerId?: string;
  paymentMethodAttached: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateOrgRequest {
  name: string;
  slug?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: OrgRole;
}
