
import React from 'react';

export enum LeadStatus {
  NEW = 'NEW',
  DRAFTING = 'DRAFTING',
  REVIEW = 'REVIEW',
  READY = 'READY',
  SENT = 'SENT',
  ARCHIVED = 'ARCHIVED'
}

export type ViewType = 'dashboard' | 'pipeline' | 'sources' | 'campaigns';

export type LeadSourceType = 'google' | 'linkedin' | 'directories' | 'social';

export interface Lead {
  id: string;
  companyName: string;
  contactName?: string;
  email?: string;
  website?: string;
  location?: string;
  description?: string;
  source: string;
  status: LeadStatus;
  
  // Context for what we are selling to this lead
  offeringDetails?: string;

  // Qualification Data
  qualificationScore?: number; // 0 to 100
  qualificationReason?: string;

  // A/B Testing Data
  variantA_Subject?: string;
  variantA_Body?: string;
  variantB_Subject?: string;
  variantB_Body?: string;
  
  // The currently selected content for sending
  selectedVariant: 'A' | 'B';
  finalSubject?: string;
  finalBody?: string;

  createdAt: number;
}

export interface SearchParams {
  keywords: string;
  location?: string;
  role?: string;
  sources: LeadSourceType[];
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}
