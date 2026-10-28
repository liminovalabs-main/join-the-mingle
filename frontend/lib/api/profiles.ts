import { apiClient } from "@/lib/api/client";
import { PublicProfile } from "@/types/auth";

export interface AttendingMingleSummary {
  id: string;
  title: string;
  experience_type?: string;
  event_date: string;
  start_time: string;
  hero_image?: string;
  venue_name: string;
  venue_area: string;
}

export interface PublicProfileDetailResponse {
  success: boolean;
  profile: PublicProfile;
  attending_mingles?: AttendingMingleSummary[];
}

export interface PublicProfilesBatchResponse {
  success: boolean;
  profiles: PublicProfile[];
}

/**
 * Fetch a single sanitized public attendee profile by UUID.
 * UK GDPR Compliant: DOB, email, and private settings are omitted.
 */
export async function getPublicProfile(id: string): Promise<PublicProfileDetailResponse> {
  const response = await apiClient.get<PublicProfileDetailResponse>(`/profiles/${id}/`);
  return response.data;
}

/**
 * Batch-fetch sanitized public profiles by array of UUIDs.
 */
export async function getPublicProfiles(ids: string[]): Promise<PublicProfile[]> {
  if (!ids || ids.length === 0) return [];
  const response = await apiClient.get<PublicProfilesBatchResponse>(
    `/profiles/public/?ids=${encodeURIComponent(ids.join(","))}`
  );
  return response.data?.profiles || [];
}
