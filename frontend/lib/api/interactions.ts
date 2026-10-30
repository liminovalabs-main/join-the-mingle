/**
 * Interactions API Client
 *
 * Handles post-mingle experience reviews, 3NF venue reviews,
 * double-blind mutual matching attendee selections, and member connections.
 */
import { apiClient } from "./client";
import { PublicProfile } from "@/types";

export interface MingleFeedbackPayload {
  overall_rating: number;
  comment?: string;
}

export interface VenueReviewPayload {
  rating: number;
  comment?: string;
}

export interface MingleFeedbackResponse {
  success: boolean;
  message: string;
  feedback: {
    id: string;
    overall_rating: number;
    comment: string;
    author_name: string;
    created_at: string;
  };
}

export interface VenueReviewResponse {
  success: boolean;
  message: string;
  review: {
    id: string;
    rating: number;
    comment: string;
    author_name: string;
    created_at: string;
  };
}

export interface MingleSelectionResponse {
  success: boolean;
  message: string;
  selections_recorded: number;
  new_mutual_connections: number;
}

export interface Connection {
  id: string;
  mingle_id: string;
  mingle_title: string;
  mingle_date: string;
  matched_profile: PublicProfile;
  is_celebrated: boolean;
  created_at: string;
}

export interface ReportPayload {
  reason: string;
  details?: string;
  profile_id?: string;
  mingle_id?: string;
  venue_id?: string;
}

/**
 * Submit post-mingle experience feedback.
 * Attendance-gated: Returns 403 if member did not hold confirmed attendance.
 */
export async function submitMingleFeedback(
  mingleId: string,
  payload: MingleFeedbackPayload
): Promise<MingleFeedbackResponse> {
  const response = await apiClient.post<MingleFeedbackResponse>(
    `/mingles/${mingleId}/feedback/`,
    payload
  );
  return response.data;
}

/**
 * Submit direct 3NF review for a London venue.
 */
export async function submitVenueReview(
  venueSlugOrId: string,
  payload: VenueReviewPayload
): Promise<VenueReviewResponse> {
  const response = await apiClient.post<VenueReviewResponse>(
    `/venues/${venueSlugOrId}/reviews/`,
    payload
  );
  return response.data;
}

/**
 * Submit attendee interest selections for mutual matching.
 */
export async function submitMingleSelections(
  mingleId: string,
  targetProfileIds: string[]
): Promise<MingleSelectionResponse> {
  const response = await apiClient.post<MingleSelectionResponse>(
    `/mingles/${mingleId}/select/`,
    { target_profile_ids: targetProfileIds }
  );
  return response.data;
}

/**
 * Fetch all confirmed mutual connections for the authenticated member.
 */
export async function getMyConnections(): Promise<Connection[]> {
  const response = await apiClient.get<Connection[] | { results: Connection[] }>(
    "/interactions/connections/"
  );
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data.results || [];
}

/**
 * Mark a connection celebration modal as viewed.
 */
export async function markConnectionCelebrated(
  connectionId: string
): Promise<{ success: boolean; is_celebrated: boolean }> {
  const response = await apiClient.post<{ success: boolean; is_celebrated: boolean }>(
    `/interactions/connections/${connectionId}/celebrate/`
  );
  return response.data;
}
