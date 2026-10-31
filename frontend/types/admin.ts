import { ExperienceType } from "./mingle";

/**
 * Type definitions for Founder Admin Curation Queues and Platform Settings
 */

export interface VenueApprovalItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  area: string;
  address: string;
  postcode: string;
  description: string;
  hero_image: string | null;
  status: "pending" | "approved" | "rejected";
  commission_rate: string | number;
  manager_email: string;
  manager_name: string;
  created_at: string;
}

export interface MingleApprovalItem {
  id: string;
  venue: string; // Venue UUID
  venue_name: string;
  venue_area: string;
  title: string;
  description: string;
  experience_type: ExperienceType;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  duration_minutes: number;
  ticket_price: string;
  capacity: number;
  age_min: number;
  age_max: number;
  hero_image: string | null;
  status: "draft" | "submitted" | "changes_requested" | "approved" | "published" | "completed" | "cancelled";
  curator_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface PlatformSettingAudit {
  id: string;
  key: string;
  value: unknown;
  notes: string;
  updated_by_email: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CommissionSettingsResponse {
  success: boolean;
  commission_rate: number;
  history: PlatformSettingAudit[];
}

export interface VenueRegistrationInput {
  name: string;
  category: string;
  area: string;
  address: string;
  postcode: string;
  description: string;
  hero_image?: File | null;
}

export interface VenueUpdateInput {
  name?: string;
  category?: string;
  area?: string;
  address?: string;
  postcode?: string;
  description?: string;
  hero_image?: File | null;
}

export interface VenueOpeningHourInput {
  day_of_week: number; // 0=Monday, 6=Sunday
  open_time: string | null; // HH:MM:SS or HH:MM
  close_time: string | null; // HH:MM:SS or HH:MM
  is_closed: boolean;
}

export interface MingleProposalInput {
  venue_id: string;
  title: string;
  description: string;
  experience_type: ExperienceType;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  duration_minutes: number;
  ticket_price: number | string;
  capacity: number;
  age_min: number;
  age_max: number;
  hero_image?: File | null;
}
