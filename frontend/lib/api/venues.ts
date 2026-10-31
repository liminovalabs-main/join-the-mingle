import { apiClient } from "./client";
import { PaginatedResponse, Mingle } from "@/types/mingle";
import { Venue, VenueFilterParams, VenueOpeningHour, VenueReview } from "@/types/venue";
import { VenueOpeningHourInput } from "@/types/admin";

/**
 * Fetch approved London venues with filtering and search.
 */
export async function getVenues(
  params?: VenueFilterParams
): Promise<PaginatedResponse<Venue>> {
  const queryParams = new URLSearchParams();

  if (params?.area && params.area !== "all") {
    queryParams.set("area", params.area);
  }
  if (params?.category && params.category !== "all") {
    queryParams.set("category", params.category);
  }
  if (params?.search) {
    queryParams.set("search", params.search.trim());
  }
  if (params?.ordering) {
    queryParams.set("ordering", params.ordering);
  }
  if (params?.page) {
    queryParams.set("page", String(params.page));
  }
  if (params?.page_size) {
    queryParams.set("page_size", String(params.page_size));
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/venues/?${queryString}` : "/venues/";

  const response = await apiClient.get<PaginatedResponse<Venue>>(url);
  return response.data;
}

/**
 * Retrieve public venue profile (lookup by slug or UUID).
 */
export async function getVenue(slugOrId: string): Promise<Venue> {
  const response = await apiClient.get<Venue>(`/venues/${slugOrId}/`);
  return response.data;
}

/**
 * Retrieve verified reviews for a venue.
 */
export async function getVenueReviews(
  slugOrId: string
): Promise<{ success: boolean; count: number; results: VenueReview[] }> {
  const response = await apiClient.get<{
    success: boolean;
    count: number;
    results: VenueReview[];
  }>(`/venues/${slugOrId}/reviews/`);
  return response.data;
}

/**
 * Submit verified 1-5 star review for a venue.
 */
export async function submitVenueReview(
  slugOrId: string,
  data: { rating: number; comment?: string }
): Promise<{ success: boolean; message: string; review: VenueReview }> {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    review: VenueReview;
  }>(`/venues/${slugOrId}/reviews/`, data);
  return response.data;
}

/**
 * Register a new venue application awaiting founder approval.
 * Automatically elevates applicant to 'venue_manager'.
 */
export async function registerVenue(
  data: FormData | Record<string, unknown>
): Promise<Venue> {
  const response = await apiClient.post<Venue>("/venues/register/", data);
  return response.data;
}

/**
 * Fetch all venues managed by the authenticated user.
 */
export async function getMyVenues(): Promise<PaginatedResponse<Venue>> {
  const response = await apiClient.get<PaginatedResponse<Venue>>("/venues/mine/");
  return response.data;
}

/**
 * Update profile and details of a managed venue.
 */
export async function updateVenue(
  idOrSlug: string,
  data: FormData | Record<string, unknown>
): Promise<Venue> {
  const response = await apiClient.patch<Venue>(`/venues/${idOrSlug}/`, data);
  return response.data;
}

/**
 * Configure or bulk replace the 7-day operating schedule for a venue.
 */
export async function updateVenueOpeningHours(
  venueId: string,
  hours: VenueOpeningHourInput[]
): Promise<VenueOpeningHour[]> {
  const response = await apiClient.put<VenueOpeningHour[]>(
    `/venues/${venueId}/hours/`,
    hours
  );
  return response.data;
}

/**
 * Fetch all hosted and proposed Mingles for a specific managed venue.
 */
export async function getVenueMingles(
  venueId: string,
  page: number = 1
): Promise<PaginatedResponse<Mingle>> {
  const response = await apiClient.get<PaginatedResponse<Mingle>>(
    `/venues/${venueId}/mingles/?page=${page}`
  );
  return response.data;
}
