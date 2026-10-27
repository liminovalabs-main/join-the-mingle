import { apiClient } from "./client";
import { PaginatedResponse } from "@/types/mingle";
import { Venue, VenueFilterParams, VenueReview } from "@/types/venue";

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
