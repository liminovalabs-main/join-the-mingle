import { PublicProfile } from "./auth";

export type ExperienceType =
  | "dinner"
  | "cocktails"
  | "wine_tasting"
  | "brunch"
  | "cooking"
  | "games"
  | "cultural"
  | "wellness"
  | "other";

export interface MingleVenueSummary {
  id: string;
  name: string;
  slug: string;
  category: string;
  area: string;
  address: string;
  postcode: string;
}

export interface Mingle {
  id: string;
  title: string;
  description: string;
  experience_type: ExperienceType;
  experience_type_display: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  duration_minutes: number;
  ticket_price: string;
  capacity: number;
  hero_image: string | null;
  status: "draft" | "submitted" | "changes_requested" | "approved" | "published" | "completed" | "cancelled";
  venue: MingleVenueSummary;
  spots_remaining: number;
  is_sold_out: boolean;
  confirmed_attendees_count: number;
  preview_attendees?: PublicProfile[];
  age_min?: number;
  age_max?: number;
  curator_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface MingleFilterParams {
  experience_type?: string;
  area?: string;
  date_from?: string;
  date_to?: string;
  price_max?: number;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  upcoming_only?: boolean;
  include_past?: boolean;
}

export interface MingleAttendeesResponse {
  success: boolean;
  mingle_id: string;
  mingle_title: string;
  attendees_count: number;
  attendees: PublicProfile[];
}
